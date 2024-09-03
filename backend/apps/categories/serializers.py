from rest_framework import serializers
from .models import CategoriesModel

class CategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriesModel
        fields = '__all__'
        
    
    creator = serializers.CharField()
    updater = serializers.CharField(required=False, allow_null=True, allow_blank=True)
