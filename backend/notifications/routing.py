from django.urls import re_path
from .consumers import TrainingNotificationConsumer, AnnotationNotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/training/notifications/", TrainingNotificationConsumer.as_asgi()),
        re_path(r"ws/annotation/notifications/", AnnotationNotificationConsumer.as_asgi()),  # New route

]