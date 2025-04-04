import json
import os
from pathlib import Path
import threading
import joblib
import nltk
import numpy as np
from django.db.models import Prefetch
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
from annotations.models import BinaryAnnotationsModel
from datasets.models import DatasetsModel
from decisions.models import DatasetsDecisionsModel
from users.models import ScriberUsers
from ai_models.models import Ai_ModelsModel, AiModelTrainingsModel, AiModelTypesModel

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
            print("Anonymous user")
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
        print("Received data:", text_data_loaded)
        model_id = text_data_loaded.get("modelId", None)
        model_type = text_data_loaded["modelType"]
        datasets = text_data_loaded["datasets"]
        split_method = text_data_loaded["splitMethod"]
        ratios = text_data_loaded.get("ratios", None)
        k_folds = text_data_loaded.get("k", None)

        # Get the user asynchronously
        user = await self.get_user(self.scope["user"].id)
        if not user:
            await self.send_error("User not found")
            return

        # Get the model asynchronously
        model = await self.get_model(model_type)
        if not model:
            await self.send_error("Model not found")
            return

        if not datasets:
            await self.send_error("No datasets selected")
            return

        if split_method == "ratios":
            if not ratios or sum(ratios.values()) != 100:
                await self.send_error("Invalid ratios")
                return

        # Fetch decisions and annotations asynchronously
        decision_texts, labels = await self.get_decision_texts_and_labels(datasets, user)
        if not decision_texts:
            await self.send_error("No valid decisions found in the selected datasets")
            return

        datasets = await self.get_decisions_datasets(datasets)
        model_type = await self.get_model_type(model_type)
        # Create a training record asynchronously
        training_record = await self.create_training_record(model_type, model_id, datasets, user, split_method, ratios, k_folds)

        # Run training in a background thread
        thread = threading.Thread(
            target=self.run_training,
            args=(training_record.id, decision_texts, labels, model.type, split_method, ratios, k_folds)
        )
        thread.start()

        await self.send_success("Training started")

    async def send_error(self, message):
        await self.send(text_data=json.dumps({"error": message}))

    async def send_success(self, message):
        await self.send(text_data=json.dumps({"message": message}))

    @database_sync_to_async
    def get_user(self, user_id):
        try:
            return ScriberUsers.objects.get(pk=user_id)
        except ObjectDoesNotExist:
            return None

    @database_sync_to_async
    def get_model(self, model_type):
        try:
            return AiModelTypesModel.objects.get(id=model_type)
        except ObjectDoesNotExist:
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
    def get_model_type(self, model_type_id):
        try:
            return AiModelTypesModel.objects.get(pk=model_type_id)
        except ObjectDoesNotExist:
            return None
        
    @database_sync_to_async
    def create_training_record(self, model_type, model_id, datasets, user, split_method, ratios, k_folds):
        ai_model = Ai_ModelsModel.objects.get(pk=model_id)
        training_item = AiModelTrainingsModel.objects.create(
            model=ai_model,
            training_status="pending",
            type=model_type,
            training_parameters=json.dumps({"splitMethod": split_method, "ratios": ratios, "k_folds": k_folds}),
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
                acc_test = accuracy_score(y_test, clf.predict(X_test))
                splits_info = {"train_size": X_train.shape[0], "accuracy_train": acc, "test_size": X_test.shape[0], "accuracy_test": acc_test}
                print("test finish")
            else:
                scores = cross_val_score(clf, X, y, cv=k_value)
                acc = scores.mean()
                splits_info = {"k_folds": k_value, "accuracy": acc, "scores": scores.tolist()}

            model_dir = f"models/{training_record.model.id}"
            Path(model_dir).mkdir(parents=True, exist_ok=True)
            model_file_path = os.path.join(model_dir, f"{model_name}_trained.pkl")
            joblib.dump(clf, model_file_path)
            training_record.training_status = "finished"
            training_record.training_result = {"accuracy": acc if split_method != "ratio" else acc_test, "splits_info": splits_info}
        except Exception as e:
            training_record.training_status = "error"
            training_record.training_log = f"Training failed: {str(e)}"
        finally:
            training_record.save()

        self.channel_layer.group_send(
            f"user_{training_record.creator.id}_training_{training_record.id}",
            {"type": "training_notification", "result": training_record.training_result}
        )
