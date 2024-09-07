from django.urls import path

from . import apis

app_name = "decisions"

urlpatterns = [
    path("all_raws/", apis.RawDecisionsListView.as_view(), name="all_raw_decisions"),
    path("raws/new/", apis.RawDecisionsDetailView.as_view(), name="new_raw_decision"),
    path("raws/<str:decision_id>/", apis.RawDecisionsDetailView.as_view(), name="raw_decision"),
]
