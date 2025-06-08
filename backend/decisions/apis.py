from rest_framework import views, permissions, response, generics, status
from django.db.models import Count, Q
from django.shortcuts import get_object_or_404
from annotations.models import BinaryAnnotationsModel, TextAnnotationsModel
from annotations.serializers import BinaryAnnotationsSerializer
from datasets.models import DatasetsModel, Labels
from users import services as users_services
from . import services
from .models import RawDecisionsModel, DatasetsDecisionsModel
from .serializers import DecisionWithAnnotationsSerializer, RawDecisionsSerializer, DatasetsDecisionsSerializer
from uuid import UUID
from time import time

class RawDecisionsListView(generics.ListAPIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    queryset = RawDecisionsModel.objects.all()
    serializer_class = RawDecisionsSerializer

class DatasetDecisionsListView(generics.ListAPIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get_queryset(self):
        dataset_id = self.kwargs['dataset_id']
        print("dataset_id", dataset_id)
        return DatasetsDecisionsModel.objects.filter(dataset=UUID(dataset_id).hex)

    serializer_class = DatasetsDecisionsSerializer

class BinDatasetRawDecisionsView(views.APIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request, dataset_id):
        if not dataset_id:
            return response.Response({"error": "dataset_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user

        try:
            label_1 = Labels.objects.get(label='1')
        except Labels.DoesNotExist:
            return response.Response({"error": "No label with label=1 found"}, status=status.HTTP_404_NOT_FOUND)

        # Optimisation : Récupérer toutes les décisions en une seule requête
        dataset_decisions = DatasetsDecisionsModel.objects.filter(dataset=dataset_id, deleted=False)\
            .select_related('raw_decision')

        raw_decisions = [decision.raw_decision for decision in dataset_decisions]

        # Sérialisation des décisions
        raw_decisions_serializer = RawDecisionsSerializer(raw_decisions, many=True)
        # raw_decisions_serializer.data.sort(key=lambda x: x['j_ville']+x['j_date'], reverse=True)
        # Optimisation : Récupérer toutes les annotations de l'utilisateur en une seule requête
        annotations = BinaryAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            creator=user
        ).select_related('label', 'decision')

        existing_decision_ids = set(annotations.values_list('decision_id', flat=True))

        # Création des annotations manquantes en batch
        new_annotations = [
            BinaryAnnotationsModel(
                decision=decision,
                label=label_1,
                creator=user,
                state="unannotated",
                # updator=user
            )
            for decision in dataset_decisions if decision.id not in existing_decision_ids
        ]
        BinaryAnnotationsModel.objects.bulk_create(new_annotations)

        annotations = BinaryAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            creator=user
        ).select_related('label', 'decision')

        annotations_serializer = BinaryAnnotationsSerializer(annotations, many=True)
        return response.Response({
            "raw_decisions": raw_decisions_serializer.data,
            "created_annotations": len(new_annotations),
            "annotations": annotations_serializer.data
        }, status=status.HTTP_200_OK)

    def delete(self, request, dataset_id):
        if not dataset_id:
            return response.Response({"error": "dataset_id query parameter is required"}, status=status.HTTP_400_BAD_REQUEST)

        decisions_ids = request.data.get("decisionsIds", [])
        if not decisions_ids:
            return response.Response({"error": "No decision IDs provided"}, status=status.HTTP_400_BAD_REQUEST)
        
        # Marquer les décisions comme supprimées en une seule requête
        deleted_count = DatasetsDecisionsModel.objects.filter(
            raw_decision__id__in=decisions_ids, dataset__id=dataset_id
        ).update(deleted=True)

        if deleted_count == 0:
            return response.Response({"error": "No matching decisions found"}, status=status.HTTP_404_NOT_FOUND)

        # Marquer les annotations comme supprimées pour l'utilisateur actuel
        user = request.user
        deleted_count = BinaryAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            # creator=user,
            decision_id__in=decisions_ids  # Ajout d'un filtre pour éviter les annotations non concernées
        ).update(deleted=True)
        return response.Response({"message": f"{deleted_count} decisions and their annotations marked as deleted."}, status=status.HTTP_200_OK)



class ExtDatasetRawDecisionsView(views.APIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request, dataset_id):
        try:
            dataset = DatasetsModel.objects.get(id=dataset_id)
        except DatasetsModel.DoesNotExist:
            return response.Response({"error": "Dataset not found"}, status=status.HTTP_404_NOT_FOUND)
        
        decisions = DatasetsDecisionsModel.objects.filter(dataset=dataset, deleted=False)
        serializer = DecisionWithAnnotationsSerializer(decisions, many=True, context={'request': request})
        
        # Calculate total annotation counts for the dataset
        user = request.user
        total_counts = TextAnnotationsModel.objects.filter(
            decision__dataset=dataset, creator=user, deleted=False
        ).values('label').annotate(count=Count('id', filter=Q(decision__dataset=dataset, creator=user, deleted=False)), )
        total_annotation_counts = {str(item['label']): item['count'] for item in total_counts}
        
        response_data = {
            "decisions": serializer.data,
            "total_annotation_counts": total_annotation_counts
        }
        return response.Response(response_data, status=status.HTTP_200_OK)

    def delete(self, request, dataset_id):
        if not dataset_id:
            return response.Response({"error": "dataset_id path parameter is required"}, 
                                    status=status.HTTP_400_BAD_REQUEST)

        decisions_ids = request.data.get("decisionsIds", [])
        
        if not decisions_ids:
            return response.Response({"error": "No decision IDs provided"}, 
                                    status=status.HTTP_400_BAD_REQUEST)
        
        # Mark dataset decisions as deleted
        dataset_decisions = DatasetsDecisionsModel.objects.filter(
            id__in=decisions_ids, 
            dataset__id=dataset_id
        )
        updated = dataset_decisions.update(deleted=True)
        if updated == 0:
            return response.Response({"error": "No matching decisions found"}, 
                                    status=status.HTTP_404_NOT_FOUND)

        # Mark related text annotations as deleted
        user = request.user
        text_annotations_deleted = TextAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            creator=user,
            decision_id__in=decisions_ids
        ).update(deleted=True)
        return response.Response({
            "message": f"Marked {updated} decisions and {text_annotations_deleted} annotations as deleted"
        }, status=status.HTTP_200_OK)
 
