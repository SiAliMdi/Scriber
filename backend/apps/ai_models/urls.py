from django.urls import path

from . import apis

app_name = "ai_models"

urlpatterns = [
    # create a new ai_model 
    path("new/", apis.AiModel.as_view(), name="create_ai_model"),
    # update, delete, get ai_model by id
    path("1/<str:model_id>/", apis.AiModel.as_view(), name="ai_model_home"),
    # get all ai_models of a category
    path("<str:category_id>/", apis.AiModels.as_view(), name="ai_models_home"),
]
