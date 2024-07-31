from django.urls import path

from . import apis

urlpatterns = [
    path("register/", apis.RegisterUserApi.as_view(), name="register_user"),
    path("users/", apis.ListUserApi.as_view(), name="list_users"),
]