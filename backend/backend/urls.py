from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('apps.users.urls')),
    path('api/ai_models/', include('apps.ai_models.urls')),
    path('api/annotations/', include('apps.annotations.urls')),
    path('api/categories/', include('apps.categories.urls')),
    path('api/datasets/', include('apps.datasets.urls')),
    path('api/decisions/', include('apps.decisions.urls')),
]
