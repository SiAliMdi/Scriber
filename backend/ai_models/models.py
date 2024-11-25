from uuid import uuid4
from django.db import models


def model_upload_to(instance, filename):
    # Generate a unique filename to avoid collisions
    # unique_filename = str(uuid4()) + os.path.splitext(filename)[1]
    return f'models/{instance.id}/{instance.name}/{instance.created_at.strftime("%Y-%m-%d")}/'#{unique_filename}'


class CustomIncrementalField(models.PositiveIntegerField):
    def __init__(self, *args, **kwargs):
        kwargs['editable'] = False
        kwargs['blank'] = True
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        if add:
            last_value = model_instance.__class__.objects.filter(deleted=False, category=model_instance.category).aggregate(models.Max('serial_number')).get('serial_number__max')
            value = 1 if last_value is None else last_value + 1
            setattr(model_instance, self.attname, value)
            return value
        else:
            return super().pre_save(model_instance, add)

class Ai_ModelsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    serial_number = CustomIncrementalField()
    name = models.CharField(max_length=255, blank=False, null=False)
    description = models.TextField(blank=True, null=True, default="", max_length=4096)
    created_at = models.DateTimeField(auto_now_add=True)
    model_path = models.FileField(upload_to='models/' + str(id) + '/' + str(name) + '/' + str(created_at) + '/', blank=False, null=False)
    model_type = models.CharField(max_length=255, blank=True, null=True)
    category = models.ForeignKey('categories.CategoriesModel', on_delete=models.DO_NOTHING, related_name='ai_models_category', blank=True, null=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='ai_models_creator')
    deleted = models.BooleanField(default=False)
    objects = models.Manager()

    class Meta:
        # abstract = True
        ordering = ['created_at']
        indexes = [ models.Index(fields=['name',])]
        db_table = "ai_models"

class PromptsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    serial_number = CustomIncrementalField()
    prompt = models.TextField(blank=False, null=False, default="", max_length=32_768)
    category = models.ForeignKey('categories.CategoriesModel', on_delete=models.DO_NOTHING, related_name='prompt_category', blank=True, null=True)
    
    json_template = models.JSONField(blank=True, null=True, default=None)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='prompts_creator')
    deleted = models.BooleanField(default=False)
    objects = models.Manager()

    class Meta:
        db_table = "prompts"
        ordering = ['serial_number']
        indexes = [ models.Index(fields=['prompt'])]

class AiModelTrainingsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    model = models.ForeignKey('Ai_ModelsModel', on_delete=models.DO_NOTHING, related_name='training_model')
    # prompt = models.ForeignKey('PromptsModel', on_delete=models.DO_NOTHING, related_name='training_prompt')
    dataset = models.ForeignKey('datasets.DatasetsModel', on_delete=models.DO_NOTHING, related_name='training_dataset')
    training_status = models.CharField(max_length=255, blank=False, null=False, default="pending")
    training_result = models.JSONField(blank=True, null=True, default=None)
    training_log = models.TextField(blank=True, null=True, default="", max_length=32_768)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='trainings_creator')

    objects = models.Manager()

    class Meta:
        db_table = "model_trainings"
        ordering = ['model', ]
        indexes = [ models.Index(fields=['model', ])]