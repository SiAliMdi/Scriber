from dataclasses import dataclass
from datetime import datetime
from uuid import UUID
from .models import ScriberUsers
from typing import Optional
from uuid import uuid4


@dataclass
class UserDataClass:
    email: str
    password: str
    is_active: Optional[bool]
    is_staff: Optional[bool]
    is_superuser: Optional[bool]
    last_login: Optional[datetime]
    date_joined: Optional[datetime]
    first_name: Optional[str] 
    last_name: Optional[str]
    id: UUID = uuid4()
        
    @classmethod
    def to_dict(cls, user: ScriberUsers) -> "UserDataClass":
        return cls(id=user.id, 
                   email=user.email, 
                   password=user.password, 
                   first_name=user.first_name, 
                   last_name=user.last_name, 
                   is_active=user.is_active, 
                   is_staff=user.is_staff, 
                   is_superuser=user.is_superuser, 
                   last_login=user.last_login, 
                   date_joined=user.date_joined)
        
    def __str__(self):
        if self.first_name and self.last_name:
            return " ".join([self.first_name, self.last_name]) 
        else: 
            return self.email.split('@')[0]
    
def create(validated_data) -> UserDataClass:
    user = ScriberUsers(email=validated_data.email, 
                        first_name=validated_data.first_name,
                        last_name=validated_data.last_name,
                        is_active=validated_data.is_active,
                        is_staff=validated_data.is_staff,
                        is_superuser=validated_data.is_superuser,                        )

    if validated_data.password:
        user.set_password(validated_data.password)
    
    user.save()
    return UserDataClass.to_dict(user)

def list_users() -> list[UserDataClass]:
    return [UserDataClass.to_dict(user) for user in ScriberUsers.objects.all()]

