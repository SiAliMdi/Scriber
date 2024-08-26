from django.urls import path

from . import apis

app_name = "annotations"

urlpatterns = [
    path("", apis.home.as_view(), name="annotations_home"),
]
