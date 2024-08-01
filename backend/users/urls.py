from django.urls import path

from . import apis

urlpatterns = [
    path("register/", apis.RegisterUserApi.as_view(), name="register_user"),
    path("users/", apis.ListUsersApi.as_view(), name="list_users"),
    path("login/", apis.LoginUserApi.as_view(), name="login_user"),
]