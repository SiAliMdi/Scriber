from uuid import UUID
from django.shortcuts import get_object_or_404
from rest_framework import views, permissions, response, status
from annotations.models import BinaryAnnotationsModel, TextAnnotationsModel
from annotations.serializers import TextAnnotationsCreateSerializer, TextAnnotationsSerializer
from datasets.models import Labels
from users import services



class BinDatasetRawDecisionsView(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)
    
    def patch(self, request, annotation_id):
        annotation = get_object_or_404(BinaryAnnotationsModel, pk=UUID(annotation_id).hex)
        annotation.label = get_object_or_404(Labels, label=request.data.get('label'))
        annotation.save()
        return response.Response({"message": "Annotation updated successfully"}, status=200)
    
# Create a new annotation
class ExtAnnotationCreateView(views.APIView):
    def post(self, request):
        serializer = TextAnnotationsCreateSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            annotation = serializer.save()
            return response.Response(TextAnnotationsSerializer(annotation).data, status=status.HTTP_201_CREATED)
        return response.Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# Delete an annotation
class ExtAnnotationDeleteView(views.APIView):
    def delete(self, request, annotation_id):
        try:
            annotation = TextAnnotationsModel.objects.get(id=annotation_id, creator=request.user)
            annotation.deleted = True
            annotation.save()
            return response.Response(status=status.HTTP_204_NO_CONTENT)
        except TextAnnotationsModel.DoesNotExist:
            return response.Response({"error": "Annotation not found or not authorized"}, status=status.HTTP_404_NOT_FOUND)