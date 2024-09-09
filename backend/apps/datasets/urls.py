from django.urls import path

from .apis import Datasets, Dataset, Labels, Label

app_name = "datasets"

urlpatterns = [
    # get all datasets of a category
    path("<str:category_id>/", Datasets.as_view(), name="datasets_list"),
    # create a new dataset of a category (category_id passed in the body)
    path("1/new/", Dataset.as_view(), name="dataset_new"),
    # get, update, delete a dataset by id
    path("1/<str:dataset_id>/", Dataset.as_view(), name="dataset_rud"),
    # create a new label for a dataset
    path("<str:dataset_id>/new_label/", Label.as_view(), name="dataset_label_new"),
    # get, update, delete a label of a dataset
    path("label/<str:label_id>/", Label.as_view(), name="dataset_label_rud"),
    # get labels of a dataset
    path("<str:dataset_id>/labels/", Labels.as_view(), name="dataset_label_new"),
]
