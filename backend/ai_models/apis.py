import os
from pathlib import Path
from rest_framework import views, permissions, response, status
from sklearn.utils import compute_class_weight
from annotations.models import BinaryAnnotationsModel
from categories.serializers import CategoriesSerializer
from users.serializers import UserSerializer
from .serializers import  AiModelSerializer, AiModelTypeSerializer, PromptSerializer
from .models import Ai_ModelsModel, AiModelTypesModel, PromptsModel, AiModelTrainingsModel
from users import services
import threading, json
from django.shortcuts import get_object_or_404
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from shutil import rmtree

from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.metrics import accuracy_score
from sklearn.linear_model import LogisticRegression
from sklearn.svm import SVC
from sklearn.tree import DecisionTreeClassifier
from sklearn.ensemble import RandomForestClassifier, VotingClassifier
from sklearn.neural_network import MLPClassifier
from sklearn.naive_bayes import GaussianNB
from sklearn.discriminant_analysis import QuadraticDiscriminantAnalysis, LinearDiscriminantAnalysis
from sklearn.neighbors import KNeighborsClassifier
from decisions.models import DatasetsDecisionsModel



class AiModels(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, category_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not category_id:
                return response.Response(data={"error": "Category id is required"}, status=400)
            ai_models = Ai_ModelsModel.objects.filter(deleted=False, category=category_id)
            ai_models = AiModelSerializer(ai_models, many=True).data
            return response.Response(data=ai_models, status=200)

    def post(self, request):
        data = request.data
        serializer = AiModelSerializer(data=data)
        if serializer.is_valid():
            serializer.save(creator=request.user)
            return response.Response(serializer.data, status=201)
        return response.Response(serializer.errors, status=400)
            
class AiModel(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request, model_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not model_id:
                return response.Response(data={"error": "Model id is required"}, status=400)
            try:
                model = Ai_ModelsModel.objects.get(pk=model_id)
            except Ai_ModelsModel.DoesNotExist:
                print("Model not found")
            model = AiModelSerializer(model).data
            return response.Response(data=model, status=200)
    
    def patch(self, request, model_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not model_id:
                return response.Response(data={"error": "Model id is required"}, status=400)
            data = request.data
            if not data:
                return response.Response(data={"error": "Data is required"}, status=400)
            try:
                model = Ai_ModelsModel.objects.get(pk=model_id)
            except Ai_ModelsModel.DoesNotExist:
                print("Model not found")
            
            serializer = AiModelSerializer(model, data=data, partial=True)
            if serializer.is_valid():
                updated_model = serializer.save()
                serialized_data = AiModelSerializer(updated_model).data
                return response.Response(data=serialized_data, status=200)
            else:
                return response.Response(data=serializer.errors, status=400)

    def post(self, request):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            data = request.data
            if not data:
                return response.Response(data={"error": "Data is required"}, status=400)

            data["creator"] = request.user
            serializer = AiModelSerializer(data=data)
            if serializer.is_valid():
                validated_data = serializer.validated_data
                model = serializer.create(validated_data)
                model = AiModelSerializer(model).data
                return response.Response(data=model, status=200)
            else:
                return response.Response(data=serializer.errors, status=400)
            
    def delete(self, request, model_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not model_id:
                return response.Response(data={"error": "Model id is required"}, status=400)
            try:
                model = Ai_ModelsModel.objects.get(pk=model_id)
            except Ai_ModelsModel.DoesNotExist:
                print("Model not found")
                return response.Response(data={"error": "Model not found"}, status=404)
            model.deleted = True
            model.save()
            try:
                trainings = AiModelTrainingsModel.objects.filter(model=model)
                for training in trainings:
                    training.training_status = "deleted"
                    training.save()
            except AiModelTrainingsModel.DoesNotExist:
                print("Training not found")
            
            try:
                rmtree(f"models/{model.id}")
            except FileNotFoundError:
                print(f"Directory models/{model.id} not found")
            for mdl in Ai_ModelsModel.objects.filter(deleted=False, serial_number__gt=model.serial_number):
                mdl.serial_number -= 1
                mdl.save()
            return response.Response(data={"message": "Model deleted successfully"}, status=200)

class PromptsApi(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, category_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not category_id:
                return response.Response(data={"error": "Category id is required"}, status=400)
            prompts = PromptsModel.objects.filter(deleted=False, category=category_id)
            prompts = PromptSerializer(prompts, many=True).data
            return response.Response(data=prompts, status=200)
            
    def post(self, request):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=400)
        else:
            data = request.data
            if not data:
                return response.Response(data={"error": "Data is required"}, status=400)
            data["creator"] = request.user
            serializer = PromptSerializer(data=data)
            if serializer.is_valid():
                validated_data = serializer.validated_data
                prompt = serializer.create(validated_data)
                prompt = PromptSerializer(prompt).data
                return response.Response(data=prompt, status=200)
            else:
                return response.Response(data=serializer.errors, status=400)
    
    def patch(self, request, prompt_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not prompt_id:
                return response.Response(data={"error": "Prompt id is required"}, status=400)
            data = request.data
            if not data:
                return response.Response(data={"error": "Data is required"}, status=400)
            try:
                prompt = PromptsModel.objects.get(pk=prompt_id)
            except PromptsModel.DoesNotExist:
                print("Prompt not found")
            serializer = PromptSerializer(prompt, data=data, partial=True)
            if serializer.is_valid():
                serialized_data = serializer.validated_data
                serializer.update(instance=prompt, validated_data=serialized_data)
                serialized_data['creator'] = UserSerializer(serialized_data['creator']).data
                serialized_data['category'] = CategoriesSerializer(serialized_data['category']).data
                return response.Response(data=serialized_data, status=200)
            else:
                return response.Response(data=serializer.errors, status=400)
            
    def delete(self, request, prompt_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not prompt_id:
                return response.Response(data={"error": "Prompt id is required"}, status=400)
            try:
                prompt = PromptsModel.objects.get(pk=prompt_id)
            except PromptsModel.DoesNotExist:
                print("Prompt not found")
            prompt.deleted = True
            prompt.save()
            
            for prmt in PromptsModel.objects.filter(deleted=False, serial_number__gt=prompt.serial_number):
                prmt.serial_number -= 1
                prmt.save()
            return response.Response(data={"message": "Prompt deleted successfully"}, status=200)

class AiModelTypesListView(views.APIView):
    authentication_classes = [services.ScriberUserAuthentication]
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        try:
            model_types = AiModelTypesModel.objects.filter(deleted=False)
            serializer = AiModelTypeSerializer(model_types, many=True)
            return response.Response(serializer.data, status=status.HTTP_200_OK)
        except Exception as e:
            return response.Response(
                {"error": str(e)}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Map classifier names to their classes
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

class TrainModelAPIView(APIView):
    """
    API view to trigger training of a binary classification model.
    The request should include:
      - model_name: one of the 10 scikit-learn model names
      - datasets: list of dataset IDs
      - splitMethod: "ratio" or "kfold"
      - ratios: { "train": X, "valid": Y, "test": Z } (if splitMethod is "ratio")
      - k: integer between 2 and 10 (if splitMethod is "kfold")
    """
    def post(self, request):
        user = request.user  # assumes an authenticated user
        model_name = request.data.get("model_name")
        model_id = request.data.get("model_id")
        dataset_ids = request.data.get("datasets", [])
        split_method = request.data.get("splitMethod")
        ratios = request.data.get("ratios", None)
        k_value = request.data.get("k", None)

        # Validate inputs
        if model_name not in CLASSIFIER_MAP:
            return Response({"error": "Unsupported classifier."}, status=status.HTTP_400_BAD_REQUEST)
        if not dataset_ids:
            return Response({"error": "No dataset selected."}, status=status.HTTP_400_BAD_REQUEST)
        if split_method not in ["ratio", "kfold"]:
            return Response({"error": "Invalid split method."}, status=status.HTTP_400_BAD_REQUEST)
        if split_method == "ratio":
            if not ratios or sum(ratios.values()) != 100:
                return Response({"error": "Ratios must sum to 100."}, status=status.HTTP_400_BAD_REQUEST)
        else:
            try:
                k_value = int(k_value)
                if k_value < 2 or k_value > 10:
                    return Response({"error": "k must be between 2 and 10."}, status=status.HTTP_400_BAD_REQUEST)
            except Exception:
                return Response({"error": "Invalid k value."}, status=status.HTTP_400_BAD_REQUEST)

        decisions_qs = DatasetsDecisionsModel.objects.filter(dataset__id__in=dataset_ids, deleted=False).select_related("raw_decision")
        if not decisions_qs.exists():
            return Response({"error": "No decisions found for the selected datasets."}, status=status.HTTP_404_NOT_FOUND)
        
        decision_texts = []
        labels = []
        for ds_decision in decisions_qs:
            text = ds_decision.raw_decision.texte_net
            try:
                annotation = BinaryAnnotationsModel.objects.get(decision=ds_decision, creator=user)
            except BinaryAnnotationsModel.DoesNotExist:
                continue
            
            label = int(annotation.label.label)
            decision_texts.append(text)
            labels.append(label)
        
        if not decision_texts:
            return Response({"error": "No decision texts found with annotations."}, status=status.HTTP_404_NOT_FOUND)

        # Create a record for the model and training (status pending)
        datasets = [ds_decision.dataset for ds_decision in decisions_qs]
        ai_model = get_object_or_404(Ai_ModelsModel, pk=model_id)
        training_record = AiModelTrainingsModel.objects.create(
            model=ai_model,
            dataset= datasets,  
            training_status="pending",
            training_parameters=json.dumps(request.data),
            creator=user
        )

        # Run training in a background thread
        thread = threading.Thread(
            target=self.run_training,
            args=(training_record.id, decision_texts, labels, model_name, split_method, ratios, k_value)
        )
        thread.start()

        return Response({
            "message": "Training started.",
            "training_id": str(training_record.id)
        }, status=status.HTTP_200_OK)

    def run_training(self, training_id, texts, labels, model_name, split_method, ratios, k_value):
        training_record = AiModelTrainingsModel.objects.get(id=training_id)
        try:
            # --------- TRAINING PIPELINE (adapted from the standalone script) ---------
            # 1. Vectorize decision texts using TF-IDF (you may add parameters as needed)
            vectorizer = TfidfVectorizer()
            X = vectorizer.fit_transform(texts)
            y = labels

            # 2. Compute class weights if necessary (for unbalanced data)
            import numpy as np
            classes = np.unique(y)
            weights = compute_class_weight(class_weight="balanced", classes=classes, y=y)
            class_weight = {classes[i]: weights[i] for i in range(len(classes))}

            # 3. Instantiate the classifier
            clf_class = CLASSIFIER_MAP[model_name]
            if model_name == "VotingClassifier":
                # For VotingClassifier, define base estimators (customize as needed)
                base_estimators = [
                    ("lr", LogisticRegression(class_weight=class_weight)),
                    ("dt", DecisionTreeClassifier(class_weight=class_weight))
                ]
                clf = clf_class(estimators=base_estimators)
            else:
                # You can pass class_weight if supported by the classifier
                if model_name in ["LogisticRegression", "SVC", "DecisionTreeClassifier", "RandomForestClassifier"]:
                    clf = clf_class(class_weight=class_weight)
                else:
                    clf = clf_class()

            # 4. Split the data and train the model
            if split_method == "ratio":
                train_ratio = ratios.get("train") / 100.0
                X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=1 - train_ratio, random_state=42)
                clf.fit(X_train, y_train)
                y_pred = clf.predict(X_train)
                acc = accuracy_score(y_train, y_pred)
                acc_test = accuracy_score(y_test, clf.predict(X_test))
                splits_info = {"train_size": X_train.shape[0], "accuracy_train": acc,  "test_size": X_test.shape[0], "accuracy_test": acc_test}
            else:
                scores = cross_val_score(clf, X, y, cv=k_value)
                acc = scores.mean()
                clf.fit(X, y)  # Fit on full data after cross-validation
                splits_info = {"k_folds": k_value, "accuracy": acc, "scores": scores.tolist()}

            # 5. Save the trained model (simulate saving using pickle or joblib)
            model_dir = f"models/{training_record.model.id}"
            Path(model_dir).mkdir(parents=True, exist_ok=True)
            model_file_path = os.path.join(model_dir, f"{model_name}_trained.pkl")
            import joblib
            joblib.dump(clf, model_file_path)

            # 6. Update training record with results
            training_record.training_status = "finished"
            training_record.training_result = {"accuracy": acc  if split_method != "ratio" else acc_test
                                               , "splits_info": splits_info}
            training_record.training_log = "Training completed successfully."
            training_record.save()

            # Update the AI model record with the model file path
            ai_model = training_record.model
            ai_model.model_path = model_file_path
            ai_model.save()

            # --------- SEND WEBSOCKET NOTIFICATION ---------
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{training_record.creator.id}",
                {
                    "type": "training_notification",
                    "training_id": str(training_record.id),
                    "status": "finished",
                    "result": {"accuracy": acc, "splits_info": splits_info}
                }
            )

        except Exception as e:
            training_record.training_status = "failed"
            training_record.training_log = str(e)
            training_record.save()
            # Send failure notification
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                f"user_{training_record.creator.id}",
                {
                    "type": "training_notification",
                    "training_id": str(training_record.id),
                    "status": "failed",
                    "result": {"error": str(e)}
                }
            )
