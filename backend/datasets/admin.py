from django.contrib import admin
from .models import *


class DatasetsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in DatasetsModel._meta.fields]

class LabelsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in Labels._meta.fields]


class DatasetsLabelsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in DatasetsLabelsModel._meta.fields]

admin.site.register(DatasetsModel, DatasetsAdmin)
admin.site.register(Labels, LabelsAdmin)
admin.site.register(DatasetsLabelsModel, DatasetsLabelsAdmin)