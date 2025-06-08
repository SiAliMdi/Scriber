from django.urls import path

from . import apis

app_name = "categories"

urlpatterns = [
    path("", apis.Categories.as_view(), name="categories_list"),
    # path("new/", apis.Category.as_view(), name="create_category"),
    path("<str:id>/", apis.Category.as_view(), name="categoriy_rud"),
]
