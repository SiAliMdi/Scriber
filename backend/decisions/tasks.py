from celery import shared_task
import sys
from pathlib import Path
from datetime import datetime, timedelta
from os import environ
from django import setup as django_setup
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_setup()
from scripts.judilibre import export_ca_decisions

@shared_task
def export_ca_decisions_daily_task():
    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(weeks=5)).strftime('%Y-%m-%d')    
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')
    export_ca_decisions(start_date, end_date)

