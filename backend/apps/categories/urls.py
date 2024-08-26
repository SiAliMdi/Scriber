from django.urls import path

from . import apis

app_name = "categories"

urlpatterns = [
    path("", apis.home.as_view(), name="categories_home"),
]
