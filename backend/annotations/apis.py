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
# from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.views import APIView
from sklearn.metrics import cohen_kappa_score
from sklearn.metrics import jaccard_score





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


class BinaryAnnotationAgreementView(APIView):
    """
    API to calculate inter-agreement for binary annotations.
    """
    def get(self, request, dataset_id):
        user1_id = request.query_params.get("user1")
        user2_id = request.query_params.get("user2")
        model_id = request.query_params.get("model")

        # Fetch binary annotations for the dataset
        annotations = BinaryAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            deleted=False
        ).select_related("decision", "label", "creator", "model_annotator")

        # Filter annotations by users or models
        user1_annotations = annotations.filter(creator_id=user1_id) if user1_id else None
        user2_annotations = annotations.filter(creator_id=user2_id) if user2_id else None
        model_annotations = annotations.filter(model_annotator_id=model_id) if model_id else None

        # Prepare data for comparison
        decision_ids = set(annotations.values_list("decision_id", flat=True))
        user1_labels = {a.decision_id: a.label.label for a in user1_annotations} if user1_annotations else {}
        user2_labels = {a.decision_id: a.label.label for a in user2_annotations} if user2_annotations else {}
        model_labels = {a.decision_id: a.label.label for a in model_annotations} if model_annotations else {}

        # Calculate agreement
        results = {}
        if user1_annotations and user2_annotations:
            user1 = [user1_labels.get(d, None) for d in decision_ids]
            user2 = [user2_labels.get(d, None) for d in decision_ids]
            results["user1_vs_user2"] = cohen_kappa_score(user1, user2)

        if user1_annotations and model_annotations:
            user1 = [user1_labels.get(d, None) for d in decision_ids]
            model = [model_labels.get(d, None) for d in decision_ids]
            results["user1_vs_model"] = cohen_kappa_score(user1, model)

        if user2_annotations and model_annotations:
            user2 = [user2_labels.get(d, None) for d in decision_ids]
            model = [model_labels.get(d, None) for d in decision_ids]
            results["user2_vs_model"] = cohen_kappa_score(user2, model)

        return response.Response(results, status=200)


class ExtractiveAnnotationAgreementView(APIView):
    """
    API to calculate inter-agreement for extractive annotations.
    """
    def get(self, request, dataset_id):
        user1_id = request.query_params.get("user1")
        user2_id = request.query_params.get("user2")
        model_id = request.query_params.get("model")

        # Fetch extractive annotations for the dataset
        annotations = TextAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            deleted=False
        ).select_related("decision", "label", "creator")

        # Filter annotations by users or models
        user1_annotations = annotations.filter(creator_id=user1_id) if user1_id else None
        user2_annotations = annotations.filter(creator_id=user2_id) if user2_id else None

        # Prepare data for comparison
        decision_ids = set(annotations.values_list("decision_id", flat=True))
        user1_spans = {a.decision_id: (a.start_offset, a.end_offset) for a in user1_annotations} if user1_annotations else {}
        user2_spans = {a.decision_id: (a.start_offset, a.end_offset) for a in user2_annotations} if user2_annotations else {}

        # Calculate Jaccard Index for each decision
        jaccard_scores = []
        for decision_id in decision_ids:
            user1_span = user1_spans.get(decision_id, None)
            user2_span = user2_spans.get(decision_id, None)
            if user1_span and user2_span:
                overlap = max(0, min(user1_span[1], user2_span[1]) - max(user1_span[0], user2_span[0]))
                union = max(user1_span[1], user2_span[1]) - min(user1_span[0], user2_span[0])
                jaccard_scores.append(overlap / union if union > 0 else 0)

        # Return average Jaccard Index
        avg_jaccard = sum(jaccard_scores) / len(jaccard_scores) if jaccard_scores else 0
        return response.Response({"jaccard_index": avg_jaccard}, status=200)

