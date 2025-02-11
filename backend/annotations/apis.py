from uuid import UUID
from django.shortcuts import get_object_or_404
from rest_framework import views, permissions, response
from annotations.models import BinaryAnnotationsModel
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