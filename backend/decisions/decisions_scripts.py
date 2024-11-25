import sys
from pathlib import Path
from datetime import datetime, timedelta
from os import environ
from django import setup as django_setup
BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django_setup()
from scripts.judilibre import export_ca_decisions, connect_to_typesense, insert_decisions_typesense
from django.conf import settings

def export_ca_decisions_daily_task():
    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(weeks=5)).strftime('%Y-%m-%d')
    print(f"{start_date = } - {end_date = }")
    # convert start_date and end_date to  datetime objects
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')
    export_ca_decisions(start_date, end_date)

def main():
    # export_ca_decisions_daily_task()
    batch_size = 1000
    typesense_client = connect_to_typesense()
    insert_decisions_typesense(typesense_client, batch_size)
    print(f"Typesense data collection size {typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()['num_documents']}")
    # drop all collections
    """ for collection in typesense_client.collections.retrieve():
        typesense_client.collections[collection['name']].delete() """
    """ for collection in typesense_client.collections.retrieve():
        print(collection['name']) """
    
if __name__ == '__main__':
    main()