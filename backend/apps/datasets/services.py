from dataclasses import dataclass
from uuid import UUID
from ..users.services import UserDataClass
from datetime import datetime
from ..categories.services import CategoriesDataClass
from .models import DatasetsModel
from ..users.models import ScriberUsers
from ..categories.models import CategoriesModel

@dataclass
class LabelsDataClass:
    id: UUID
    label: str
    description: str
    color: str
    created_at: datetime
    updated_at: datetime
    creator: UserDataClass

@dataclass
class DatasetsDataClass:
    id : UUID
    serial_number: int
    name: str
    description: str
    size: int
    annotated_decisions: int
    categorie: CategoriesDataClass
    created_at: datetime
    updated_at: datetime
    creator: UserDataClass
    labels: list[LabelsDataClass]
    deleted: bool  = False
    
@dataclass
class DatasetsLabelsDataClass:
    id: UUID
    dataset: DatasetsDataClass
    label: LabelsDataClass


def get_datasets(categorie_id: str) -> list[DatasetsDataClass]:
    '''
    Retrieve all datasets related to a certain category
    
    Parameters:
        categorie_id (str): The id of the category to retrieve the datasets from
    
    Returns:
        result_datasets (list[DatasetsDataClass]): The datasets retrieved
    '''
    datasets = DatasetsModel.objects.filter(categorie=UUID(categorie_id).hex, deleted=False)
    result_datasets = [DatasetsDataClass(id=dataset.id,
                              serial_number=dataset.serial_number,
                              name=dataset.name,
                              description=dataset.description,
                              size=dataset.size,
                              annotated_decisions=dataset.annotated_decisions,
                              categorie=CategoriesDataClass.to_dict(dataset.categorie),
                              created_at=dataset.created_at,
                              updated_at=dataset.updated_at,
                              creator=UserDataClass.to_dict(dataset.creator),
                              deleted=dataset.deleted,
                              labels=[LabelsDataClass(id=label.id,
                                                      label=label.label,
                                                      description=label.description,
                                                      color=label.color,
                                                      created_at=label.created_at,
                                                      updated_at=label.updated_at,
                                                      creator=UserDataClass.to_dict(label.creator)) for label in dataset.labels.all()]
                              ) for dataset in datasets]
    return result_datasets
    
def get_dataset(dataset_id: str) -> DatasetsDataClass:
    '''
    Retrieve a dataset by its id

    Parameters:
        dataset_id (str): The id of the dataset to retrieve

    Returns:
        dataset (DatasetsDataClass): The dataset retrieved 
    '''
    try:
        dataset = DatasetsModel.objects.get(pk=UUID(dataset_id).hex)
    except DatasetsModel.DoesNotExist:
        raise ValueError("Dataset not found")
    dataset = DatasetsDataClass(id=dataset.id,
                             serial_number=dataset.serial_number,
                             name=dataset.name,
                             description=dataset.description,
                             size=dataset.size,
                             annotated_decisions=dataset.annotated_decisions,
                             categorie=CategoriesDataClass.to_dict(dataset.categorie),
                             created_at=dataset.created_at,
                             updated_at=dataset.updated_at,
                             creator=UserDataClass.to_dict(dataset.creator),
                             deleted=dataset.deleted,
                             labels=[LabelsDataClass(id=label.id,
                                                     label=label.label,
                                                     description=label.description,
                                                     color=label.color,
                                                     created_at=label.created_at,
                                                     updated_at=label.updated_at,
                                                     creator=UserDataClass.to_dict(label.creator)) for label in dataset.labels.all()])
    return dataset
    
def create_dataset(validated_data: dict) -> DatasetsDataClass:
    '''
    Create a new dataset related to a certain category
    
    Parameters:
        validated_data (dict): The data to create the dataset with (name, description, size, annotated_decisions, creator, categorie)
    
    Returns:
        dataset (DatasetsDataClass): The dataset created in DatasetsDataClass format
    '''
    creator_user = ScriberUsers.objects.get(pk=UUID(validated_data['creator']).hex)
    categorie = CategoriesModel.objects.get(pk=UUID(validated_data['categorie']).hex)
    
    validated_data.pop('creator')
    validated_data.pop('categorie')
    dataset = DatasetsModel(**validated_data,
                            categorie=categorie,
                            creator=creator_user)
    dataset.save()
    
    dataset = DatasetsDataClass(id=dataset.id,
                             serial_number=dataset.serial_number,
                             name=dataset.name,
                             description=dataset.description,
                             size=dataset.size,
                             annotated_decisions=dataset.annotated_decisions,
                             categorie=dataset.categorie,
                             created_at=dataset.created_at,
                             updated_at=dataset.updated_at,
                             creator=dataset.creator,
                             labels=[label for label in dataset.labels.all()]
                            )
    return dataset

def update_dataset(id: str, validated_data: dict) -> DatasetsDataClass:
    '''
    Update a dataset by its id with the validated new data
    
    Parameters:
        id (str): The id of the dataset to update
        validated_data (dict): The new data to update the dataset with
    
    Returns:
        dataset (DatasetsDataClass): The updated dataset in DatasetsDataClass format
    '''
    try:
        dataset = DatasetsModel.objects.get(id=UUID(id).hex)
    except DatasetsModel.DoesNotExist:
        raise ValueError("Dataset not found")
    
    for key, value in validated_data.items():
        setattr(dataset, key, value)
    dataset.save()
    dataset = DatasetsDataClass(id=dataset.id,
                             serial_number=dataset.serial_number,
                             name=dataset.name,
                             description=dataset.description,
                             size=dataset.size,
                             annotated_decisions=dataset.annotated_decisions,
                             categorie=CategoriesDataClass.to_dict(dataset.categorie),
                             created_at=dataset.created_at,
                             updated_at=dataset.updated_at,
                             creator=UserDataClass.to_dict(dataset.creator),
                             deleted=dataset.deleted,
                             labels=[LabelsDataClass(id=label.id,
                                                     label=label.label,
                                                     description=label.description,
                                                     color=label.color,
                                                     created_at=label.created_at,
                                                     updated_at=label.updated_at,
                                                     creator=UserDataClass.to_dict(label.creator)) for label in dataset.labels.all()]
                             )
    return dataset

def delete_dataset(id: str) -> bool:
    '''
    Delete a dataset by its id
    
    Parameters:
        id (str): The id of the dataset to delete
    
    Returns:
        True (bool): True if the dataset is deleted successfully
    '''
    try:
        dataset = DatasetsModel.objects.get(pk=id)
    except DatasetsModel.DoesNotExist:
        raise ValueError("Dataset not found")
    dataset.deleted = True
    # update serial numbers of other datasets
    for temp_dataset in DatasetsModel.objects.filter(categorie=dataset.categorie, deleted=False, serial_number__gt=dataset.serial_number):
        temp_dataset.serial_number -= 1
        temp_dataset.save()
    dataset.serial_number = 0
    dataset.save()
    return True
