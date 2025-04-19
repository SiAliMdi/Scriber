from channels.routing import ProtocolTypeRouter, URLRouter
# from channels.auth import AuthMiddlewareStack
from django.core.asgi import get_asgi_application
from notifications.routing import websocket_urlpatterns
from notifications.middleware import JWTWebSocketMiddleware

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
