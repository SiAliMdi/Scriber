from uuid import uuid4
from django.db import models


class DecisionsModel(models.Model):
    class Meta:
        abstract = True
        ordering = ['-created_at']

    id = models.UUIDField(primary_key=True, default=uuid4)
    j_rg = models.CharField(max_length=255, blank=True, null=True)
    j_date = models.DateField(blank=True, null=True)
    j_ville = models.CharField(max_length=255, blank=True, null=True)
    j_chambre = models.CharField(max_length=255, blank=True, null=True)
    j_juridiction = models.CharField(max_length=255, blank=True, null=True)
    # j_formation = models.TextField(max_length=2048, blank=True, null=True)
    j_nac = models.CharField(max_length=5, blank=True, null=True)
    j_id = models.CharField(max_length=24, blank=True, null=True, unique=True)
    texte_net = models.TextField(blank=True, null=True, default="", max_length=1_00_000)
    j_zones_net = models.JSONField(blank=True, null=True)
    j_type = models.CharField(max_length=30, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)


class RawDecisionsModel(DecisionsModel):
    class Meta(DecisionsModel.Meta):
        db_table = "raw_decisions"
        indexes = [
            models.Index(fields=['j_id', ]),
            models.Index(fields=['j_rg', ]),
            models.Index(fields=['j_date',]),
            models.Index(fields=['j_ville', ]),
            models.Index(fields=['j_juridiction'],),
            models.Index(fields=['j_nac'],),
            models.Index(fields=['j_type'],),
        ]
    
    def save(self, *args, **kwargs):
        self.clean()
        if RawDecisionsModel.objects.filter(j_id=self.j_id).exists():
            return
        return super().save(*args, **kwargs)
    
    
class DatasetsDecisionsModel(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid4)
    dataset = models.ForeignKey('datasets.DatasetsModel', on_delete=models.CASCADE, related_name='dataset_decision')
    raw_decision = models.ForeignKey('decisions.RawDecisionsModel', on_delete=models.DO_NOTHING, related_name='raw_decision')
    deleted = models.BooleanField(default=False)
    add_date = models.DateTimeField(auto_now_add=True)
    # to add: list of annotations
    class Meta:
        db_table = "datasets_decisions"
        constraints = [
            models.UniqueConstraint(fields=['dataset', 'raw_decision'], name='unique_dataset_raw_decision')
        ]
        indexes = [
            models.Index(fields=['dataset',]),
            models.Index(fields=['raw_decision',]),
        ]
        ordering = ['add_date']
