from rest_framework import serializers
from .models import Ai_ModelsModel, PromptsModel, AiModelTypesModel
from categories.models import CategoriesModel

class AiModelSerializer(serializers.ModelSerializer):
    class Meta:
        model = Ai_ModelsModel
        fields = '__all__'
        
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

class PromptSerializer(serializers.ModelSerializer):
    class Meta:
        model = PromptsModel
        fields = '__all__'
        
    creator = serializers.CharField()
    category = serializers.CharField()
    
    def to_internal_value(self, data):
        data['json_template'] = data.get('jsonTemplate')
        del data['jsonTemplate']
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
        prompt = PromptsModel.objects.create(**validated_data)
        return prompt
    
    def save(self, **kwargs):
        return super().save(**kwargs)
    
class AiModelTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = AiModelTypesModel
        fields = ['id', 'type', 'created_at']
        read_only_fields = ['id', 'created_at']

    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['created_at'] = instance.created_at.strftime("%Y-%m-%d %H:%M")
        return data
