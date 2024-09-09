from rest_framework import views, permissions, response
from ..users import services


class home(views.APIView):
    authentication_classes = (services.ScriberUserAuthentication,)
    permission_classes = (permissions.IsAuthenticated,)

    def get(self, request):

        if not request.user.is_authenticated:
            return response.Response(data={"error": "Unauthorized"}, status=401)
        else:
            return response.Response(data={"message": "Hello annotations!"}, status=200)