class RawDecisionsDetailView(views.APIView):
    def get(self, request, decision_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            decision = services.get_raw_decision(decision_id)
            serializer = RawDecisionsSerializer(decision)
            return response.Response(data=serializer.data, status=200)
        
    def post(self, request):
        serialized_data  = RawDecisionsSerializer(data=request.data)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = services.create_raw_decision(validated_data)    
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)
        
    def patch(self, request, decision_id):
        serialized_data = RawDecisionsSerializer( data=request.data, partial=True)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = services.update_raw_decision(decision_id, validated_data)
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)
    
    def delete(self, request, decision_id):
        services.delete_raw_decision(decision_id)
        return response.Response({"message": "decision deleted successfully"}, status=204)

class DatasetDecisionsDetailView(views.APIView):
    def get(self, request, decision_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            decision = services.get_decision(decision_id)
            serializer = DatasetsDecisionsSerializer(decision)
            return response.Response(data=serializer.data, status=200)
        
    def post(self, request, dataset_id):
        serialized_data  = DatasetsDecisionsSerializer(data=request.data, many=True)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = services.create_decision(dataset_id, validated_data)    
            print("here")
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)
        
    def patch(self, request, decision_id):
        serialized_data = DatasetsDecisionsSerializer( data=request.data, partial=True)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = services.update_decision(decision_id, validated_data)
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)
    
    def delete(self, request, decision_id):
        services.delete_decision(decision_id)
        return response.Response({"message": "decision deleted successfully"}, status=204)
    
class VillesListView(views.APIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def get(self, request):
        juridictions = request.GET.getlist('juridictions[]') 
        villes = RawDecisionsModel.objects.filter(j_juridiction__in=juridictions).values('j_ville').distinct().order_by('j_ville').values_list('j_ville', flat=True)
        villes = list(villes)
        return response.Response(data=villes, status=200)


class Associer(views.APIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def post(self, request):
        dataset_id = request.data.get('dataset_id')
        raw_decisions = request.data.get('raw_decisions')
        dataset = get_object_or_404(DatasetsModel, pk=UUID(dataset_id).hex)
        validated_data = []
        for raw_decision in raw_decisions:
            raw_decision = get_object_or_404(RawDecisionsModel, pk=UUID(raw_decision).hex)
            serializer = DatasetsDecisionsSerializer(data={"dataset": dataset, "raw_decision": raw_decision})
            if serializer.is_valid():
                validated_decision = serializer.validated_data
                validated_data.append(serializer.create(validated_decision))
        DatasetsDecisionsModel.objects.bulk_create(validated_data)
        # update dataset size
        dataset.size = DatasetsDecisionsModel.objects.filter(dataset=dataset).count()
        dataset.save()
        return response.Response(data={"message": "Decision associated successfully"}, status=200)

class LLMDatasetDecisionsDeleteView(views.APIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def delete(self, request, dataset_id):
        decisions_ids = request.data.get("decisionsIds", [])
        model_annotator = request.data.get("modelAnnotator", "")
        if not decisions_ids or not model_annotator:
            return response.Response({"error": "Missing decisionsIds or modelAnnotator"}, status=400)
        model_name, created_at = model_annotator.split("||")
        model_name = model_name.strip()
        created_at = created_at.strip()
        from datetime import datetime, timedelta
        try:
            dt = datetime.strptime(created_at, "%Y-%m-%d %H:%M")
            dt_end = dt + timedelta(minutes=1)
        except Exception:
            return response.Response({"error": "Invalid created_at format"}, status=400)
        # Mark decisions as deleted
        deleted_count = DatasetsDecisionsModel.objects.filter(
            id__in=decisions_ids, dataset__id=dataset_id
        ).update(deleted=True)
        # Mark related LLM extractions as deleted for this model and time
        from annotations.models import ExtractionAnnotationsModel
        ExtractionAnnotationsModel.objects.filter(
            decision_id__in=decisions_ids,
            model_annotator=model_name,
            created_at__gte=dt,
            created_at__lt=dt_end
        ).update(deleted=True)
        return response.Response({"message": f"{deleted_count} decisions and their LLM annotations marked as deleted"}, status=200)


class LogDatasetDownloadView(views.APIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        dataset_id = request.data.get("dataset_id")
        file_name = request.data.get("file_name")
        user = request.user
        # Save to your logging model/table as needed
        # Example:
        # DatasetDownloadLog.objects.create(user=user, dataset_id=dataset_id, file_name=file_name)
        print(f"User {user} downloaded {file_name} from dataset {dataset_id}")
        return response.Response({"message": "Download logged"}, status=200)