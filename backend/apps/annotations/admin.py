from django.contrib import admin
from .models import *


class BinaryAnnotationsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in BinaryAnnotationsModel._meta.fields]

class TextAnnotationsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in TextAnnotationsModel._meta.fields]

class ExtractionAnnotationsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in ExtractionAnnotationsModel._meta.fields]

# models handling many-to-many relationships
class ExtractionTextAnnotationsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in ExtractionTextAnnotationsModel._meta.fields]

class ExtractionBinaryAnnotationsAdmin(admin.ModelAdmin):
    list_display = [f.name for f in ExtractionBinaryAnnotationsModel._meta.fields]

admin.site.register(BinaryAnnotationsModel, BinaryAnnotationsAdmin)
admin.site.register(TextAnnotationsModel, TextAnnotationsAdmin)
admin.site.register(ExtractionAnnotationsModel, ExtractionAnnotationsAdmin)
admin.site.register(ExtractionTextAnnotationsModel, ExtractionTextAnnotationsAdmin)
admin.site.register(ExtractionBinaryAnnotationsModel, ExtractionBinaryAnnotationsAdmin)