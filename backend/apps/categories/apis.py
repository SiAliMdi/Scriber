from rest_framework import views, permissions, response
from .serializers import CategoriesSerializer
from ..users import services
from .services import get_category, list_categories, delete_category, create_category, update_category

class Categories(views.APIView):

    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):
        categories = list_categories()
        categories = CategoriesSerializer(categories, many=True).data
        return response.Response(data=categories, status=200)

class Category(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request, id):
        if not id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            category = get_category(id)
            category = CategoriesSerializer(category)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)

        return response.Response(data=category.data, status=200)

    def post(self, request):
        serialized_data = CategoriesSerializer(data=request.data)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = create_category(validated_data)    
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)

                
    def patch(self, request, id):
        serialized_data = CategoriesSerializer(data=request.data, partial=True)
        if serialized_data.is_valid():
            serialized_data = serialized_data.validated_data
            updated_data = update_category(id, serialized_data)
            serialized_data = CategoriesSerializer(updated_data)
            return response.Response(data=serialized_data.data, status=200)
        return response.Response(serialized_data.errors, status=400)
        
    def delete(self, request, id):
        if not id:
            return response.Response(data={"error": "Id is required"}, status=400)
        try:
            delete_category(id)
        except Exception as e:
            return response.Response(data={"error": str(e)}, status=400)
        return response.Response(status=200, data={"message": "Category deleted successfully"})
    