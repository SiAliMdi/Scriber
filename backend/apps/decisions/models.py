from typing import Iterable
from uuid import uuid4
from django.db import models


class DecisionsModel(models.Model):
    class Meta:
        abstract = True
        ordering = ['-created_at']

    id = models.UUIDField(primary_key=True, default=uuid4)
    rg = models.CharField(max_length=255, blank=True, null=True)
    date = models.DateField(blank=True, null=True)
    ville = models.CharField(max_length=255, blank=True, null=True)
    chambre = models.CharField(max_length=255, blank=True, null=True)
    juridiction = models.CharField(max_length=255, blank=True, null=True)
    formation = models.TextField(max_length=2048, blank=True, null=True)
    texte = models.TextField(blank=True, null=True, default="", max_length=1_00_000)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    creator = models.ForeignKey('users.ScriberUsers', on_delete=models.DO_NOTHING, related_name='decisions_creator')


class RawDecisionsModel(DecisionsModel):
    class Meta(DecisionsModel.Meta):
        db_table = "raw_decisions"
        indexes = [
            models.Index(fields=['rg', ]),
            models.Index(fields=[ 'date',]),
            models.Index(fields=['ville', ]),
            models.Index(fields=['juridiction']),
        ]
    
    def save(self, *args, **kwargs):
        self.clean()
        if RawDecisionsModel.objects.filter(texte=self.texte).exists():
            return
        if self.texte:
            return super().save(*args, **kwargs)
        else:
            return

class DatasetsDecisionsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    dataset = models.ForeignKey('datasets.DatasetsModel', on_delete=models.DO_NOTHING, related_name='dataset_decision')
    raw_decision = models.ForeignKey('decisions.RawDecisionsModel', on_delete=models.DO_NOTHING, related_name='raw_decision')
    # to add: list of annotations
    class Meta:
        db_table = "datasets_decisions"
        constraints = [
            models.UniqueConstraint(fields=['dataset', 'raw_decision'], name='unique_dataset_raw_decision')
        ]

