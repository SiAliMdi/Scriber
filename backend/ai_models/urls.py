from django.urls import path

from . import apis

app_name = "ai_models"

urlpatterns = [
    # create a new ai_model 
    path("prompts/new/", apis.PromptsApi.as_view(), name="create_ai_model"),
    path("new/", apis.AiModel.as_view(), name="create_ai_model"),
    path("prompt/<str:prompt_id>/", apis.PromptsApi.as_view(), name="ai_model_home"),
    # update, delete, get ai_model by id
    path("1/<str:model_id>/", apis.AiModel.as_view(), name="ai_model_home"),
    # get all prompts of a category
    path("<str:category_id>/prompts/", apis.PromptsApi.as_view(), name="ai_models_home"),
    # get all ai_models of a category
    path("<str:category_id>/", apis.AiModels.as_view(), name="ai_models_home"),
]
