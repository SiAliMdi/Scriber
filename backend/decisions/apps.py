from django.apps import AppConfig
from datetime import datetime
from pathlib import Path
from os.path import join
from django.conf import settings 

class DecisionsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "decisions"
    label = "decisions"

    def ready(self):
        current_date = datetime.now()
        month = current_date.strftime("%m")
        year = current_date.strftime("%Y")
        
        log_dir = join(settings.DJANGO_ROOT_LOG_PATH, year, month)
        Path(log_dir).mkdir(parents=True, exist_ok=True)