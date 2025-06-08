from rest_framework import serializers
from .models import CategoriesModel

class CategoriesSerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriesModel
        fields = '__all__'
        
    creator = serializers.CharField()
    updater = serializers.CharField(source='ScriberUsers.id', required=False, allow_null=True, allow_blank=True)
    
    
    def update(self, instance, validated_data, updater=None):
        if 'creator' in validated_data:
            del validated_data['creator']        
        if updater:
            instance.updater = updater
        instance = super().update(instance, validated_data)
        return instance

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = CategoriesModel
        fields = ('nomenclature', 'code', 'description', 'norme', 'fondement', 'condition', 'object', 'creator', )

    def to_internal_value(self, data):
        return data
    
    def create(self, validated_data):
        category = CategoriesModel.objects.create(**validated_data)
        return category