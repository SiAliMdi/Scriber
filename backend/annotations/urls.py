from django.urls import path
from . import apis

app_name = "annotations"

urlpatterns = [
    path(
        "extractive/llm_annotations/<str:dataset_id>/",
        apis.ExtractionAnnotationsByModelView.as_view(),
        name="extractive_llm_annotations_by_model"
    ),
    path("bin_annotation/<str:annotation_id>/", apis.BinDatasetRawDecisionsView.as_view(), name="bin_annotations"),
    path("ext_annotation/", apis.ExtAnnotationCreateView.as_view(), name="ext_annotations_new"),
    path("ext_annotation/<str:annotation_id>/", apis.ExtAnnotationDeleteView.as_view(), name="ext_annotations_del"),
    path("users_with_annotations/<str:dataset_id>/", apis.UsersWithAnnotationsView.as_view(), name="users_with_annotations"),
    path("trained_models/<str:dataset_id>/", apis.TrainedModelsForDatasetView.as_view(), name="trained_models_for_dataset"),
    path('validation/<uuid:dataset_id>/', apis.FetchAnnotationsWithValidationStateView.as_view(), name='fetch_annotations_with_validation_state'),
    path('validation/update/<uuid:annotation_id>/', apis.UpdateAnnotationValidationStateView.as_view(), name='update_annotation_validation_state'),
    path("extractive/users_with_annotations/<str:dataset_id>/", apis.ExtractiveUsersWithAnnotationsView.as_view(), name="extractive_users_with_annotations"),
    path("extractive/models_with_annotations/<str:dataset_id>/", apis.ExtractiveModelsWithAnnotationsView.as_view(), name="extractive_models_with_annotations"),
    path("ext_annotation/validate_decision/<uuid:decision_id>/", apis.ValidateDecisionAnnotationsView.as_view(), name="validate_decision_annotations"),
]
