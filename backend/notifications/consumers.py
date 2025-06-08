import json
import os
from pathlib import Path
import threading
import joblib
import numpy as np
# from django.db.models import Prefetch
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.db import database_sync_to_async
from django.core.exceptions import ObjectDoesNotExist
from sklearn.metrics import accuracy_score
from sklearn.utils import compute_class_weight
from sklearn.model_selection import cross_val_score, train_test_split
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.discriminant_analysis import LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis
from sklearn.neighbors import KNeighborsClassifier
from nltk.tokenize import word_tokenize
from nltk.stem import PorterStemmer
from num2words import num2words
from nltk.stem import WordNetLemmatizer
from nltk.corpus import stopwords
from annotations.models import BinaryAnnotationsModel, ExtractionAnnotationsModel, ExtractionTextAnnotationsModel
from datasets.models import DatasetsModel, Labels
from decisions.models import DatasetsDecisionsModel
from users.models import ScriberUsers
from ai_models.models import Ai_ModelsModel, AiModelTrainingsModel, AiModelTypesModel
from asgiref.sync import sync_to_async

CLASSIFIER_MAP = {
    "LogisticRegression": LogisticRegression,
    "SVC": SVC,
    "DecisionTreeClassifier": DecisionTreeClassifier,
    "RandomForestClassifier": RandomForestClassifier,
    "MLPClassifier": MLPClassifier,
    "GaussianNB": GaussianNB,
    "QuadraticDiscriminantAnalysis": QuadraticDiscriminantAnalysis,
    "LinearDiscriminantAnalysis": LinearDiscriminantAnalysis,
    "KNeighborsClassifier": KNeighborsClassifier,
    "VotingClassifier": VotingClassifier,
}

class TrainingNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return
        
        self.user = self.scope["user"]
        self.training_id = self.scope.get("training_id")
        self.group_name = f"user_{self.user.id}_training_{self.training_id}"

        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        text_data_loaded = json.loads(text_data)
        model_id = text_data_loaded.get("modelId", None)
        # model_type = text_data_loaded["modelType"]
        datasets = text_data_loaded["datasets"]
        split_method = text_data_loaded["splitMethod"]
        ratios = text_data_loaded.get("ratios", None)
        k_folds = text_data_loaded.get("k", None)

        # Get the user asynchronously
        user = await self.get_user(self.scope["user"].id)
        if not user:
            await self.send_error("Utilisateur non trouvé")
            return

        # Get the model asynchronously
        model = await self.get_model(model_id)
        if not model:
            await self.send_error("Modèle non trouvé")
            return

        if not datasets:
            await self.send_error("Datasets non trouvés")
            return

        if split_method == "ratios":
            if not ratios or sum(ratios.values()) != 100:
                await self.send_error("Ratios non valides")
                return

        # Fetch decisions and annotations asynchronously
        decision_texts, labels = await self.get_decision_texts_and_labels(datasets, user)
        if not decision_texts:
            await self.send_error("Aucune décision trouvée")
            return

        datasets = await self.get_decisions_datasets(datasets)
        model_type = await self.get_model_type(model_id)
        # Create a training record asynchronously
        training_record = await self.create_training_record(model_type, model_id, datasets, user, split_method, ratios, k_folds)

        # Run training in a background thread
        thread = threading.Thread(
            target=self.run_training,
            args=(training_record.id, decision_texts, labels, model_type.type, split_method, ratios, k_folds)
        )
        thread.start()
        await self.send_success("Entraînement en cours")
        
    async def send_error(self, message):
        await self.send(text_data=json.dumps({"erreur": message}))

    async def send_success(self, message):
        await self.send(text_data=json.dumps({"message": message}))

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return ScriberUsers.objects.get(pk=user_id)
        except ObjectDoesNotExist:
            return None

    @database_sync_to_async
    def get_model(self, model_id):
        try:
            return Ai_ModelsModel.objects.get(id=model_id)
        except Ai_ModelsModel.DoesNotExist:
            return None

    @database_sync_to_async
    def get_decisions_datasets(self, dataset_ids):
        return DatasetsModel.objects.filter(id__in=dataset_ids, deleted=False) \
            .values("id").distinct().values_list("id", flat=True)
        
    @database_sync_to_async
    def get_decision_texts_and_labels(self, dataset_ids, user):
        decisions_qs = DatasetsDecisionsModel.objects.filter(
            dataset__id__in=dataset_ids, deleted=False
        ).select_related("raw_decision")

        decision_texts = []
        labels = []

        for ds_decision in decisions_qs:
            text = ds_decision.raw_decision.texte_net
            try:
                annotation = BinaryAnnotationsModel.objects.get(decision=ds_decision, creator=user)
                label = int(annotation.label.label)
                decision_texts.append(text)
                labels.append(label)
            except BinaryAnnotationsModel.DoesNotExist:
                continue

        return decision_texts, labels

    @database_sync_to_async
    def get_model_type(self, model_id):
        try:
            return Ai_ModelsModel.objects.get(pk=model_id).type
        except Ai_ModelsModel.DoesNotExist:
            return None
        
    @database_sync_to_async
    def create_training_record(self, model_type, model_id, datasets, user, split_method, ratios, k_folds):
        ai_model = Ai_ModelsModel.objects.get(pk=model_id)
        training_item = AiModelTrainingsModel.objects.create(
            model=ai_model,
            training_status="attente",
            type=model_type,
            training_parameters=json.dumps({"méthode_de_split": split_method, 
                                            "ratios": ratios, 
                                            "k_folds": k_folds,
                                            "model_type": model_type.type,
                                            }),
            creator=user
        )
        training_item.datasets.set(datasets)
        return training_item

    def run_training(self, training_id, texts, labels, model_name, split_method, ratios, k_value):
        training_record = AiModelTrainingsModel.objects.get(id=training_id)
    
        try:
            vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1000)
            lemmatizer = WordNetLemmatizer()
            stop = stopwords.words('french')
            stemmer = PorterStemmer()
            texts = [
                " ".join([
                    lemmatizer.lemmatize(word) for word in word_tokenize(text.lower())
                    if word.isalpha() and word not in stop
                ])
                for text in texts
            ]
            
            texts = [" ".join([stemmer.stem(word) for word in text.split()]) for text in texts]
            texts = [" ".join([num2words(word) if word.isdigit() else word for word in text.split()]) for text in texts]
            texts = [" ".join([word for word in text.split() if len(word) > 2]) for text in texts]
            texts = [" ".join([word for word in text.split() if word not in stop]) for text in texts]
            texts = [" ".join([word for word in text.split() if not word.isdigit()]) for text in texts]
            texts = [" ".join([word for word in text.split() if len(word) > 2]) for text in texts]
            texts = [" ".join([word for word in text.split() if word not in stop]) for text in texts]
            X = vectorizer.fit_transform(texts)
            y = labels
    
            # Convert sparse matrix to dense if required
            if model_name in ["GaussianNB", "LinearDiscriminantAnalysis", "QuadraticDiscriminantAnalysis"]:
                X = X.toarray()
    
            classes = np.unique(y)
            weights = compute_class_weight(class_weight="balanced", classes=classes, y=y)
            class_weight = {classes[i]: weights[i] for i in range(len(classes))}
    
            clf_class = CLASSIFIER_MAP[model_name]
            if model_name == "VotingClassifier":
                base_estimators = [
                    ("lr", LogisticRegression(class_weight=class_weight)),
                    ("dt", DecisionTreeClassifier(class_weight=class_weight))
                ]
                clf = clf_class(estimators=base_estimators, voting="soft")
            else:
                clf = clf_class(class_weight=class_weight) if model_name in ["LogisticRegression", "SVC", "DecisionTreeClassifier", "RandomForestClassifier"] else clf_class()
            if split_method == "ratio":
                train_ratio = ratios.get("train") / 100.0
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=1 - train_ratio, random_state=42)
                clf.fit(X_train, y_train)
                acc = accuracy_score(y_train, clf.predict(X_train))
                acc = round(acc, 4)
                acc_test = accuracy_score(y_test, clf.predict(X_test))
                acc_test = round(acc_test, 4)
                splits_info = {
                    "type_modèle": model_name,
                    "taille_train": X_train.shape[0],
                    "taille_test": X_test.shape[0],
                    "accuracy_train": acc,
                    "accuracy_test": acc_test
                }
            else:
                scores = cross_val_score(clf, X, y, cv=k_value)
                scores = np.round(scores, 4)
                acc = scores.mean()
                taille_fold = X.shape[0] // k_value
                splits_info = {
                    "type_modèle": model_name,
                    "k_folds": k_value,
                    "taille_folds_train": X.shape[0] - taille_fold,
                    "taille_fold_valid": taille_fold,
                    "accuracy_moy": acc,
                    "scores_valid": scores.tolist()
                }
    
            model_dir = f"models/{training_record.model.id}/{str(training_record.id)}/"
            Path(model_dir).mkdir(parents=True, exist_ok=True)
            model_file_path = os.path.join(model_dir, f"{model_name}_trained.pkl")
            joblib.dump(clf, model_file_path)
            training_record.training_status = "entraîné"
            training_record.training_result = splits_info
        except Exception as e:
            training_record.training_result = {"erreur": str(e), "type_modèle": model_name}
            training_record.training_status = "erreur"
            training_record.training_log = f"Erreur lors de l'entraînement du modèle : {str(e)}"
        finally:
            training_record.save()
            self.channel_layer.group_send(
                f"user_{training_record.creator.id}_training_{training_record.id}",
                {"type": "training_notification", "result": training_record.training_result}
            )


class AnnotationNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return

        self.user = self.scope["user"]
        self.dataset_id = self.scope.get("dataset_id")
        self.model_id = self.scope.get("model_id")
        self.training_id = self.scope.get("training_id")
        self.group_name = f"{self.user.id}_{self.dataset_id[:22]}_{self.training_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)

    async def receive(self, text_data=None, bytes_data=None):
        dataset_id =  self.dataset_id
        model_id = self.model_id
        training_id = self.training_id        
        
        # Validate the dataset, model, and training asynchronously
        dataset = await self.get_dataset(dataset_id)
        model = await self.get_model(model_id)
        trained_model = await self.get_training(training_id)

        if not dataset or not model or not trained_model:
            await self.send_error("Données invalides : dataset, modèle ou entraînement introuvable.")
            return

        # Simulate annotation process
        await self.send_success(f"Annotation commencée avec le modèle {model.name} et l'entraînement {trained_model.id}.")
        await self.perform_annotation(dataset, model, trained_model)

    async def send_error(self, message):
        await self.send(text_data=json.dumps({"error": message}))

    async def send_success(self, message):
        await self.send(text_data=json.dumps({"message": message}))

    async def send_annotation_complete(self, message):
        await self.send(text_data=json.dumps({"message": message}))

    @database_sync_to_async
    def get_dataset(self, dataset_id):
        try:
            return DatasetsModel.objects.get(pk=dataset_id, deleted=False)
        except DatasetsModel.DoesNotExist:
            return None

    @database_sync_to_async
    def get_model(self, model_id):
        try:
            return Ai_ModelsModel.objects.get(pk=model_id, deleted=False)
        except Ai_ModelsModel.DoesNotExist:
            return None

    @database_sync_to_async
    def get_training(self, training_id):
        try:
            return AiModelTrainingsModel.objects.get(pk=training_id, training_status="entraîné")
        except AiModelTrainingsModel.DoesNotExist:
            return None

    @database_sync_to_async
    def get_trained_model_type(self, trained_model):
        try:
            return trained_model.type.type
        except AiModelTypesModel.DoesNotExist:
            return None
    
    @database_sync_to_async
    def get_dataset_id(self, dataset):
        try:
            return dataset.id
        except ObjectDoesNotExist:
            return None
        
    @database_sync_to_async
    def get_text_net(self, decision):
        try:
            decision = DatasetsDecisionsModel.objects.select_related('raw_decision').get(id=decision.id)
            return decision.raw_decision.texte_net
        except (ObjectDoesNotExist, AttributeError):
            return None
        
    async def perform_annotation(self, dataset, model, trained_model):
        try:
            model_dir = f"models/{model.id}/{trained_model.id}/"
            type = await self.get_trained_model_type(trained_model)
            model_file_path = os.path.join(model_dir, f"{type}_trained.pkl")
            
            if not await sync_to_async(os.path.exists)(model_file_path):  # Use sync_to_async for file operations
                await self.send_error(f"Le fichier du modèle entraîné est introuvable : {model_file_path}")
                return

            clf = await sync_to_async(joblib.load)(model_file_path)  # Use sync_to_async for joblib.load()
            dataset_id = await self.get_dataset_id(dataset)
            decisions, decision_texts = await self.get_decisions_texts(dataset_id)
            
            if not decisions:
                await self.send_error("Aucune décision trouvée pour ce dataset.")
                return

            if not decision_texts:
                await self.send_error("Aucun texte valide trouvé dans les décisions.")
                return

            vectorizer = TfidfVectorizer(ngram_range=(1, 2), max_features=1000)
            X = vectorizer.fit_transform(decision_texts)
            
            if isinstance(clf, (GaussianNB, LinearDiscriminantAnalysis, QuadraticDiscriminantAnalysis)):
                X = X.toarray()

            predictions = clf.predict(X)
            annotations = [BinaryAnnotationsModel(
                    decision=decision,
                    label=await self.get_label(prediction),
                    model_annotator=model,
                    trained_model_annotator=trained_model,
                )  for decision, prediction in zip(decisions, predictions)]
            
            await self.bulk_create_annotations(annotations)
            await self.send_annotation_complete(f"Annotation terminée pour le dataset {dataset_id} avec le modèle {model.name}.")
        except Exception as e:
            await self.send_error(f"Erreur lors de l'annotation : {str(e)}")

    @database_sync_to_async
    def get_decisions_texts(self, dataset_id):
        decisions = DatasetsDecisionsModel.objects.filter(dataset_id=dataset_id, deleted=False).select_related("raw_decision")
        decision_texts = []
        for decision in decisions:
            text = decision.raw_decision.texte_net
            decision_texts.append(text)
        return decisions, decision_texts
    
    @database_sync_to_async
    def get_label(self, prediction):
        try:
            return Labels.objects.get(label=str(prediction))
        except Labels.DoesNotExist:
            raise Exception(f"Aucun label trouvé pour la prédiction : {prediction}")

    @database_sync_to_async
    def bulk_create_annotations(self, annotations):
        BinaryAnnotationsModel.objects.bulk_create(annotations)


