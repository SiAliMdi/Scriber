from uuid import uuid4
from django.db import models


class Ai_ModelsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)

    name = models.CharField(max_length=255, blank=False, null=False)
    description = models.TextField(blank=True, null=True, default="", max_length=4096)
    model_path = models.FileField(upload_to='models/', blank=False, null=False)
    model_type = models.CharField(max_length=255, blank=False, null=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='ai_models_creator')

    objects = models.Manager()

    class Meta:
        abstract = True
        ordering = ['name']
        indexes = [ models.Index(fields=['name',])]


class BinaryClassificationModelsModel(Ai_ModelsModel):

    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='binary_classification_models_creator')
    class Meta(Ai_ModelsModel.Meta):
        db_table = "binary_classification_models"


class ExtractionModelsModel(Ai_ModelsModel):

    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='extraction_models_creator')
    class Meta(Ai_ModelsModel.Meta):
        db_table = "extraction_models"

class PromptsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    prompt = models.TextField(blank=False, null=False, default="", max_length=32_768)
    category = models.ForeignKey('categories.CategoriesModel', on_delete=models.DO_NOTHING, related_name='prompt_category', blank=True, null=True)
    
    json_template = models.JSONField(blank=True, null=True, default=None)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='prompts_creator')

    objects = models.Manager()

    class Meta:
        db_table = "prompts"
        ordering = ['prompt']
        indexes = [ models.Index(fields=['prompt'])]