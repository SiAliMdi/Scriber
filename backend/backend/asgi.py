"""
ASGI config for backend project.

It exposes the ASGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/5.0/howto/deployment/asgi/
"""

## from channels.routing import get_default_application
# from django.core.asgi import get_asgi_application
# application = get_asgi_application()
# application = get_default_application()
import os
from django import setup
# from routing import asgi_application
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
setup()

from channels.routing import ProtocolTypeRouter, URLRouter
from django.core.asgi import get_asgi_application
from notifications.routing import websocket_urlpatterns
from notifications.middleware import JWTWebSocketMiddleware

application = ProtocolTypeRouter({
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
# application = asgi_application


