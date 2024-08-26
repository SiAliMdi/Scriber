from django.contrib import admin
from .models import *


class AnnotationsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in AnnotationsModel._meta.fields]


admin.site.register(AnnotationsModel, AnnotationsAdmin)
