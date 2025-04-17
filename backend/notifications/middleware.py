from channels.middleware import BaseMiddleware
from channels.db import database_sync_to_async
from django.contrib.auth.models import AnonymousUser
from users.services import ScriberUserAuthentication

""" class JWTWebSocketMiddleware(BaseMiddleware):  
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = None
        
        # Extraire le token des query params (ex: ?token=abc123)
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=")[1]
            elif param.startswith("training_id="):
                training_id = param.split("=")[1]

        if token:
            # Utiliser votre logique d'authentification existante
            fake_request = type('FakeRequest', (), {"headers": {"Authorization": token}})
            auth = ScriberUserAuthentication()
            user, _ = await database_sync_to_async(auth.authenticate)(fake_request)
            scope["user"] = user if user else AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        scope["training_id"] = training_id if training_id else None
        
        return await super().__call__(scope, receive, send) """

class JWTWebSocketMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query_string = scope.get("query_string", b"").decode()
        token = None
        dataset_id = None
        model_id = None
        training_id = None

        # Extract query parameters
        for param in query_string.split("&"):
            if param.startswith("token="):
                token = param.split("=")[1]
            elif param.startswith("dataset_id="):
                dataset_id = param.split("=")[1]
            elif param.startswith("model_id="):
                model_id = param.split("=")[1]
            elif param.startswith("training_id="):
                training_id = param.split("=")[1]

        if token:
            # Authenticate user
            fake_request = type("FakeRequest", (), {"headers": {"Authorization": token}})
            auth = ScriberUserAuthentication()
            user, _ = await database_sync_to_async(auth.authenticate)(fake_request)
            scope["user"] = user if user else AnonymousUser()
        else:
            scope["user"] = AnonymousUser()

        scope["dataset_id"] = dataset_id
        scope["model_id"] = model_id
        scope["training_id"] = training_id

        return await super().__call__(scope, receive, send)
    