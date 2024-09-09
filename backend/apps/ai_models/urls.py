from django.urls import path

from . import apis

app_name = "ai_models"

urlpatterns = [
    path("", apis.home.as_view(), name="ai_models_home"),
]
