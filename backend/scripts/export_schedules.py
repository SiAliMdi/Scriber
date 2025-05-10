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
def task_1():
    # This function will be executed
    while True:
        # Get the current time in UTC
        datetime_now = datetime.now()
        
        if str(datetime_now.hour) == str(settings.JUDILIBRE_EXPORT_HOUR) \
            and str(datetime_now.minute) == str(settings.JUDILIBRE_EXPORT_MINUTE):
                
            print(f"Current time: {(datetime_now.hour)}:{datetime_now.minute}")
            # Call the task function
            export_ca_decisions_daily_task()
            print("Task executed.")

            # Sleep for 24 hours to avoid executing the task again until the next day
            sleep(24 * 60 * 60)
        else:
            # Sleep for 1 minute before checking again
            sleep(59)

def task_2():
    print("Exporting is running")
    export_ca_decisions_daily_task()
    print("Exporting is finished")

if __name__ == "__main__":
    task_2()
