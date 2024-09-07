from dataclasses import dataclass
from uuid import UUID
from rest_framework import exceptions
from datetime import datetime

from ..users.models import ScriberUsers
from ..users.services import UserDataClass
from .models import RawDecisionsModel

@dataclass
class DecisionsDataClass:
    id: UUID
    rg: str
    date: datetime
    ville: str
    chambre: str
    juridiction: str
    formation: str
    texte: str

    created_at: datetime
    updated_at: datetime
    creator: UserDataClass

    @classmethod
    def to_dict(cls, instance):
        return cls(id=instance.id,
                     rg=instance.rg,
                     date=instance.date,
                     ville=instance.ville,
                     chambre=instance.chambre,
                     juridiction=instance.juridiction,
                     formation=instance.formation,
                     texte=instance.texte,
                     created_at=instance.created_at,
                     updated_at=instance.updated_at,
                     creator=UserDataClass.to_dict(instance.creator))

@dataclass
class DatasetsDecisionsDataClass:
    id: UUID
    dataset: UUID
    raw_decision: UUID

    @classmethod
    def to_dict(cls, instance):
        return cls(id=instance.id,
                     dataset=instance.dataset,
                     raw_decision=instance.raw_decision)

def get_raw_decision(decision_id: str) -> DecisionsDataClass:
    try:
        decision = RawDecisionsModel.objects.get(pk=UUID(decision_id).hex)
        decision_data = DecisionsDataClass.to_dict(decision)
        return decision_data
    except RawDecisionsModel.DoesNotExist:
        raise exceptions.NotFound("Decision not found")

def create_raw_decision(validated_data) -> DecisionsDataClass:
    creator_user = ScriberUsers.objects.get(pk=UUID(validated_data['creator']).hex)
    decision = RawDecisionsModel(rg=validated_data['rg'],
                                 date=validated_data['date'],
                                 ville=validated_data['ville'],
                                 chambre=validated_data['chambre'],
                                 juridiction=validated_data['juridiction'],
                                 formation=validated_data['formation'],
                                 texte=validated_data['texte'],
                                 creator=creator_user)
    try:
        decision.save()
    except Exception as e:
        raise ValueError(str(e))
    return DecisionsDataClass.to_dict(decision)

def update_raw_decision(decision_id: str, validated_data) -> DecisionsDataClass:
    try:
        decision = RawDecisionsModel.objects.get(pk=UUID(decision_id).hex)
        for key, value in validated_data.items():
            print(key, value)   
            setattr(decision, key, value)
        decision.save()
        print("saved")
        return DecisionsDataClass.to_dict(decision)
    except RawDecisionsModel.DoesNotExist:
        raise exceptions.NotFound("Decision not found")
    except Exception as e:
        raise ValueError(str(e))

def delete_raw_decision(decision_id: str):
    try:
        decision = RawDecisionsModel.objects.get(id=decision_id)
        decision.delete()
    except RawDecisionsModel.DoesNotExist:
        raise exceptions.NotFound("Decision not found")
    except Exception as e:
        raise ValueError(str(e))