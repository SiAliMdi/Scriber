from rest_framework import serializers
from .models import Ai_ModelsModel, PromptsModel, AiModelTypesModel
from categories.models import CategoriesModel

class AiModelSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(
        slug_field='type',
        queryset=AiModelTypesModel.objects.filter(deleted=False),
        required=False,
        allow_null=True,
        default=None,
    )

    class Meta:
        model = Ai_ModelsModel
        fields = '__all__'
        
    creator = serializers.CharField()
    category = serializers.CharField()

    def to_internal_value(self, data):
        data['model_type'] = data.get('modelType')
        del data['modelType']
        if 'type' in data :
            if data['model_type'] == 'extractif':
                data['type'] = None
            else:          
                try:
                    data['type'] = AiModelTypesModel.objects.get(type=data['type'])
                except AiModelTypesModel.DoesNotExist:
                    data['type'] = None
                    raise serializers.ValidationError({"type": "Invalid type value."})
        else:
            data['type'] = None
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


from .models import AiModelTrainingsModel

class AiModelTrainingSerializer(serializers.ModelSerializer):
    type = serializers.SlugRelatedField(
        slug_field='type',
        queryset=AiModelTypesModel.objects.filter(deleted=False),
        required=False,
        allow_null=True,
        default=None,
    )
    modelId = serializers.UUIDField(source="model.id", read_only=True)  # Add modelId field

    class Meta:
        model = AiModelTrainingsModel
        fields = ['id', 'training_status', 'training_result', 'updated_at', 'type', 'modelId']  # Include modelId
