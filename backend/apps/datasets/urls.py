from django.urls import path

from .apis import Datasets, Dataset

app_name = "datasets"

urlpatterns = [
    path("<str:category_id>/", Datasets.as_view(), name="datasets_list"),
    path("1/new/", Dataset.as_view(), name="dataset_new"),
    path("1/<str:dataset_id>/", Dataset.as_view(), name="dataset_rud"),
]
