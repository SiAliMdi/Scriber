from uuid import uuid4
from django.db import models


class CustomIncrementalField(models.PositiveIntegerField):
    def __init__(self, *args, **kwargs):
        kwargs['editable'] = False
        kwargs['blank'] = True
        super().__init__(*args, **kwargs)

    def pre_save(self, model_instance, add):
        if add:
            last_value = model_instance.__class__.objects.aggregate(models.Max('serial_number')).get('serial_number__max')
            value = 1 if last_value is None else last_value + 1
            setattr(model_instance, self.attname, value)
            return value
        else:
            return super().pre_save(model_instance, add)


class CategoriesModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    serial_number = CustomIncrementalField()
    nomenclature = models.CharField(max_length=10, blank=False, null=False)
    code = models.CharField(max_length=10, blank=False, null=False)
    description = models.TextField(blank=True, null=True, default="", max_length=32768)
    norme = models.TextField(blank=True, null=True, default="", max_length=32768)
    fondement = models.TextField(blank=True, null=True, default="", max_length=16384)
    condition = models.TextField(blank=True, null=True, default="", max_length=16384)
    object = models.TextField(blank=True, null=True, default="", max_length=16384)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='categories_creator')
    updater = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='categories_updater', null=True, blank=True)
    deleted = models.BooleanField(default=False )
    objects = models.Manager()

    def __str__(self):
        return f"{str(self.id)} - {self.serial_number} - {self.nomenclature} - {self.code}"
    
    def clean(self) -> None:
        if not self.nomenclature:
            raise ValueError('The Nomenclature must be set')
        
        if not self.code:
            raise ValueError('The Code must be set')
        
        if len(self.nomenclature) > 10:
            self.nomenclature = self.nomenclature[:10]
        
        if len(self.code) > 10:
            self.code = self.code[:10]
        
        return super().clean()
    
    def save(self, *args, **kwargs):
        self.clean()
        return super().save(*args, **kwargs)
    
    class Meta:
        verbose_name = "Category"
        verbose_name_plural = "Categories"
        db_table = "categories"
        ordering = ['created_at']
        indexes = [ 
                   models.Index(fields=['nomenclature',]),
                   models.Index(fields=[ 'code',]),
                   models.Index(fields=[ 'object', ]),
                   models.Index(fields=['condition',]),
                   models.Index(fields=[ 'norme', ]),
                   models.Index(fields=[ 'fondement',]),
                   models.Index(fields=[ 'deleted']),
                   ]

