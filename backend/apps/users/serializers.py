from rest_framework import serializers
from .services import UserDataClass
from .models import ScriberUsers
from datetime import datetime


class UserSerializer(serializers.ModelSerializer):
    is_staff = serializers.BooleanField( default=False)
    is_superuser = serializers.BooleanField(default=False)
    is_active = serializers.BooleanField(default=True)

    first_name = serializers.CharField(default="")
    last_name = serializers.CharField(default="")
    date_joined = serializers.DateTimeField(default=datetime.now())
    last_login = serializers.DateTimeField(default=datetime.now())
    
    class Meta:
        model = ScriberUsers
        fields = ['id', 'email', 'password', 'first_name', 'last_name', 'is_active', 'is_staff', 'is_superuser', 'last_login', 'date_joined']

    def validate(self, data) -> UserDataClass:

        if not data.email:
            raise serializers.ValidationError("Email is required")
        
        if not data.password:
            raise serializers.ValidationError("Password is required")
        return UserDataClass.to_dict(super().validate(data))
    
    
    def to_internal_value(self, data):
        data = super().to_internal_value(data)
        return UserDataClass(**data)
    
    def get_id(self, data):
        return data.id
    