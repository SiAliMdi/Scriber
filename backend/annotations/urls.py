from django.urls import path
from . import apis

app_name = "annotations"

urlpatterns = [
    path("bin_annotation/<str:annotation_id>/", apis.BinDatasetRawDecisionsView.as_view(), name="bin_annotations"),
]
