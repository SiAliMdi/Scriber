from django.contrib import admin
from .models import *


class CategoriesAdmin(admin.ModelAdmin):
    list_display = [f.name for f in CategoriesModel._meta.fields]


admin.site.register(CategoriesModel, CategoriesAdmin)
