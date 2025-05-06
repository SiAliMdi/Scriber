from rest_framework import serializers
from .models import BinaryAnnotationsModel, TextAnnotationsModel, ExtractionAnnotationsModel, ExtractionTextAnnotationsModel

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
        fields = ['id', 'text', 'start_offset', 'end_offset', 'label', 'decision', 'state']

# Serializer for creating TextAnnotations
class TextAnnotationsCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = TextAnnotationsModel
        fields = ['text', 'start_offset', 'end_offset', 'label', 'decision']
    
    def create(self, validated_data):
        user = self.context['request'].user
        annotation = TextAnnotationsModel.objects.create(
            creator=user,
            **validated_data,
            state='annotated',
        )
        return annotation

class ExtractionTextAnnotationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExtractionTextAnnotationsModel
        fields = ['id', 'extraction', 'text', 'start_offset', 'end_offset', 'label']

class ExtractionAnnotationsSerializer(serializers.ModelSerializer):
    extraction_text = ExtractionTextAnnotationsSerializer(many=True, read_only=True)
    class Meta:
        model = ExtractionAnnotationsModel
        fields = ['id', 'decision', 'llm_json_result', 'model_annotator', 'state', 'creator', 'created_at', 'updated_at', 'extraction_text']