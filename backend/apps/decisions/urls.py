from django.urls import path

from . import apis

app_name = "decisions"

urlpatterns = [
    path("", apis.home.as_view(), name="decisions_home"),
]
