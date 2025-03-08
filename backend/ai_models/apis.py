from rest_framework import views, permissions, response, status
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

# scikit-learn imports
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
            ai_models = Ai_ModelsModel.objects.filter(deleted=False)
            ai_models = AiModelSerializer(ai_models, many=True).data
            return response.Response(data=ai_models, status=200)
            
class AiModel(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
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
                serialized_data = serializer.validated_data
                serializer.update(instance=model, validated_data=serialized_data)
                serialized_data['creator'] = UserSerializer(serialized_data['creator']).data
                serialized_data['category'] = CategoriesSerializer(serialized_data['category']).data
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
            model.deleted = True
            model.save()
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

        # Combine decisions from all selected datasets
        decisions_qs = DatasetsDecisionsModel.objects.filter(dataset__id__in=dataset_ids, deleted=False).select_related("raw_decision")
        if not decisions_qs.exists():
            return Response({"error": "No decisions found for the selected datasets."}, status=status.HTTP_404_NOT_FOUND)
        
        decision_texts = []
        labels = []
        # For each decision, get the text (using 'texte_net') and determine label from binary annotations.
        for ds_decision in decisions_qs:
            text = ds_decision.raw_decision.texte_net
            # Assume that if any annotation’s label (string) equals "positive" (case-insensitive) then label = 1; else 0.
            annotations = ds_decision.binary_annotations_decision.all()
            if not annotations.exists():
                continue
            label = 1 if any(a.label.label.lower() == "positive" for a in annotations) else 0
            decision_texts.append(text)
            labels.append(label)
        
        if not decision_texts:
            return Response({"error": "No decision texts found with annotations."}, status=status.HTTP_404_NOT_FOUND)

        # Create a record for the model and training (status pending)
        ai_model = Ai_ModelsModel.objects.create(
            name=model_name,
            creator=user,
            model_type="classification",
            description="Training model for binary classification"
        )
        training_record = AiModelTrainingsModel.objects.create(
            model=ai_model,
            dataset=decisions_qs.first().dataset,  # if multiple, you might create a merged dataset record
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
        # Retrieve the training record (do not pass ORM objects directly to threads)
        training_record = AiModelTrainingsModel.objects.get(id=training_id)
        try:
            # Vectorize decision texts using TF-IDF
            vectorizer = TfidfVectorizer()
            X = vectorizer.fit_transform(texts)
            y = labels

            # Get the classifier class and instantiate it
            clf_class = CLASSIFIER_MAP[model_name]
            if model_name == "VotingClassifier":
                # For VotingClassifier, define some base estimators (customize as needed)
                base_estimators = [
                    ("lr", LogisticRegression()),
                    ("dt", DecisionTreeClassifier())
                ]
                clf = clf_class(estimators=base_estimators)
            else:
                clf = clf_class()

            if split_method == "ratio":
                train_ratio = ratios.get("train") / 100.0
                X_train, X_temp, y_train, _ = train_test_split(X, y, test_size=1 - train_ratio, random_state=42)
                clf.fit(X_train, y_train)
                y_pred = clf.predict(X_train)
                acc = accuracy_score(y_train, y_pred)
                splits_info = {"train_size": X_train.shape[0], "accuracy": acc}
            else:
                scores = cross_val_score(clf, X, y, cv=k_value)
                acc = scores.mean()
                clf.fit(X, y)  # fit on the full dataset after cross-validation
                splits_info = {"k_folds": k_value, "accuracy": acc, "scores": scores.tolist()}

            # Simulate saving the trained model (e.g. using pickle or joblib in production)
            model_file_path = f"models/{training_record.model.id}/{model_name}_trained.pkl"
            # For example:
            # import joblib
            # joblib.dump(clf, model_file_path)

            # Update training record with results
            training_record.training_status = "finished"
            training_record.training_result = {"accuracy": acc, "splits_info": splits_info}
            training_record.training_log = "Training completed successfully."
            training_record.save()

            # Update the AI model record with the (simulated) model path
            ai_model = training_record.model
            ai_model.model_path = model_file_path
            ai_model.save()

            # Optionally, trigger a websocket or push notification to alert the user that training is finished.
            # notify_user(training_record.creator, training_record.id, "finished")

        except Exception as e:
            training_record.training_status = "failed"
            training_record.training_log = str(e)
            training_record.save()
