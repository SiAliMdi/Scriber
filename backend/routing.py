from channels.routing import ProtocolTypeRouter, URLRouter
from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from ai_models.notifications.routing import websocket_urlpatterns
from ai_models.notifications.middleware import JWTWebSocketMiddleware

asgi_application = ProtocolTypeRouter({
    "http": get_asgi_application(),
    "websocket": 
        #AuthMiddlewareStack
        JWTWebSocketMiddleware
    (
        URLRouter(
            websocket_urlpatterns
        )
    ),
})
