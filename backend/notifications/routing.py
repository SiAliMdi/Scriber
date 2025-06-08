from django.urls import re_path
from .consumers import ExtractAnnotationNotificationConsumer, TrainingNotificationConsumer, AnnotationNotificationConsumer

websocket_urlpatterns = [
    re_path(r"ws/training/notifications/", TrainingNotificationConsumer.as_asgi()),
        re_path(r"ws/annotation/notifications/", AnnotationNotificationConsumer.as_asgi()),  # New route
    re_path(r"ws/extract_annotation/notifications/", ExtractAnnotationNotificationConsumer.as_asgi()),

]