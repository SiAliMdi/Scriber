from django.contrib import admin
from django.contrib.auth.admin import UserAdmin

from .forms import ScriberUsersCreationForm, ScriberUsersChangeForm
from .models import ScriberUsers


class ScriberUsersAdmin(UserAdmin):
    add_form = ScriberUsersCreationForm
    form = ScriberUsersChangeForm
    model = ScriberUsers

    list_display = ("id","email","first_name", "last_name", "is_staff", "is_superuser", "date_joined")
    list_filter = ("email","first_name", "last_name", "is_staff", "is_superuser", )
    fieldsets = (
        (None, {"fields": ("email", "password")}),
        ('Personal info', {'fields': ('first_name', 'last_name')}),
        ("Permissions", {"fields": ("is_staff", "is_active", "groups", "user_permissions")}),
    )
    
    
    add_fieldsets = (
        (None, {
            "classes": ("wide",),
            "fields": (
                "email", "password", "password1", "password2", "is_staff", "is_superuser",
                "is_active", "first_name", "last_name",#"groups", "user_permissions"
            )}
        ),
    )

    search_fields = ("email","first_name", "last_name","is_staff", "is_superuser", )
    ordering = ("email","first_name", "last_name","is_staff", "is_superuser", )
    actions = ["delete_selected", "make_staff", "make_superuser", "make_active", "make_inactive"]

admin.site.register(ScriberUsers, ScriberUsersAdmin)
