from django.urls import path

from . import apis

app_name = "decisions"

urlpatterns = [
    path("log_download/", apis.LogDatasetDownloadView.as_view(), name="log_download"),
    path("all_raws/", apis.RawDecisionsListView.as_view(), name="all_raw_decisions"),
    path("raws/new/", apis.RawDecisionsDetailView.as_view(), name="new_raw_decision"),
    path("raws/<str:decision_id>/", apis.RawDecisionsDetailView.as_view(), name="raw_decision"),
    path("dataset/<str:dataset_id>/new/", apis.DatasetDecisionsDetailView.as_view(), name="all_raw_decisions"),
    # get all decisions of a dataset
    path("bin_dataset/<str:dataset_id>/all/", apis.BinDatasetRawDecisionsView.as_view(), name="all_raw_decisions_bin"),
    path("ext_dataset/<str:dataset_id>/all/", apis.ExtDatasetRawDecisionsView.as_view(), name="all_raw_decisions_ext"),
    # crud operations on a decision of a dataset
    path("dataset/<str:decision_id>/", apis.DatasetDecisionsDetailView.as_view(), name="all_raw_decisions"),
    ######## USED IN THE FRONTEND ########
    path("villes/", apis.VillesListView.as_view(), name="get_villes"),
    path("associer/", apis.Associer.as_view(), name="get_chambres"),
]

urlpatterns += [
    path(
        "llm_dataset/<str:dataset_id>/all/",
        apis.LLMDatasetDecisionsDeleteView.as_view(),
        name="llm_dataset_decisions_delete"
    ),
]