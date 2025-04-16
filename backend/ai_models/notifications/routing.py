from django.urls import re_path
from .consumers import TrainingNotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/training/notifications/", TrainingNotificationConsumer.as_asgi()),
]