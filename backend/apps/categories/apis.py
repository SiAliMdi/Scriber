from rest_framework import views, permissions, response
from .serializers import CategoriesSerializer, CategorySerializer
from ..users import services
from .services import get_category, delete_category
from .models import CategoriesModel

class Categories(views.APIView):

    authentication_classes = [services.ScriberUserAuthentication,]
    permission_classes = [permissions.IsAuthenticated,]

    def get(self, request):
        categories = list(CategoriesModel.objects.filter(deleted=False))
        categories = CategoriesSerializer(categories, many=True).data
        return response.Response(data=categories, status=200)
    
    def post(self, request):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            validated_data = serializer.validated_data
            validated_data['creator'] = request.user
            category = CategoriesModel.objects.create(**validated_data)
            category = CategoriesSerializer(category)
            return response.Response(data=category.data, status=200)
        else:
            return response.Response(data=serializer.errors, status=400)


class Category(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = [permissions.IsAuthenticated,]

    def get(self, request, id):
        if not id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            category = get_category(id)
            category = CategoriesSerializer(category)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)

        return response.Response(data=category.data, status=200)
                
    def patch(self, request, id):
        categorie = CategoriesModel.objects.get(id=id)
        serializer = CategoriesSerializer(data=request.data, partial=True, instance=categorie)
        if serializer.is_valid():
            try:
                validated_data = serializer.validated_data
                serializer.update(instance=categorie, validated_data=validated_data, updater=request.user)
                return response.Response(data=serializer.validated_data, status=200)
            except Exception as e:
                print("patch error",e)
                return response.Response(data={"error": str(e)}, status=400)
        else:
            print(serializer.errors)
            return response.Response(serializer.errors, status=400)
        
    def delete(self, request, id):
        if not id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            delete_category(id)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(status=200, data={"message": "Category deleted successfully"})
    