from itertools import combinations
import numpy as np
from sklearn.metrics import cohen_kappa_score
import krippendorff

class MultiAnnotatorBinaryAgreementView(APIView):
    """
    API to calculate inter-agreement for binary annotations between multiple annotators.
    """
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        # agreement_type = request.query_params.get("type", "all")  # all, human, model, human_vs_model
        
        # Fetch binary annotations for the dataset
        annotations = BinaryAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            deleted=False
        ).select_related("decision", "label", "creator", "trained_model_annotator")

        # Get all decision IDs
        decision_ids = list(annotations.values_list("decision_id", flat=True).distinct())
        
        results = {}
        
        # if agreement_type in ["all", "human"]:
        results["human_annotators"] = self._calculate_human_agreement(annotations, decision_ids)
        
        # if agreement_type in ["all", "model"]:
        results["model_annotators"] = self._calculate_model_agreement(annotations, decision_ids)
        
        # if agreement_type in ["all", "human_vs_model"]:
        results["human_vs_model"] = self._calculate_human_vs_model_agreement(annotations, decision_ids)
        
        # if agreement_type == "all":
        results["overall"] = self._calculate_overall_agreement(annotations, decision_ids)
        
        return response.Response(results, status=200)

    def _calculate_human_agreement(self, annotations, decision_ids):
        """Calculate agreement between human annotators."""
        # Get all human annotators
        human_annotators = annotations.filter(
            creator__isnull=False
        ).values_list("creator_id", flat=True).distinct()
        
        if len(human_annotators) < 2:
            return {"error": "Need at least 2 human annotators"}
        
        # Create annotation matrix: decisions x annotators
        annotation_matrix = self._create_annotation_matrix(
            annotations.filter(creator_id__in=human_annotators),
            decision_ids,
            list(human_annotators),
            "creator_id"
        )
        
        return self._calculate_agreement_metrics(annotation_matrix, list(human_annotators))

    def _calculate_model_agreement(self, annotations, decision_ids):
        """Calculate agreement between model annotators."""
        # Get all model annotators
        model_annotators = annotations.filter(
            trained_model_annotator__isnull=False
        ).values_list("trained_model_annotator_id", flat=True).distinct()
        
        if len(model_annotators) < 2:
            return {"error": "Need at least 2 model annotators"}
        
        # Create annotation matrix
        annotation_matrix = self._create_annotation_matrix(
            annotations.filter(trained_model_annotator_id__in=model_annotators),
            decision_ids,
            list(model_annotators),
            "trained_model_annotator_id"
        )
        
        return self._calculate_agreement_metrics(annotation_matrix, list(model_annotators))

    def _calculate_human_vs_model_agreement(self, annotations, decision_ids):
        """Calculate agreement between human and model annotators."""
        human_annotators = list(annotations.filter(
            creator__isnull=False
        ).values_list("creator_id", flat=True).distinct())
        
        model_annotators = list(annotations.filter(
            trained_model_annotator__isnull=False
        ).values_list("trained_model_annotator_id", flat=True).distinct())
        
        if not human_annotators or not model_annotators:
            return {"error": "Need both human and model annotators"}
        
        # Combine human and model annotations
        all_annotators = [(f"human_{h}", h, "creator_id") for h in human_annotators] + \
                        [(f"model_{m}", m, "trained_model_annotator_id") for m in model_annotators]
        
        # Create combined annotation matrix
        annotation_matrix = {}
        
        for annotator_label, annotator_id, field in all_annotators:
            if field == "creator_id":
                annotator_annotations = annotations.filter(creator_id=annotator_id)
            else:
                annotator_annotations = annotations.filter(trained_model_annotator_id=annotator_id)
            
            annotation_dict = {a.decision_id: a.label.label for a in annotator_annotations}
            annotation_matrix[annotator_label] = [
                annotation_dict.get(decision_id, None) for decision_id in decision_ids
            ]
        
        return self._calculate_agreement_metrics(annotation_matrix, list(annotation_matrix.keys()))

    def _calculate_overall_agreement(self, annotations, decision_ids):
        """Calculate overall agreement between all annotators (human + model)."""
        return self._calculate_human_vs_model_agreement(annotations, decision_ids)

    def _create_annotation_matrix(self, annotations, decision_ids, annotators, field):
        """Create annotation matrix for given annotators."""
        annotation_matrix = {}
        
        for annotator in annotators:
            filter_dict = {field: annotator}
            annotator_annotations = annotations.filter(**filter_dict)
            annotation_dict = {a.decision_id: a.label.label for a in annotator_annotations}
            annotation_matrix[annotator] = [
                annotation_dict.get(decision_id, None) for decision_id in decision_ids
            ]
        
        return annotation_matrix

    def _calculate_agreement_metrics(self, annotation_matrix, annotators):
        """Calculate various agreement metrics."""
        results = {
            "num_annotators": len(annotators),
            "num_decisions": len(next(iter(annotation_matrix.values()))),
            "annotators": annotators
        }
        
        # 1. Average Pairwise Cohen's Kappa
        if len(annotators) >= 2:
            kappa_scores = []
            pairwise_results = {}
            
            for ann1, ann2 in combinations(annotators, 2):
                labels1 = annotation_matrix[ann1]
                labels2 = annotation_matrix[ann2]
                
                # Filter out None values (missing annotations)
                paired_labels = [(l1, l2) for l1, l2 in zip(labels1, labels2) if l1 is not None and l2 is not None]
                
                if len(paired_labels) > 0:
                    filtered_labels1, filtered_labels2 = zip(*paired_labels)
                    kappa = cohen_kappa_score(filtered_labels1, filtered_labels2)
                    kappa_scores.append(kappa)
                    pairwise_results[f"{ann1}_vs_{ann2}"] = {
                        "cohen_kappa": kappa,
                        "num_common_annotations": len(paired_labels)
                    }
            
            results["average_pairwise_kappa"] = np.mean(kappa_scores) if kappa_scores else 0
            results["pairwise_details"] = pairwise_results
        
        # 2. Fleiss' Kappa (if we have multiple annotators)
        if len(annotators) >= 3:
            try:
                fleiss_kappa = self._calculate_fleiss_kappa(annotation_matrix, annotators)
                results["fleiss_kappa"] = fleiss_kappa
            except Exception as e:
                results["fleiss_kappa_error"] = str(e)
        
        # 3. Krippendorff's Alpha (if available)
        try:
            alpha = self._calculate_krippendorff_alpha(annotation_matrix, annotators)
            results["krippendorff_alpha"] = alpha
        except Exception as e:
            results["krippendorff_alpha_error"] = str(e)
        
        # 4. Agreement percentage
        results["agreement_percentage"] = self._calculate_agreement_percentage(annotation_matrix, annotators)
        
        return results

    def _calculate_fleiss_kappa(self, annotation_matrix, annotators):
        """Calculate Fleiss' Kappa for multiple annotators."""
        from sklearn.metrics import cohen_kappa_score
        import pandas as pd
        
        # Convert to DataFrame for easier manipulation
        df = pd.DataFrame(annotation_matrix)
        
        # Get unique labels
        all_labels = set()
        for labels in annotation_matrix.values():
            all_labels.update([l for l in labels if l is not None])
        all_labels = list(all_labels)
        
        # Create agreement matrix for Fleiss' Kappa
        n_items = len(next(iter(annotation_matrix.values())))
        n_categories = len(all_labels)
        n_raters = len(annotators)
        
        # This is a simplified implementation - you might want to use a proper library
        # like `fleiss_kappa` from `statsmodels` if available
        
        agreement_counts = []
        for i in range(n_items):
            item_counts = {label: 0 for label in all_labels}
            valid_ratings = 0
            
            for annotator in annotators:
                label = annotation_matrix[annotator][i]
                if label is not None:
                    item_counts[label] += 1
                    valid_ratings += 1
            
            if valid_ratings >= 2:  # Need at least 2 ratings
                agreement_counts.append(list(item_counts.values()))
        
        # Calculate Fleiss' Kappa (simplified)
        if len(agreement_counts) == 0:
            return 0
        
        # This is a basic implementation - consider using a proper statistical library
        return self._fleiss_kappa_calculation(agreement_counts, n_raters)

    def _fleiss_kappa_calculation(self, agreement_counts, n_raters):
        """Basic Fleiss' Kappa calculation."""
        # This is a simplified version - use a proper statistical library for production
        import numpy as np
        
        agreement_counts = np.array(agreement_counts)
        n_items, n_categories = agreement_counts.shape
        
        # Calculate observed agreement
        p_observed = 0
        for i in range(n_items):
            item_sum = np.sum(agreement_counts[i])
            if item_sum >= 2:
                p_observed += np.sum(agreement_counts[i] * (agreement_counts[i] - 1)) / (item_sum * (item_sum - 1))
        
        p_observed /= n_items
        
        # Calculate expected agreement
        category_totals = np.sum(agreement_counts, axis=0)
        total_ratings = np.sum(category_totals)
        p_expected = np.sum((category_totals / total_ratings) ** 2)
        
        # Calculate Fleiss' Kappa
        if p_expected == 1:
            return 1 if p_observed == 1 else 0
        
        return (p_observed - p_expected) / (1 - p_expected)

    def _calculate_krippendorff_alpha(self, annotation_matrix, annotators):
        """Calculate Krippendorff's Alpha."""
        try:
            # Convert to format expected by krippendorff library
            # You'll need to install: pip install krippendorff
            
            # Create reliability data matrix
            reliability_data = []
            for annotator in annotators:
                reliability_data.append(annotation_matrix[annotator])
            
            # Convert string labels to numeric
            all_labels = set()
            for labels in annotation_matrix.values():
                all_labels.update([l for l in labels if l is not None])
            
            label_to_num = {label: i for i, label in enumerate(sorted(all_labels))}
            
            numeric_data = []
            for row in reliability_data:
                numeric_row = [label_to_num[label] if label is not None else np.nan for label in row]
                numeric_data.append(numeric_row)
            
            alpha = krippendorff.alpha(reliability_data=np.array(numeric_data), level_of_measurement='nominal')
            return alpha
        except ImportError:
            raise Exception("krippendorff library not installed. Install with: pip install krippendorff")

    def _calculate_agreement_percentage(self, annotation_matrix, annotators):
        """Calculate simple agreement percentage."""
        if len(annotators) < 2:
            return 0
        
        total_items = 0
        agreed_items = 0
        
        n_decisions = len(next(iter(annotation_matrix.values())))
        
        for i in range(n_decisions):
            # Get all non-None labels for this decision
            labels = [annotation_matrix[annotator][i] for annotator in annotators 
                     if annotation_matrix[annotator][i] is not None]
            
            if len(labels) >= 2:  # Need at least 2 annotations to compare
                total_items += 1
                if len(set(labels)) == 1:  # All labels are the same
                    agreed_items += 1
        
        return (agreed_items / total_items * 100) if total_items > 0 else 0
    
    
