from django.contrib import admin
from .models import *


class DecisionsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in DecisionsModel._meta.fields]


admin.site.register(DecisionsModel, DecisionsAdmin)
