from rest_framework import serializers
from .models import Ai_ModelsModel
from ..categories.models import CategoriesModel

class AiModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ai_ModelsModel
        fields = '__all__'
        
    """ id = serializers.UUIDField(allow_null=True,)
    name = serializers.CharField()
    description = serializers.CharField(allow_null=True,)
    created_at = serializers.DateTimeField(allow_null=True,)
    updated_at = serializers.DateTimeField(allow_null=True,)
    deleted = serializers.BooleanField(allow_null=True,)
    model_type = serializers.CharField(allow_null=True)
    serial_number = serializers.IntegerField(allow_null=True,) """
    creator = serializers.CharField()
    category = serializers.CharField()

    def to_internal_value(self, data):
        data['model_type'] = data.get('modelType')
        del data['modelType']
        return data
    
    def update(self, instance, validated_data):
        validated_data['creator'] = instance.creator
        validated_data['category'] = instance.category
        instance = super().update(instance, validated_data)
        return instance
    
    def create(self, validated_data):
        category = validated_data.get('category')
        category = CategoriesModel.objects.get(pk=category)
        validated_data['category'] = category
        binary_classification_model = Ai_ModelsModel.objects.create(**validated_data)
        return binary_classification_model
    
    def save(self, **kwargs):
        return super().save(**kwargs)
