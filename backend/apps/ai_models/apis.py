from rest_framework import views, permissions, response
from ..categories.serializers import CategoriesSerializer
from ..users.serializers import UserSerializer
from .serializers import  AiModelSerializer
from .models import Ai_ModelsModel
from ..users import services

class AiModels(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, category_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not category_id:
                return response.Response(data={"error": "Category id is required"}, status=400)
            ai_models = Ai_ModelsModel.objects.filter(deleted=False)
            ai_models = AiModelSerializer(ai_models, many=True).data
            return response.Response(data=ai_models, status=200)
            
class AiModel(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, model_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not model_id:
                return response.Response(data={"error": "Model id is required"}, status=400)
            data = request.data
            if not data:
                return response.Response(data={"error": "Data is required"}, status=400)
            try:
                model = Ai_ModelsModel.objects.get(pk=model_id)
            except Ai_ModelsModel.DoesNotExist:
                print("Model not found")
            serializer = AiModelSerializer(model, data=data, partial=True)
            if serializer.is_valid():
                serialized_data = serializer.validated_data
                serializer.update(instance=model, validated_data=serialized_data)
                serialized_data['creator'] = UserSerializer(serialized_data['creator']).data
                serialized_data['category'] = CategoriesSerializer(serialized_data['category']).data
                return response.Response(data=serialized_data, status=200)
            else:
                return response.Response(data=serializer.errors, status=400)

    def post(self, request):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            data = request.data
            if not data:
                return response.Response(data={"error": "Data is required"}, status=400)

            data["creator"] = request.user
            serializer = AiModelSerializer(data=data)
            if serializer.is_valid():
                validated_data = serializer.validated_data
                model = serializer.create(validated_data)
                model = AiModelSerializer(model).data
                return response.Response(data=model, status=200)
            else:
                return response.Response(data=serializer.errors, status=400)
            
    def delete(self, request, model_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            if not model_id:
                return response.Response(data={"error": "Model id is required"}, status=400)
            try:
                model = Ai_ModelsModel.objects.get(pk=model_id)
            except Ai_ModelsModel.DoesNotExist:
                print("Model not found")
            model.deleted = True
            model.save()
            for mdl in Ai_ModelsModel.objects.filter(deleted=False, serial_number__gt=model.serial_number):
                mdl.serial_number -= 1
                mdl.save()
            return response.Response(data={"message": "Model deleted successfully"}, status=200)