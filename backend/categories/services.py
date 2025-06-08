from dataclasses import dataclass
from datetime import datetime
from uuid import UUID, uuid4
from users.models import ScriberUsers
from .models import CategoriesModel
from users.services import UserDataClass
from typing import Optional
from dataclasses import field

@dataclass
class CategoriesDataClass:
    serial_number: int 
    creator: UserDataClass
    nomenclature: str = field(default="")
    code: str = field(default="")
    description: str = field(default="")
    norme: str = field(default="")
    fondement: str = field(default="")
    condition: str = field(default="")
    object: str = field(default="")

    created_at: datetime = datetime.now()
    updated_at: datetime = datetime.now()
    updater: Optional[UserDataClass] = None 
    deleted: bool = False
    id: UUID = uuid4()

    @classmethod
    def to_dict(cls, category: CategoriesModel) -> "CategoriesDataClass":
        return cls(id=category['id'],
                   serial_number=category['serial_number'],
                     nomenclature=category['nomenclature'],
                        code=category['code'],
                        description=category['description'],
                        norme=category['norme'],
                        fondement=category['fondement'],
                        condition=category['condition'],
                        object=category['object'],
                        created_at=category['created_at'],
                        updated_at=category['updated_at'],
                        creator=UserDataClass.to_dict(category['creator']),
                        updater=UserDataClass.to_dict(category['updater']) if category['updater'] else None,
                        deleted=category['deleted'],
                        )

def list_categories():
    return [CategoriesDataClass.to_dict(category) for category in CategoriesModel.objects.filter(deleted=False)]

def create_category(validated_data) -> CategoriesDataClass:
    creator_user = ScriberUsers.objects.get(pk=UUID(validated_data['creator']).hex)
    category = CategoriesModel(nomenclature=validated_data['nomenclature'],
                               code=validated_data['code'],
                               description=validated_data['description'],
                               norme=validated_data['norme'],
                               fondement=validated_data['fondement'],
                               condition=validated_data['condition'],
                               object=validated_data['object'],
                               creator=creator_user,)
    try:
        category.save()
    except Exception as e:
        raise ValueError(str(e))
    
    return CategoriesDataClass.to_dict(category)

def update_category(id, validated_data) -> CategoriesDataClass:
    category = CategoriesModel.objects.get(id=UUID(id).hex)
    for key, value in validated_data.items():
            setattr(category, key, value)
    try:
        category.save()
    except Exception as e:
        raise ValueError(str(e))
    return CategoriesDataClass.to_dict(category)

def get_category(id):
    try:
        category = CategoriesModel.objects.get(id=id)
    except CategoriesModel.DoesNotExist:
        raise ValueError("Category not found")
    return CategoriesDataClass.to_dict(category)

def delete_category(id):
    try:
        category = CategoriesModel.objects.get(pk=id)
        category.deleted = True
        for cat in CategoriesModel.objects.filter(deleted=False, serial_number__gt=category.serial_number):
            cat.serial_number -= 1
            cat.save()
        category.serial_number = 0
    except CategoriesModel.DoesNotExist:
        raise ValueError("Category not found")
    category.save()
    return True