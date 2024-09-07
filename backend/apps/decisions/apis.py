from rest_framework import views, permissions, response, generics
from ..users import services as users_services
from . import services
from .models import RawDecisionsModel
from .serializers import RawDecisionsSerializer

class RawDecisionsListView(generics.ListAPIView):
    authentication_classes = (users_services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    queryset = RawDecisionsModel.objects.all()
    serializer_class = RawDecisionsSerializer


class RawDecisionsDetailView(views.APIView):
    def get(self, request, decision_id):
        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            decision = services.get_raw_decision(decision_id)
            serializer = RawDecisionsSerializer(decision)
            return response.Response(data=serializer.data, status=200)
        
    def post(self, request):
        serialized_data  = RawDecisionsSerializer(data=request.data)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = services.create_raw_decision(validated_data)    
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)
        
    def patch(self, request, decision_id):
        serialized_data = RawDecisionsSerializer( data=request.data, partial=True)
        if serialized_data.is_valid():
            validated_data = serialized_data.validated_data
            serialized_data.instance = services.update_raw_decision(decision_id, validated_data)
            return response.Response(data=serialized_data.data, status=200)
        else:
            return response.Response(data=serialized_data.errors, status=400)
    
    def delete(self, request, decision_id):
        services.delete_raw_decision(decision_id)
        return response.Response({"message": "decision deleted successfully"}, status=204)