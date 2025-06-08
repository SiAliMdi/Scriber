from django.contrib.auth.forms import UserCreationForm, UserChangeForm

from .models import ScriberUsers


class ScriberUsersCreationForm(UserCreationForm):

    class Meta:
        model = ScriberUsers
        fields = ("email", "first_name", "last_name","is_staff", "is_superuser", )

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields["password1"].required = True
        self.fields["password2"].required = True
    
    def clean(self):
        cleaned_data = super().clean()
        password1 = cleaned_data.get("password1")
        password2 = cleaned_data.get("password2")
        cleaned_data["password"] = password2

        if password1 != password2:
            raise ValueError("Passwords don't match")

        return cleaned_data

    def save(self, commit=True):
        user = super().save(commit=False)
        print(f"{user = }")
        user.set_password(self.cleaned_data["password"])
        print(f"{user = } 2")
        
        if commit:
            user.save()
            print(f"{user = } saved")
        return user
    
class ScriberUsersChangeForm(UserChangeForm):

    class Meta:
        model = ScriberUsers
        fields = ("email","first_name", "last_name","is_staff", "is_superuser", )

