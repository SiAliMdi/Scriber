from rest_framework import serializers
from .models import DatasetsDecisionsModel, RawDecisionsModel

class RawDecisionsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = RawDecisionsModel
        fields = '__all__'
    creator = serializers.CharField()
    
class DatasetsDecisionsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = DatasetsDecisionsModel
        fields = ['id', 'raw_decision']