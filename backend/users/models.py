from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from django.db import models
from django.utils.translation import gettext_lazy as _
import uuid
from .managers import CustomUserManager


class ScriberUsers(AbstractBaseUser, PermissionsMixin):
    username = None
    id = models.UUIDField(primary_key=True, default=uuid.uuid4)
    email = models.EmailField(_("email address"), unique=True)
    password = models.CharField(_("password"), max_length=128)
    is_staff = models.BooleanField(_("the user is staff"), default=False)
    is_superuser = models.BooleanField(_("the user is admin"),default=False)
    is_active = models.BooleanField(_("the user is active"),default=True)

    first_name = models.CharField(_("the user first name"), blank=True, max_length=100)
    last_name = models.CharField(_("the user last name"),blank=True, max_length=100)
    date_joined = models.DateTimeField(_("the user join date"),auto_now_add=True, editable=False)
    last_login = models.DateTimeField(_("the user last login date"),auto_now=True, editable=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []

    objects = CustomUserManager()

    def __str__(self):
        if self.first_name and self.last_name:
            return " ".join([self.first_name, self.last_name]) 
        else: 
            return self.email.split('@')[0]

    def get_full_name(self):
        return f"{self.first_name} {self.last_name}"
    
    def clean(self) -> None:
        if not self.email:
            raise ValueError(_('The Email must be set'))
        
        if not self.password:
            raise ValueError(_('The Password must be set'))
        
        if not self.first_name:
            self.first_name = self.email.split('@')[0]

        if not self.last_name:
            self.last_name = self.email.split('@')[0]
        
        if len(self.first_name) > 100:
            self.first_name = self.first_name[:100]

        if len(self.last_name) > 100:
            self.last_name = self.last_name[:100]
        
    def save(self, *args, **kwargs):
        self.clean()
        super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = _("User")
        verbose_name_plural = _("Users")
        # db_table = "scriber_users"
        ordering = ["-date_joined"]