import re

class ExtractAnnotationNotificationConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        if self.scope["user"].is_anonymous:
            await self.close()
            return
        self.user = self.scope["user"]
        # Get required parameters from query string or scope (example below)
        self.dataset_id = self.scope.get("dataset_id") or self.scope["url_route"]["kwargs"].get("dataset_id")
        self.model_id = self.scope.get("model_id") or self.scope["url_route"]["kwargs"].get("model_id")
        self.prompt_id = self.scope.get("prompt_id") or self.scope["url_route"]["kwargs"].get("prompt_id")
        if not self.dataset_id or not self.model_id or not self.prompt_id:
            await self.send_error("Données manquantes : dataset_id, model_id ou prompt_id.")
            await self.close()
            return

        self.group_name = f"user_{self.user.id}_extract_annotation_{self.dataset_id}"
        await self.channel_layer.group_add(self.group_name, self.channel_name)
        await self.accept()
    
    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(self.group_name, self.channel_name)
    
    async def receive(self, text_data=None, bytes_data=None):
        data = json.loads(text_data)
        dataset_id = data.get("datasetId", self.dataset_id)
        model_id = data.get("modelId", self.model_id)
        prompt_id = data.get("promptId", self.prompt_id)
        dataset = await self.get_dataset(dataset_id)
        if not dataset:
            await self.send_error("Dataset non trouvé")
            return
        decisions, decision_texts = await self.get_decisions_texts(dataset_id)
        if not decision_texts:
            await self.send_error("Aucune décision trouvée")
            return

        prompt = await self.get_prompt(prompt_id)
        prompt_text = prompt.prompt if prompt else None
        json_template = prompt.json_template if prompt and prompt.json_template else None
        batch_size = 10
        batches = [list(zip(decisions, decision_texts))[i:i + batch_size] for i in range(0, len(decision_texts), batch_size)]
        
        all_extraction_annotations = []
        # all_text_annotations = []

        for batch in batches:
            batch_decisions, batch_texts = zip(*batch)
            if "llama" in str(model_id).lower():
                from .inference_scripts import llama_inference
                batch_jsons = await llama_inference(list(batch_texts), prompt_text, json_template)
            elif "ministral" in str(model_id).lower():
                from .inference_scripts import mistral_inference
                batch_jsons = await mistral_inference(list(batch_texts), prompt_text, json_template)
            else:
                batch_jsons = [{} for _ in batch_texts]  # fallback

            # Save ExtractionAnnotationsModel and ExtractionTextAnnotationsModel
            for decision, decision_text, llm_json in zip(batch_decisions, batch_texts, batch_jsons):
                extraction_ann = ExtractionAnnotationsModel(
                    decision=decision,
                    llm_json_result=llm_json,
                    model_annotator=model_id,
                    creator=self.user,
                )
                all_extraction_annotations.append(extraction_ann)

        # Bulk create ExtractionAnnotationsModel and refresh to get IDs
        await sync_to_async(ExtractionAnnotationsModel.objects.bulk_create)(all_extraction_annotations)
        # created_extraction_annotations = await sync_to_async(ExtractionAnnotationsModel.objects.bulk_create)(all_extraction_annotations)
        """ await sync_to_async(lambda: [ann.refresh_from_db() for ann in created_extraction_annotations])()
        
        # Now create ExtractionTextAnnotationsModel for each key-value in the JSON
        for extraction_ann in created_extraction_annotations:
            try:
                llm_json = json.loads(extraction_ann.llm_json_result)
            except json.JSONDecodeError:
                llm_json = str(extraction_ann.llm_json_result)
            decision_text = await get_decision_text_from_extraction_ann(extraction_ann)
            if type(llm_json) is dict:
                for key, value in llm_json.items():
                    
                    if not isinstance(value, str):
                        all_text_annotations.append(
                            ExtractionTextAnnotationsModel(
                                extraction=extraction_ann,
                                text=value,
                                start_offset=-1,
                                end_offset=-1,
                                label=key,
                            )
                        )
                        continue
                    # Find all occurrences of value in decision_text for offsets
                    matches = [m for m in re.finditer(re.escape(value), decision_text)]
                    if matches:
                        # for match in matches:
                        all_text_annotations.append(
                            ExtractionTextAnnotationsModel(
                                extraction=extraction_ann,
                                text=value,
                                start_offset=matches[0].start(),
                                end_offset=matches[0].end(),
                                label=key,
                            )
                        )
                    else:
                        # If not found, store with -1 offsets
                        all_text_annotations.append(
                            ExtractionTextAnnotationsModel(
                                extraction=extraction_ann,
                                text=value,
                                start_offset=-1,
                                end_offset=-1,
                                label=key,
                            )
                        )
        """    
            # Bulk create ExtractionTextAnnotationsModel
        # await sync_to_async(ExtractionTextAnnotationsModel.objects.bulk_create)(all_text_annotations)
        # all_text_annotations.clear()
        
        await self.send_annotation_complete("Annotations extractives enregistrées avec succès.")
        # close the connection
        await self.close()
    
    async def send_error(self, message):
        await self.send(text_data=json.dumps({"error": message}))
    
    async def send_annotation_complete(self, message):
        await self.send(text_data=json.dumps({"message": message}))
    
    @database_sync_to_async
    def get_dataset(self, dataset_id):
        from datasets.models import DatasetsModel
        try:
            return DatasetsModel.objects.get(pk=dataset_id, deleted=False)
        except DatasetsModel.DoesNotExist:
            return None

    @database_sync_to_async
    def get_decisions_texts(self, dataset_id):
        decisions = DatasetsDecisionsModel.objects.filter(dataset_id=dataset_id, deleted=False).select_related("raw_decision")
        decision_texts = [d.raw_decision.texte_net for d in decisions]
        return decisions, decision_texts


    @database_sync_to_async
    def get_prompt(self, prompt_id):
        from ai_models.models import PromptsModel
        try:
            return PromptsModel.objects.get(pk=prompt_id)
        except PromptsModel.DoesNotExist:
            return None
        except Exception as e:
            return None

@sync_to_async
def get_decision_text_from_extraction_ann(extraction_ann):
    decision = extraction_ann.decision
    if decision and decision.raw_decision:
        return decision.raw_decision.texte_net
    return ""

