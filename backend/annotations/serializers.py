from rest_framework import serializers
from .models import BinaryAnnotationsModel

class BinaryAnnotationsSerializer(serializers.ModelSerializer):
    class Meta:
        model = BinaryAnnotationsModel
        fields = [
            'id',
            'label',
            'decision',
            # 'human_annotator',
            'model_annotator',
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
    