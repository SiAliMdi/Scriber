from rest_framework import serializers
from .models import DatasetsModel, Labels, DatasetsLabelsModel


class LabelsSerializer(serializers.ModelSerializer):
    class Meta:
        model = Labels
        fields = '__all__'
        
    creator = serializers.CharField()

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
    
    labels = LabelsSerializer(many=True)
    categorie = serializers.CharField()
    creator = serializers.CharField()
    updater = serializers.CharField(required=False, allow_null=True, allow_blank=True)