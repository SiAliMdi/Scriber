from django.contrib import admin
from .models import *


class RawDecisionsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in RawDecisionsModel._meta.fields]

class DatasetsDecisionsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in DatasetsDecisionsModel._meta.fields]

admin.site.register(RawDecisionsModel, RawDecisionsAdmin)
admin.site.register(DatasetsDecisionsModel, DatasetsDecisionsAdmin)
