from dataclasses import dataclass
from uuid import UUID
from rest_framework import exceptions
from datetime import datetime

from ..users.models import ScriberUsers
from ..users.services import UserDataClass
from .models import RawDecisionsModel, DatasetsDecisionsModel
from ..datasets.models import DatasetsModel

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
    deleted: bool = False

    @classmethod
    def to_dict(cls, instance):
        return cls(id=instance.id,
                     dataset=instance.dataset,
                     raw_decision=instance.raw_decision,
                    deleted=instance.deleted
                     )

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

def get_decision(decision_id: str) -> DatasetsDecisionsDataClass:
    try:
        decision = DatasetsDecisionsModel.objects.get(pk=UUID(decision_id).hex)
        decision_data = DatasetsDecisionsDataClass.to_dict(decision)
    except DatasetsDecisionsModel.DoesNotExist:
        raise exceptions.NotFound("Decision not found")
    return decision_data

def create_decision(dataset_id: str, validated_data) -> list[DatasetsDecisionsDataClass]:
    dataset = DatasetsModel.objects.get(pk=UUID(dataset_id).hex)
    print("validated_data", validated_data[0]['raw_decision'].id)
    print("validated_data", type(validated_data[0]['raw_decision'].id))
    raw_decisions = [RawDecisionsModel.objects.get(pk=raw_decision['raw_decision'].id) for raw_decision in validated_data]
    decisions = []
    for raw_decision in raw_decisions:
        decision = DatasetsDecisionsModel(dataset=dataset, raw_decision=raw_decision)
        try:
            decision.save()
            decisions.append(decision)
        except Exception as e:
            raise ValueError(str(e))
    return [DatasetsDecisionsDataClass.to_dict(decision) for decision in decisions]

def update_decision(decision_id: str, validated_data) -> DatasetsDecisionsDataClass:
    try:
        decision = DatasetsDecisionsModel.objects.get(pk=UUID(decision_id).hex)
        for key, value in validated_data.items():
            setattr(decision, key, value)
        decision.save()
        return DatasetsDecisionsDataClass.to_dict(decision)
    except DatasetsDecisionsModel.DoesNotExist:
        raise exceptions.NotFound("Decision not found")
    except Exception as e:
        raise ValueError(str(e))

def delete_decision(decision_id: str):
    try:
        decision = DatasetsDecisionsModel.objects.get(id=decision_id)
        decision.delete()
    except DatasetsDecisionsModel.DoesNotExist:
        raise exceptions.NotFound("Decision not found")
    except Exception as e:
        raise ValueError(str(e))