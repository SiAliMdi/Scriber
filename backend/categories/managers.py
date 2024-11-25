from django.db import models


class CategoriesManager(models.Manager):
    """
    Unused manager for the CategoriesModel model.
    """

    def get_queryset(self) -> models.QuerySet:
        return super().get_queryset()
    
    def get_category(self, category_id: str):
        return self.get(id=category_id)
    
    def get_category_by_nomenclature(self, nomenclature: str):
        return self.get(nomenclature=nomenclature)
    
    def get_categories(self):
        return self.all()
    
    def create_category(self, **kwargs):
        return self.create(**kwargs)
    
    def update_category(self, category_id: str, **kwargs):
        category = self.get_category(category_id)
        for key, value in kwargs.items():
            setattr(category, key, value)
        category.save()
        return category

    def delete_category(self, category_id: str):
        category = self.get_category(category_id)
        category.delete()
        return category