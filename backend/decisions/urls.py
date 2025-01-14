from django.urls import path

from . import apis

app_name = "decisions"

urlpatterns = [
    path("all_raws/", apis.RawDecisionsListView.as_view(), name="all_raw_decisions"),
    path("raws/new/", apis.RawDecisionsDetailView.as_view(), name="new_raw_decision"),
    path("raws/<str:decision_id>/", apis.RawDecisionsDetailView.as_view(), name="raw_decision"),
    path("dataset/<str:dataset_id>/new/", apis.DatasetDecisionsDetailView.as_view(), name="all_raw_decisions"),
    # get all decisions of a dataset
    path("dataset/<str:dataset_id>/all/", apis.DatasetDecisionsListView.as_view(), name="all_raw_decisions"),
    # crud operations on a decision of a dataset
    path("dataset/<str:decision_id>/", apis.DatasetDecisionsDetailView.as_view(), name="all_raw_decisions"),
    ######## USED IN THE FRONTEND ########
    path("villes/", apis.VillesListView.as_view(), name="get_villes"),
    path("associer/", apis.Associer.as_view(), name="get_chambres"),
]
