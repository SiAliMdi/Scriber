from django.urls import path

from . import apis


urlpatterns = [
    path("register/", apis.RegisterUserApi.as_view(), name="register_user"),
    path("users_list/", apis.ListUsersApi.as_view(), name="users_list"),
    path("login/", apis.LoginUserApi.as_view(), name="login_user"),
    path("logout/", apis.LogoutUserApi.as_view(), name="logout_user"),
    path("user/", apis.UserApi.as_view(), name="user"),
    path("user_password/", apis.UserPasswordApi.as_view(), name="user_password"),
]