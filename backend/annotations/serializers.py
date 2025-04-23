from rest_framework import serializers
from .models import BinaryAnnotationsModel, TextAnnotationsModel

class BinaryAnnotationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BinaryAnnotationsModel
        fields = [
            'id',
            'label',
            'decision',
            # 'human_annotator',
            'state',
            'model_annotator',
            'trained_model_annotator',
            'creator',
            'updator',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
        
    def to_representation(self, instance):
        data = super().to_representation(instance)
        data['decision'] = instance.decision.raw_decision.id
        data['label'] = instance.label.label
        return data

# Serializer for TextAnnotationsModel
class TextAnnotationsSerializer(serializers.ModelSerializer):
    label = serializers.SlugRelatedField(slug_field='id', read_only=True)
    class Meta:
        model = TextAnnotationsModel
        fields = ['id', 'text', 'start_offset', 'end_offset', 'label', 'decision']

# Serializer for creating TextAnnotations
class TextAnnotationsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextAnnotationsModel
        fields = ['text', 'start_offset', 'end_offset', 'label', 'decision']
    
    def create(self, validated_data):
        user = self.context['request'].user
        annotation = TextAnnotationsModel.objects.create(
            creator=user,
            **validated_data
        )
        return annotation