from django.contrib import admin
from .models import *


class BinaryModelsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in BinaryClassificationModelsModel._meta.fields]

class ExtractionModelsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in ExtractionModelsModel._meta.fields]

admin.site.register(BinaryClassificationModelsModel, BinaryModelsAdmin)
admin.site.register(ExtractionModelsModel, ExtractionModelsAdmin)
