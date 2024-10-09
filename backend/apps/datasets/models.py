from uuid import uuid4
from django.db import models

class Labels(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    label = models.CharField(max_length=255, blank=False, null=False)
    description = models.TextField(blank=True, null=True, default="", max_length=4096)
    color = models.CharField(max_length=7, blank=True, null=True, default="#f0f0f0")
    # tag = models.ForeignKey('datasets.DatasetTagsModel', on_delete=models.DO_NOTHING, related_name='label_tag', blank=True, null=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='labels_creator')

    objects = models.Manager()
    class Meta:
        db_table = "labels"
        ordering = ['label']
        indexes = [ models.Index(fields=['label'])]


class CustomIncrementalField(models.PositiveIntegerField):
    def __init__(self, *args, **kwargs):
        kwargs['editable'] = False
        kwargs['blank'] = True
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        if add:
            last_value = model_instance.__class__.objects.filter(categorie=model_instance.categorie).filter(deleted=False).aggregate(models.Max('serial_number')).get('serial_number__max')
            value = 1 if last_value is None else last_value + 1
            setattr(model_instance, self.attname, value)
            return value
        else:
            return super().pre_save(model_instance, add)

class DatasetsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    serial_number = CustomIncrementalField() # models.AutoField()
    name = models.CharField(max_length=255, blank=False, null=False)
    description = models.TextField(blank=True, null=True, default="", max_length=4096)
    size = models.PositiveIntegerField(blank=True, null=True, default=0)
    annotated_decisions = models.PositiveIntegerField(blank=True, null=True, default=0)
    # dataset_tag = models.ForeignKey('datasets.DatasetTagsModel', on_delete=models.DO_NOTHING, related_name='dataset_tag', blank=True, null=True)
    categorie = models.ForeignKey('categories.CategoriesModel', on_delete=models.DO_NOTHING, related_name='dataset_categorie', blank=True, null=True)
    labels = models.ManyToManyField('datasets.Labels', related_name='labels',  blank=True,  through='datasets.DatasetsLabelsModel')

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='datasets_creator')
    deleted = models.BooleanField(default=False )
    
    class Meta:
        # abstract = True
        ordering = ['serial_number']
        indexes = [ models.Index(fields=['name',]), 
                   models.Index(fields=[ 'categorie']),
                   models.Index(fields=['deleted'])
                   ]

class DatasetsLabelsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    dataset = models.ForeignKey('datasets.DatasetsModel', on_delete=models.DO_NOTHING, related_name='dataset', blank=True, null=True)
    label = models.ForeignKey('datasets.Labels', on_delete=models.DO_NOTHING, related_name='label_id', blank=True, null=True)
    
    objects = models.Manager()

    class Meta:
        db_table = "datasets_labels"
        constraints = [
            models.UniqueConstraint(fields=['dataset', 'label'], name='unique_train_dataset_label')
        ]
        indexes = [ models.Index(fields=['dataset'])]

