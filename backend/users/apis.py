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
            response_ = response.Response(status=200)
            response_.set_cookie(key="jwt", value=token, httponly=True)
            return response_
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
