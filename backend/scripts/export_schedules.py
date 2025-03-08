import schedule
import time
from django import setup as django_setup
from pathlib import Path
import sys
from os import environ
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_setup()
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
from decisions.tasks import export_ca_decisions_daily_task


while True:
    export_ca_decisions_daily_task()
    time.sleep(3600 * 24)
