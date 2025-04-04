import os
import sys

# Get the project base directory (one level up from scripts folder)
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Set the Django settings module
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")

# Optionally, initialize Django
import django
django.setup()
from decisions.tasks import export_ca_decisions_daily_task

export_ca_decisions_daily_task()
print('Exported CA decisions')
