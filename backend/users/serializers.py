from rest_framework import serializers
from django.contrib.auth import get_user_model
from .services import UserDataClass
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
        model = get_user_model()
        fields = '__all__'

    def validate(self, data) -> UserDataClass:

        if not data.email:
            raise serializers.ValidationError("Email is required")
        
        if not data.password:
            raise serializers.ValidationError("Password is required")
        return UserDataClass.to_dict(super().validate(data))
    
    
    def to_internal_value(self, data):
        data = super().to_internal_value(data)
        return UserDataClass(**data)
    
    