from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/users/', include('users.urls')),
    path('api/ai_models/', include('ai_models.urls')),
    path('api/annotations/', include('annotations.urls')),
    path('api/categories/', include('categories.urls')),
    path('api/datasets/', include('datasets.urls')),
    path('api/decisions/', include('decisions.urls')),
]