class MultiAnnotatorExtractiveAgreementView(APIView):
    """
    API to calculate inter-agreement for extractive annotations between multiple annotators.
    """
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, dataset_id):
        # agreement_type = request.query_params.get("type", "all")  # all, human, model, human_vs_model
        
        # Fetch human extractive annotations (TextAnnotationsModel)
        human_annotations = TextAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            deleted=False
        ).select_related("decision", "label", "creator")
        
        # Fetch model extractive annotations (ExtractionAnnotationsModel)
        model_annotations = ExtractionAnnotationsModel.objects.filter(
            decision__dataset_id=dataset_id,
            deleted=False
        ).select_related("decision", "creator")
        
        # Get all decision IDs from both annotation types
        human_decision_ids = set(human_annotations.values_list("decision_id", flat=True))
        model_decision_ids = set(model_annotations.values_list("decision_id", flat=True))
        all_decision_ids = list(human_decision_ids.union(model_decision_ids))
        
        results = {}
        
        # if agreement_type in ["all", "human"]:
        results["human_annotators"] = self._calculate_human_extractive_agreement(human_annotations, all_decision_ids)
        
        # if agreement_type in ["all", "model"]:
        results["model_annotators"] = self._calculate_model_extractive_agreement(model_annotations, all_decision_ids)
        
        # if agreement_type in ["all", "human_vs_model"]:
        results["human_vs_model"] = self._calculate_human_vs_model_extractive_agreement(
                human_annotations, model_annotations, all_decision_ids
            )
        
        # if agreement_type == "all":
        results["overall"] = self._calculate_overall_extractive_agreement(
                human_annotations, model_annotations, all_decision_ids
            )
        
        return response.Response(results, status=200)

    def _calculate_human_extractive_agreement(self, human_annotations, decision_ids):
        """Calculate agreement between human annotators using TextAnnotationsModel."""
        # Get all human annotators
        annotators = list(human_annotations.values_list("creator_id", flat=True).distinct())
        
        if len(annotators) < 2:
            return {"error": "Need at least 2 human annotators"}
        
        # Create span matrix for human annotations
        span_matrix = {}
        for annotator in annotators:
            annotator_annotations = human_annotations.filter(creator_id=annotator)
            span_dict = {a.decision_id: (a.start_offset, a.end_offset) for a in annotator_annotations}
            span_matrix[annotator] = [span_dict.get(decision_id, None) for decision_id in decision_ids]
        
        return self._calculate_extractive_agreement_metrics(span_matrix, annotators, "human")

    def _calculate_model_extractive_agreement(self, model_annotations, decision_ids):
        """Calculate agreement between model annotators using ExtractionAnnotationsModel."""
        # Get all unique model annotators (model_annotator + created_at combinations)
        model_annotators = []
        for annotation in model_annotations:
            if annotation.model_annotator:
                # Create unique identifier for model + timestamp
                model_id = f"{annotation.model_annotator}_{annotation.created_at.strftime('%Y%m%d_%H%M')}"
                if model_id not in model_annotators:
                    model_annotators.append(model_id)
        
        if len(model_annotators) < 2:
            return {"error": "Need at least 2 model annotators"}
        
        # Create span matrix for model annotations
        span_matrix = {}
        for model_id in model_annotators:
            model_name, timestamp = model_id.split('_', 1)
            
            # Find annotations for this specific model and timestamp
            model_spans = {}
            for annotation in model_annotations:
                if (annotation.model_annotator == model_name and 
                    annotation.created_at.strftime('%Y%m%d_%H%M') == timestamp):
                    
                    # Extract spans from llm_json_result
                    spans = self._extract_spans_from_llm_result(annotation.llm_json_result)
                    if spans:
                        # For multiple spans, we'll use the first one or combine them
                        # You might want to modify this logic based on your needs
                        model_spans[annotation.decision_id] = spans[0] if spans else None
        
        span_matrix[model_id] = [model_spans.get(decision_id, None) for decision_id in decision_ids]
    
        return self._calculate_extractive_agreement_metrics(span_matrix, model_annotators, "model")

    def _calculate_human_vs_model_extractive_agreement(self, human_annotations, model_annotations, decision_ids):
        """Calculate agreement between human and model annotators."""
        # Get human annotators
        human_annotators = list(human_annotations.values_list("creator_id", flat=True).distinct())
        
        # Get model annotators
        model_annotators = []
        for annotation in model_annotations:
            if annotation.model_annotator:
                model_id = f"{annotation.model_annotator}_{annotation.created_at.strftime('%Y%m%d_%H%M')}"
                if model_id not in model_annotators:
                    model_annotators.append(model_id)
        
        if not human_annotators or not model_annotators:
            return {"error": "Need both human and model annotators"}
        
        # Create combined span matrix
        span_matrix = {}
        
        # Add human annotations
        for annotator in human_annotators:
            annotator_annotations = human_annotations.filter(creator_id=annotator)
            span_dict = {a.decision_id: (a.start_offset, a.end_offset) for a in annotator_annotations}
            span_matrix[f"human_{annotator}"] = [span_dict.get(decision_id, None) for decision_id in decision_ids]
        
        # Add model annotations
        for model_id in model_annotators:
            model_name, timestamp = model_id.split('_', 1)
            model_spans = {}
            
            for annotation in model_annotations:
                if (annotation.model_annotator == model_name and 
                    annotation.created_at.strftime('%Y%m%d_%H%M') == timestamp):
                    
                    spans = self._extract_spans_from_llm_result(annotation.llm_json_result)
                    if spans:
                        model_spans[annotation.decision_id] = spans[0] if spans else None
            
            span_matrix[f"model_{model_id}"] = [model_spans.get(decision_id, None) for decision_id in decision_ids]
        
        all_annotators = list(span_matrix.keys())
        return self._calculate_extractive_agreement_metrics(span_matrix, all_annotators, "human_vs_model")

    def _calculate_overall_extractive_agreement(self, human_annotations, model_annotations, decision_ids):
        """Calculate overall agreement between all annotators (human + model)."""
        return self._calculate_human_vs_model_extractive_agreement(human_annotations, model_annotations, decision_ids)

    def _extract_spans_from_llm_result(self, llm_json_result):
        """Extract spans from the LLM JSON result."""
        if not llm_json_result:
            return []
        
        spans = []
        try:
            # Handle different possible structures of llm_json_result
            if isinstance(llm_json_result, dict):
                # Look for common keys that might contain span information
                for key in ['extractions', 'annotations', 'spans', 'results']:
                    if key in llm_json_result:
                        data = llm_json_result[key]
                        if isinstance(data, list):
                            for item in data:
                                span = self._parse_span_from_item(item)
                                if span:
                                    spans.append(span)
                        elif isinstance(data, dict):
                            span = self._parse_span_from_item(data)
                            if span:
                                spans.append(span)
                
                # If no specific key found, try to parse the whole object
                if not spans:
                    span = self._parse_span_from_item(llm_json_result)
                    if span:
                        spans.append(span)
            
            elif isinstance(llm_json_result, list):
                for item in llm_json_result:
                    span = self._parse_span_from_item(item)
                    if span:
                        spans.append(span)
        
        except Exception as e:
            print(f"Error parsing LLM result: {e}")
            return []
        
        return spans

    def _parse_span_from_item(self, item):
        """Parse a single span from an item in the LLM result."""
        if not isinstance(item, dict):
            return None
        
        # Look for start and end offset keys (common variations)
        start_keys = ['start_offset', 'start', 'begin', 'start_pos', 'startOffset']
        end_keys = ['end_offset', 'end', 'finish', 'end_pos', 'endOffset']
        
        start_offset = None
        end_offset = None
        
        for key in start_keys:
            if key in item and isinstance(item[key], (int, float)):
                start_offset = int(item[key])
                break
        
        for key in end_keys:
            if key in item and isinstance(item[key], (int, float)):
                end_offset = int(item[key])
                break
        
        if start_offset is not None and end_offset is not None and start_offset < end_offset:
            return (start_offset, end_offset)
        
        return None

    def _calculate_extractive_agreement_metrics(self, span_matrix, annotators, annotator_type):
        """Calculate agreement metrics for extractive annotations using various metrics."""
        results = {
            "annotator_type": annotator_type,
            "num_annotators": len(annotators),
            "num_decisions": len(next(iter(span_matrix.values()))) if span_matrix else 0,
            "annotators": annotators
        }
        
        if len(annotators) < 2:
            return results
        
        # Calculate pairwise agreements
        jaccard_scores = []
        overlap_scores = []
        exact_match_scores = []
        pairwise_results = {}
        
        for ann1, ann2 in combinations(annotators, 2):
            spans1 = span_matrix[ann1]
            spans2 = span_matrix[ann2]
            
            decision_jaccard_scores = []
            decision_overlap_scores = []
            decision_exact_matches = []
            
            for span1, span2 in zip(spans1, spans2):
                if span1 is not None and span2 is not None:
                    jaccard = self._calculate_jaccard(span1, span2)
                    overlap = self._calculate_overlap(span1, span2)
                    exact_match = 1.0 if span1 == span2 else 0.0
                    
                    decision_jaccard_scores.append(jaccard)
                    decision_overlap_scores.append(overlap)
                    decision_exact_matches.append(exact_match)
            
            if decision_jaccard_scores:
                avg_jaccard = np.mean(decision_jaccard_scores)
                avg_overlap = np.mean(decision_overlap_scores)
                avg_exact_match = np.mean(decision_exact_matches)
                
                jaccard_scores.append(avg_jaccard)
                overlap_scores.append(avg_overlap)
                exact_match_scores.append(avg_exact_match)
                
                pairwise_results[f"{ann1}_vs_{ann2}"] = {
                    "jaccard_index": avg_jaccard,
                    "overlap_coefficient": avg_overlap,
                    "exact_match_rate": avg_exact_match,
                    "num_common_annotations": len(decision_jaccard_scores)
                }
        
        results["average_pairwise_jaccard"] = np.mean(jaccard_scores) if jaccard_scores else 0
        results["average_pairwise_overlap"] = np.mean(overlap_scores) if overlap_scores else 0
        results["average_exact_match_rate"] = np.mean(exact_match_scores) if exact_match_scores else 0
        results["pairwise_details"] = pairwise_results
        
        # Calculate additional metrics
        results["agreement_percentage"] = self._calculate_span_agreement_percentage(span_matrix, annotators)
        
        return results

    def _calculate_span_agreement_percentage(self, span_matrix, annotators):
        """Calculate simple agreement percentage for spans."""
        if len(annotators) < 2:
            return 0
        
        total_items = 0
        agreed_items = 0
        
        n_decisions = len(next(iter(span_matrix.values())))
        
        for i in range(n_decisions):
            # Get all non-None spans for this decision
            spans = [span_matrix[annotator][i] for annotator in annotators 
                    if span_matrix[annotator][i] is not None]
            
            if len(spans) >= 2:  # Need at least 2 annotations to compare
                total_items += 1
                if len(set(spans)) == 1:  # All spans are exactly the same
                    agreed_items += 1
        
        return (agreed_items / total_items * 100) if total_items > 0 else 0

    def _calculate_jaccard(self, span1, span2):
        """Calculate Jaccard index between two spans."""
        start1, end1 = span1
        start2, end2 = span2
        
        # Calculate overlap
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        overlap = max(0, overlap_end - overlap_start)
        
        # Calculate union
        union_start = min(start1, start2)
        union_end = max(end1, end2)
        union = union_end - union_start
        
        return overlap / union if union > 0 else 0

    def _calculate_overlap(self, span1, span2):
        """Calculate overlap coefficient between two spans."""
        start1, end1 = span1
        start2, end2 = span2
        
        # Calculate overlap
        overlap_start = max(start1, start2)
        overlap_end = min(end1, end2)
        overlap = max(0, overlap_end - overlap_start)
        
        # Calculate minimum span length
        min_length = min(end1 - start1, end2 - start2)
        
        return overlap / min_length if min_length > 0 else 0

