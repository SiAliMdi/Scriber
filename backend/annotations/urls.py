from django.urls import path
from . import apis

app_name = "annotations"

urlpatterns = [
    path("bin_annotation/<str:annotation_id>/", apis.BinDatasetRawDecisionsView.as_view(), name="bin_annotations"),
    path("ext_annotation/", apis.ExtAnnotationCreateView.as_view(), name="ext_annotations_new"),
    path("ext_annotation/<str:annotation_id>/", apis.ExtAnnotationDeleteView.as_view(), name="ext_annotations_del"),
]
