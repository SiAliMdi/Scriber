from rest_framework import views, response, permissions, parsers, renderers, status #, exceptions
from .serializers import UserSerializer
from . import services
from rest_framework.request import Request
from rest_framework.authtoken.serializers import AuthTokenSerializer
import jwt
from datetime import datetime
from django.conf import settings
from rest_framework.response import Response

class RegisterUserApi(views.APIView):

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            try:
                serializer.instance = services.create_user(data)
            except Exception as e:
                return response.Response(data={"error": str(e)}, status=400)
            return response.Response(data=serializer.data, status=200)
        else:
            # raise exceptions.ValidationError(serializer.errors)
            return response.Response(data=serializer.errors, status=400)


class ListUsersApi(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        if not request.user.is_superuser:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        users = services.list_users()
        serializer = UserSerializer(users, many=True)
        # print(f"{serializer.data = }")
        return response.Response(data=serializer.data, status=200)
    

class LoginUserApi(views.APIView):
    
    permission_classes = (permissions.AllowAny,)
    
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        try:
            user = services.login_user(request, email, password)
            # new user accounts should be validated by the admin before being able tologin
            if not user.is_staff:
                return response.Response(data={"error": "Unauthorized"}, status=401)
            token = services.create_token(user)
            response_ = response.Response(data={"message": "Login succeced", 
                                                "user": UserSerializer(user).data,
                                                "token": token
                                                },status=200)
            response_.set_cookie(key="jwt", value=token, httponly=True)
            return response_
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        
class LogoutUserApi(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    # permission_classes = (services.ScriberUserAuthentication,)

    def post(self, request: Request):
        if not request.user.is_authenticated:
            return response.Response({"message": "User not authenticated"}, status=403)

        response_ = response.Response({"message": "Logout successed"},status=200)
        response_.delete_cookie("jwt")
        user_email = request.user.email
        services.logout_user(request, user_email)
        return response_

class UserApi(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = services.get_user(request.user.email)
        serializer = UserSerializer(user)
        return response.Response(data=serializer.data, status=200)
    
    # update is_staff fields of the user model endpoint
    def put(self, request):
        if not request.user.is_superuser:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        
        email = request.data.get("email")
        is_staff = request.data.get("is_staff")
        try:
            user = services.update_user(email, is_staff)
            serializer = UserSerializer(user)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(data=serializer.data, status=200)


    def delete(self, request):
        if not request.user.is_superuser:
            return response.Response(data={"error": "Unauthorized"}, status=401)

        email_to_delete = request.data.get("email_to_delete")
        if not email_to_delete:
            return response.Response(data={"error": "Email to delete is required"}, status=400)
        try:
            services.delete_user(email_to_delete)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(status=200, data={"message": "User deleted successfully"})
    

class UserPasswordApi(views.APIView):
    # authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        try:
            services.check_password(email, password)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(data={"message": "Password is correct"}, status=200)


    def put(self, request):
        email = request.user.email
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")
        try:
            user = services.change_password(email, old_password, new_password)
            serializer = UserSerializer(user)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(data=serializer.data, status=200)
