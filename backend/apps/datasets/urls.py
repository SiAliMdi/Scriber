from django.urls import path

from . import apis

app_name = "datasets"

urlpatterns = [
    path("", apis.home.as_view(), name="datasets_home"),
]
