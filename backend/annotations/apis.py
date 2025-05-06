from uuid import UUID
from django.shortcuts import get_object_or_404
from rest_framework import views, permissions, response, status
from annotations.models import BinaryAnnotationsModel, TextAnnotationsModel, ExtractionAnnotationsModel
from decisions.models import DatasetsDecisionsModel
from decisions.serializers import RawDecisionsSerializer
from .serializers import BinaryAnnotationsSerializer, TextAnnotationsCreateSerializer, TextAnnotationsSerializer
from users.models import ScriberUsers
from datasets.models import Labels
from ai_models.models import Ai_ModelsModel, AiModelTrainingsModel
from users import services
from ai_models.serializers import AiModelSerializer, AiModelTrainingSerializer
from users.serializers import UserSerializer
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView


class BinDatasetRawDecisionsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, annotation_id):
        annotation = get_object_or_404(BinaryAnnotationsModel, pk=UUID(annotation_id).hex)
        annotation.label = get_object_or_404(Labels, label=request.data.get('label'))
        annotation.state = "annotated"
        annotation.save()
        return response.Response({"message": "Annotation updated successfully"}, status=200)
    
# Create a new annotation
class ExtAnnotationCreateView(views.APIView):
    def post(self, request):
        serializer = TextAnnotationsCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            annotation = serializer.save()
            return response.Response(TextAnnotationsSerializer(annotation).data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete an annotation
class ExtAnnotationDeleteView(views.APIView):
    def delete(self, request, annotation_id):
        try:
            annotation = TextAnnotationsModel.objects.get(id=annotation_id, creator=request.user)
            annotation.deleted = True
            annotation.save()
            return response.Response(status=status.HTTP_204_NO_CONTENT)
        except TextAnnotationsModel.DoesNotExist:
            return response.Response({"error": "Annotation not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)
        
class UsersWithAnnotationsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        try:
            # Fetch unique user IDs from BinaryAnnotationsModel
            user_ids = BinaryAnnotationsModel.objects.filter(
                decision__dataset_id=dataset_id
            ).values_list("creator__id", flat=True).distinct()

            # Fetch the corresponding user objects
            users = ScriberUsers.objects.filter(id__in=user_ids).distinct()
            # Serialize the user objects
            serialized_users = UserSerializer(users, many=True).data

        except BinaryAnnotationsModel.DoesNotExist:
            return response.Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return response.Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return response.Response(serialized_users, status=status.HTTP_200_OK)

class TrainedModelsForDatasetView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        # Fetch unique trained model IDs
        trained_model_ids = BinaryAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id
        ).values_list("trained_model_annotator__id", flat=True).distinct()

        # Filter out None values
        trained_model_ids = [model_id for model_id in trained_model_ids if model_id is not None]

        # Fetch the trained model objects
        trained_models = AiModelTrainingsModel.objects.filter(id__in=trained_model_ids).distinct()

        # Serialize the trained models
        trained_models_serialized = AiModelTrainingSerializer(trained_models, many=True).data

        # Fetch the unique models associated with the trained models
        model_ids = trained_models.values_list("model__id", flat=True).distinct()
        models = Ai_ModelsModel.objects.filter(id__in=model_ids).distinct()

        # Serialize the models
        models_serialized = AiModelSerializer(models, many=True).data

        # Combine the serialized data
        response_data = {
            "models": models_serialized,
            "trained_models": trained_models_serialized,
        }
        return response.Response(response_data, status=status.HTTP_200_OK)

class UpdateAnnotationValidationStateView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, annotation_id):
        try:
            annotation = get_object_or_404(BinaryAnnotationsModel, pk=annotation_id)
            state = request.data.get('state')
            if state not in ['unannotated','annotated', 'validated', 'corrected']:
                return response.Response({"error": "Invalid state"}, status=status.HTTP_400_BAD_REQUEST)

            label = request.data.get('label')    
            
            annotation.label = get_object_or_404(Labels, label=label)
            annotation.state = state
            annotation.updator = request.user
            annotation.save()
            return response.Response({"message": "Annotation state updated successfully"}, status=status.HTTP_200_OK)
        except BinaryAnnotationsModel.DoesNotExist:
            return response.Response({"error": "Annotation not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return response.Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)            

class FetchAnnotationsWithValidationStateView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        annotator = request.query_params.get('annotator', None)
        trained_model_annotator = request.query_params.get('trained_model_annotator', None)
        if annotator:
            annotations = BinaryAnnotationsModel.objects.filter(decision__dataset_id=dataset_id, creator=annotator).select_related('label', 'decision')
        elif trained_model_annotator:
            annotations = BinaryAnnotationsModel.objects.filter(decision__dataset_id=dataset_id, trained_model_annotator=trained_model_annotator).select_related('label', 'decision')
        else:
            return response.Response({"error": "Invalid parameters"}, status=status.HTTP_400_BAD_REQUEST) 
        serialized_annotations = BinaryAnnotationsSerializer(annotations, many=True).data
        dataset_decisions = DatasetsDecisionsModel.objects.filter(dataset=dataset_id, deleted=False).select_related('raw_decision')
        raw_decisions = [decision.raw_decision for decision in dataset_decisions]

        raw_decisions_serializer = RawDecisionsSerializer(raw_decisions, many=True).data
        # raw_decisions_serializer.sort(key=lambda x: x['j_ville']+x['j_date'], reverse=True)

        # Build a mapping from raw_decision id to its order in the sorted list
        raw_decision_id_order = {rd['id']: idx for idx, rd in enumerate(raw_decisions_serializer)}
        # Sort annotations to match the order of raw_decisions
        serialized_annotations.sort(
            key=lambda ann: raw_decision_id_order.get(ann['decision'], float('inf'))
        )

        return response.Response({
            "raw_decisions": raw_decisions_serializer,
            "annotations": serialized_annotations
        }
            , status=status.HTTP_200_OK)

class ExtractiveUsersWithAnnotationsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        user_ids = TextAnnotationsModel.objects.filter( decision__dataset_id=dataset_id).values_list("creator__id", flat=True).distinct()
        users = ScriberUsers.objects.filter(id__in=user_ids)
        serialized_users = UserSerializer(users, many=True).data
        return response.Response(serialized_users, status=status.HTTP_200_OK)

class ExtractiveModelsWithAnnotationsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        model_names = ExtractionAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            model_annotator__isnull=False
        ).values_list("model_annotator", flat=True).distinct()
        model_names = [model_name for model_name in model_names if model_name is not None]
        model_names = list(set(model_names))
        return response.Response(model_names, status=status.HTTP_200_OK)

class ValidateDecisionAnnotationsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, decision_id):
        # Bulk update all text annotations for the decision to validated
        annotations = TextAnnotationsModel.objects.filter(decision_id=decision_id, deleted=False)
        updated_count = annotations.update(state="validated")
        return response.Response({"updated": updated_count}, status=status.HTTP_200_OK)
