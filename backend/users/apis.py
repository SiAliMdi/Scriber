from rest_framework import views, response #, exceptions
from .serializers import UserSerializer
from . import services


class RegisterUserApi(views.APIView):
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            data = serializer.validated_data
            serializer.instance = services.create(data)
            return response.Response(data=serializer.data, status=200)
        else:
            # raise exceptions.ValidationError(serializer.errors)
            return response.Response(data=serializer.errors, status=400)


class ListUserApi(views.APIView):

    def get(self, request):
        users = services.list_users()
        serializer = UserSerializer(users, many=True)
        return response.Response(data=serializer.data, status=200)
    

