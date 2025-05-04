import os
import sys

# Get the project base directory (one level up from scripts folder)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Set the Django settings module

# Optionally, initialize Django
import django
django.setup()
from django.conf import settings
from decisions.tasks import export_ca_decisions_daily_task
from datetime import datetime
from time import sleep

# execute the task every day at 14:20 pm

while True:
    # Get the current time in UTC
    datetime_now = datetime.now()
    print(f"Current time: {(datetime_now.hour)}:{datetime_now.minute}")
    print(f"Scheduled time: {(settings.JUDILIBRE_EXPORT_HOUR)}:{settings.JUDILIBRE_EXPORT_MINUTE}")
    
    # Check if the current time is 14:20 UTC
    if str(datetime_now.hour) == str(settings.JUDILIBRE_EXPORT_HOUR) \
        and str(datetime_now.minute) == str(settings.JUDILIBRE_EXPORT_MINUTE):
            
        # Call the task function
        print("Executing task...")
        export_ca_decisions_daily_task()
        print("Task executed.")

        # Sleep for 24 hours to avoid executing the task again until the next day
        sleep(24 * 60 * 60)
    else:
        # Sleep for 1 minute before checking again
        sleep(59)

