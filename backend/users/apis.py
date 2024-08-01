from rest_framework import views, response, permissions #, exceptions
from .serializers import UserSerializer
from . import services


class RegisterUserApi(views.APIView):
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
        return response.Response(data=serializer.data, status=200)
    

class LoginUserApi(views.APIView):
    def post(self, request):
        email = request.data.get("email")
        password = request.data.get("password")
        
        try:
            user = services.login_user(email, password)
            token = services.create_token(user)
            response_ = response.Response(data={"message": "Login succeced"},status=200)
            response_.set_cookie(key="jwt", value=token, httponly=True)
            return response_
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        
class LogoutUserApi(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def post(self, request):
        response_ = response.Response({"message": "Logout successed"},status=200)
        response_.delete_cookie("jwt")
        user_email = request.user.email
        services.logout_user(user_email)
        return response_

class UserApi(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        user = services.get_user(request.user.email)
        serializer = UserSerializer(user)
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