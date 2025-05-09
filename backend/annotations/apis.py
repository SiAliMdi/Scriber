import json
from uuid import UUID
from django.shortcuts import get_object_or_404
from rest_framework import views, permissions, response, status
from annotations.models import BinaryAnnotationsModel, ExtractionTextAnnotationsModel, TextAnnotationsModel, ExtractionAnnotationsModel
from decisions.models import DatasetsDecisionsModel
from decisions.serializers import RawDecisionsSerializer
from .serializers import BinaryAnnotationsSerializer, TextAnnotationsCreateSerializer, TextAnnotationsSerializer, ExtractionTextAnnotationsSerializer
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
        from django.db.models.functions import TruncMinute

        # Annotate created_at to minute precision
        qs = ExtractionAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            model_annotator__isnull=False
        ).annotate(
            created_minute=TruncMinute('created_at')
        ).values(
            'model_annotator', 'created_minute'
        ).distinct()

        # Format the datetime as string
        result = [ f"{row['model_annotator']} || {row['created_minute'].strftime('%Y-%m-%d %H:%M')}" if row["created_minute"] else None
            for row in qs ]
        result = list(set(result))  # Remove duplicates
        #     {
        #         "model_annotator": row["model_annotator"],
        #         "created_at": row["created_minute"].strftime("%Y-%m-%d %H:%M")
        #         if row["created_minute"] else None
        #     }
        #     for row in qs
        # ]
        return response.Response(result, status=status.HTTP_200_OK)

class ValidateDecisionAnnotationsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, decision_id):
        # Bulk update all text annotations for the decision to validated
        annotations = TextAnnotationsModel.objects.filter(decision_id=decision_id, deleted=False)
        updated_count = annotations.update(state="validated")
        return response.Response({"updated": updated_count}, status=status.HTTP_200_OK)


from .serializers import ExtractionAnnotationsSerializer
from datetime import datetime, timedelta

class ExtractionAnnotationsByModelView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        select = request.GET.get("model_annotator")
        if not select or "||" not in select:
            return response.Response({"error": "Missing or invalid model_annotator"}, status=status.HTTP_400_BAD_REQUEST)
        model_annotator = select.split("||")[0].strip()
        created_at_filter = select.split("||")[1].strip()
        if not model_annotator or not created_at_filter:
            return response.Response({"error": "Missing model_annotator or created_at"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            # Parse the datetime string
            dt = datetime.strptime(created_at_filter, "%Y-%m-%d %H:%M")
            dt_end = dt + timedelta(minutes=1)
            extractions = ExtractionAnnotationsModel.objects.filter(
                decision__dataset=dataset_id,
                model_annotator=model_annotator,
                created_at__gte=dt,
                created_at__lt=dt_end
            ).prefetch_related("extraction_text")
            serializer = ExtractionAnnotationsSerializer(extractions, many=True)
            return response.Response(serializer.data, status=status.HTTP_200_OK)
        except ValueError:
            return response.Response({"error": "Invalid date format, should be yyyy-mm-dd hh:mm"}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return response.Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class DecisionsWithLLMExtractionsView(APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        select = request.GET.get("model_annotator")
        if not select or "||" not in select:
            return response.Response({"error": "Missing or invalid model_annotator"}, status=status.HTTP_400_BAD_REQUEST)
        model_annotator = select.split("||")[0].strip()
        created_at_filter = select.split("||")[1].strip()
        if not model_annotator or not created_at_filter:
            return response.Response({"error": "Missing model_annotator or created_at"}, status=status.HTTP_400_BAD_REQUEST)
        try:
            dt = datetime.strptime(created_at_filter, "%Y-%m-%d %H:%M")
            dt_end = dt + timedelta(minutes=1)
        except ValueError:
            return response.Response({"error": "Invalid date format, should be yyyy-mm-dd hh:mm"}, status=status.HTTP_400_BAD_REQUEST)

        # Get all decisions for the dataset
        decisions = DatasetsDecisionsModel.objects.filter(dataset=dataset_id, deleted=False)

        # Get all extractions for this model/date
        extractions = ExtractionAnnotationsModel.objects.filter(
            decision__in=decisions,
            model_annotator=model_annotator,
            created_at__gte=dt,
            created_at__lt=dt_end
        )
        extractions_by_decision = {e.decision_id: e for e in extractions}

        # Build response
        result = []
        for decision in decisions:
            extraction = extractions_by_decision.get(decision.id)
            
            result.append({
                "decision": {
                    "id": decision.id,
                    "j_texte": decision.raw_decision.texte_net,
                    "j_chambre": decision.raw_decision.j_chambre,
                    "j_date": decision.raw_decision.j_date,
                    "j_rg": decision.raw_decision.j_rg,
                    "j_ville": decision.raw_decision.j_ville,
                    "j_type": decision.raw_decision.j_type,
                    "j_juridiction": decision.raw_decision.j_juridiction,
                },
                "extraction": ExtractionAnnotationsSerializer(extraction).data if extraction else None
            })
        return response.Response(result, status=status.HTTP_200_OK)
    
    
class ExtractionAnnotationUpdateView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def patch(self, request, extraction_id):
        try:
            extraction = ExtractionAnnotationsModel.objects.get(id=extraction_id)
            llm_json_result = request.data.get("llm_json_result")
            state = request.data.get("state")
            # convert llm_json_result to JSON if it's a string
            if isinstance(llm_json_result, str):
                try:
                    llm_json_result = json.loads(llm_json_result)
                    print("llm converted to JSON")
                except json.JSONDecodeError:
                    return response.Response({"error": "Invalid JSON format"}, status=status.HTTP_400_BAD_REQUEST)
            if llm_json_result is not None:
                extraction.llm_json_result = llm_json_result
            if state:
                extraction.state = state
            extraction.updater = request.user
            extraction.save()
            print("extraction updated",llm_json_result)
            return response.Response({"message": "Extraction updated"}, status=status.HTTP_200_OK)
        except ExtractionAnnotationsModel.DoesNotExist:
            return response.Response({"error": "Extraction not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return response.Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
