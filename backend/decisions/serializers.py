from rest_framework import serializers
from .models import DatasetsDecisionsModel, RawDecisionsModel
from re import sub
from scripts.cleaner_utils import clean_text

class RawDecisionsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = RawDecisionsModel
        fields = '__all__'
    
    def to_internal_value(self, data):
        new_data = {}
        try:
            new_data['j_rg'] = data['number'].strip()
        except Exception:
            new_data['j_rg'] = ''
        try:
            new_data['j_date'] = data['decision_date'].strip()
        except Exception:
            new_data['j_date'] = ''
        try:
            new_data['j_ville'] = sub(r'^ca_', '', data['location'].strip())
        except Exception:
            new_data['j_ville'] = ''
        try:
            new_data['j_chambre'] = data['chamber'].strip()
        except Exception:
            new_data['j_chambre'] = ''
        try:
            new_data['j_juridiction'] = data['jurisdiction'].strip()
        except Exception:
            new_data['j_juridiction'] = ''
        try:
            new_data['j_nac'] = data['nac'].strip()
        except Exception:
            new_data['j_nac'] = ''
        try:
            new_data['j_id'] = data['id'].strip()
        except Exception:
            new_data['j_id'] = ''
        try:
            new_data['j_type'] = data['type'].strip()
        except Exception:
            new_data['j_type'] = ''
        try:
            text = data['text'].strip()
        except Exception:
            text = ''
        try:
            zones = data['zones']
        except Exception:
            zones = {}
        new_zones = {}
        cleaned_text_zones = []
        
        for zone_key, zone in zones.items():
            zone = zone[0]
            zone_text = text[zone['start']:zone['end']]
            zone_text_cleaned = clean_text(zone_text)
            cleaned_text_zones.append(zone_text_cleaned)
        
        new_data['texte_net'] = '\n'.join(cleaned_text_zones)
        
        i = 0
        for zone_key, zone in zones.items():
            zone = zone[0]
            start = new_data['texte_net'].find(cleaned_text_zones[i])
            end = start + len(cleaned_text_zones[i])
            new_zones[zone_key] = {
                'start': start,
                'end': end,
            }
            i += 1
        
        new_data['j_zones_net'] = new_zones
        return new_data
    
    def create(self, validated_data):
        return RawDecisionsModel(**validated_data)
    
class DatasetsDecisionsSerializer(serializers.ModelSerializer):
    
    class Meta:
        model = DatasetsDecisionsModel
        fields = '__all__'

    def to_internal_value(self, data):
        new_data = {}
        try:
            new_data['raw_decision'] = data['raw_decision']
        except Exception:
            new_data['raw_decision'] = ''
        try:
            new_data['dataset'] = data['dataset']
        except Exception:
            new_data['dataset'] = ''
        return new_data
    
    def create(self, validated_data):
        return DatasetsDecisionsModel(**validated_data)
    