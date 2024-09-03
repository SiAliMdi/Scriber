from dataclasses import dataclass
from datetime import datetime#, timedelta
from uuid import UUID
from .models import ScriberUsers
from typing import Optional
from uuid import uuid4
import jwt
from django.conf import settings
from django.utils import timezone
from rest_framework import authentication, exceptions
from django.contrib.auth import authenticate, login, logout

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
            return " ".join([str(self.id), self.first_name, self.last_name]) 
        else: 
            return " ".join([str(self.id), self.email.split('@')[0]])
    
def create_user(validated_data) -> UserDataClass:
    user = ScriberUsers(email=validated_data.email, 
                        first_name=validated_data.first_name,
                        last_name=validated_data.last_name,
                        is_active=validated_data.is_active,
                        is_staff=validated_data.is_staff,
                        is_superuser=validated_data.is_superuser,)

    if validated_data.password:
        user.set_password(validated_data.password)
    try:
        user.save()
    except Exception as e:
        raise ValueError(str(e))
    return UserDataClass.to_dict(user)

def list_users() -> list[UserDataClass]:
    return [UserDataClass.to_dict(user) for user in ScriberUsers.objects.all()]

def login_user(request, email: str, password: str) -> UserDataClass:
    try:
        user = ScriberUsers.objects.get(email=email)
    except ScriberUsers.DoesNotExist:
        raise ValueError("Invalid credentials")
    
    if user.check_password(password):
        ScriberUserAuthentication().authenticate(request)
        login(request, user)
        authenticate(request, email=email, password=password)
        return UserDataClass.to_dict(user)
    else:
        raise ValueError("Invalid credentials")
    
def create_token(user: UserDataClass) -> str:
    # update last_login ans is_active fields of the user model
    user.last_login = timezone.now()
    try:
        scriber_user = ScriberUsers.objects.get(id=user.id)
        scriber_user.last_login = timezone.now()
        scriber_user.is_active = True
        scriber_user.save()
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")
    
    date_now = int(datetime.now().timestamp())
    expiration_date = date_now + 24 * 60 * 60
    # expiration_date = date_now + timedelta(hours=24)
    payload = dict(
        id=user.id.hex, # convert UUID to its string value to be serializable
        exp=expiration_date,
        iat=date_now,
    )
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")

    return token

class ScriberUserAuthentication(authentication.BaseAuthentication):
    def authenticate(self, request):
        # request.META.get("HTTP_AUTHORIZATION") || request.COOKIES.get("jwt")
        token = request.headers.get("Authorization")

        if not token:
            return None

        try:
            payload = jwt.decode(token, settings.JWT_SECRET, algorithms=["HS256"])
        except:
            raise exceptions.AuthenticationFailed("Unauthorized")
        
        try:
            user = ScriberUsers.objects.get(id=payload["id"])
        except ScriberUsers.DoesNotExist:
            raise exceptions.AuthenticationFailed("User not found")
        
        return (user, None)

def logout_user(request, user_email: str) -> None:
    try:
        user = ScriberUsers.objects.get(email=user_email)
        user.is_active = False
        user.save()
        logout(request)
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")

def get_user(user_email: str) -> UserDataClass:
    try:
        user = ScriberUsers.objects.get(email=user_email)
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")
    return UserDataClass.to_dict(user)

def update_user(user_email: str, is_staff: bool) -> UserDataClass:
    try:
        user = ScriberUsers.objects.get(email=user_email)
        if user.is_superuser:
            raise ValueError("Cannot update superuser")
        user.is_staff = is_staff
        user.save()
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")
    return UserDataClass.to_dict(user)

def delete_user(user_email: str) -> None:
    try:
        user = ScriberUsers.objects.get(email=user_email)
        if user.is_superuser:
            raise ValueError("Cannot delete superuser")
        user.delete()
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")

def check_password(user_email: str, password: str) -> bool:
    try:
        user = ScriberUsers.objects.get(email=user_email, password=password)
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")
    return True
    
def change_password(user_email: str, password: str, new_password: str) -> None:
    try:
        user = ScriberUsers.objects.get(email=user_email, password=password)
        user.set_password(new_password)
        user.save()
    except ScriberUsers.DoesNotExist:
        raise ValueError("Unexisted user")