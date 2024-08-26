from django.contrib import admin
from .models import *


class DatasetsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in DatasetsModel._meta.fields]


admin.site.register(DatasetsModel, DatasetsAdmin)
