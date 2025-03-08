from rest_framework import serializers
from .models import DatasetsModel, Labels, DatasetsLabelsModel

class LabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Labels
        fields = '__all__'
        
    creator = serializers.CharField()
    updater = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    def to_internal_value(self, data):
        return data
    
    def update(self, instance, validated_data, updater=None):
        if updater:
            instance.updater = updater
        validated_data['creator'] = instance.creator
        instance = super().update(instance, validated_data)
        return instance
    
class DatasetsLabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetsLabelsModel
        fields = '__all__'
        
    creator = serializers.CharField()
    updater = serializers.CharField(required=False, allow_null=True, allow_blank=True)

class DatasetsSerializer(serializers.ModelSerializer):
    class Meta:
        model = DatasetsModel
        fields = '__all__'
    
    labels = LabelsSerializer(many=True, allow_null=True, read_only=True)
    categorie = serializers.CharField()
    # categorie = CategoriesSerializer()
    creator = serializers.CharField()
    updater = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    
    def to_internal_value(self, data):
        return data
    
    def update(self, instance, validated_data, updater=None):
        validated_data['categorie'] = instance.categorie
        validated_data['creator'] = instance.creator
        if updater:
            instance.updater = updater
        instance = super().update(instance, validated_data)
        return instance
    