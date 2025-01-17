from __future__ import absolute_import, unicode_literals
from os import environ
from celery import Celery
from celery.schedules import  crontab
from django import setup as django_setup
from pathlib import Path
import sys
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_setup()
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')

from decisions.tasks import export_ca_decisions_daily_task

def create_app():
    # celery -A backend.celery_app  worker -B -l info > celery_output.log 2> celery.log
    app = Celery('backend')
    app.config_from_object('django.conf:settings', namespace='CELERY')
    app.conf.beat_schedule = {
        'export-ca-decisions-daily-task': {
            'task': 'decisions.tasks.export_ca_decisions_daily_task',
            'schedule': crontab(hour=3, minute=15),
            # 'args': (),
        },
        'delete-unmatched-decisions-task': {
            'task': 'decisions.tasks.delete_unmatched_decisions_task',
            'schedule': crontab(hour=3, minute=45),
        },
    }
    app.autodiscover_tasks()
    return app

# start the app with: celery -A backend.celery_app worker -B -l DEBUG 1> celery_output.log 2>&1
app = create_app()

