from django.contrib import admin
from .models import *


class Ai_ModelsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in Ai_ModelsModel._meta.fields]


admin.site.register(Ai_ModelsModel, Ai_ModelsAdmin)
