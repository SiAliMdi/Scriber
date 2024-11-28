from pathlib import Path
from os import environ
from os.path import join
import typesense
from requests import request
from json import dump, loads
from tqdm import tqdm
import django
import sys
from pandas import date_range
from time import time
from django.core.paginator import Paginator
from typing import List

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()  

from decisions.models import RawDecisionsModel
from decisions.serializers import RawDecisionsSerializer
from .cleaner_utils import clean_text
from django.conf import settings

from datetime import datetime, timedelta


def connect_to_typesense(connection_timeout_seconds : int = 600):
    client = typesense.Client({
        'nodes': [{
            'host': settings.TYPESENSE_HOST,
            'port': settings.TYPESENSE_PORT,
            'protocol': 'http',
        }],
        'api_key': settings.TYPESENSE_API_KEY,
        'connection_timeout_seconds': connection_timeout_seconds # we need to increase the timeout because insertion of large data takes time
    })
    return client

def get_typesense_collection(client: typesense.Client):
    # delete data collection if it exists
    # client.collections[settings.TYPESENSE_COLLECTION_NAME].delete()
    try:
        data_collection = client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()
        print("collection found")
    except typesense.exceptions.ObjectNotFound:
        print("collection not found")
        data_collection = client.collections.create({
            "name": settings.TYPESENSE_COLLECTION_NAME,
            "fields": [
                {"name": "id", "type": "string", "facet": False, "index": True}, # id of document in database
                # {"name": "j_id", "type": "string", "index": False},
                {"name": "j_rg", "type": "string", "sort": True},
                {"name": "j_date", "type": "int64", "facet": True, "sort": True}, # as advised by https://threads.typesense.org/2J32f38 , the only way to store dates for now
                {"name": "j_ville", "type": "string", "facet": True, "sort": True},
                {"name": "j_chambre", "type": "string", "facet": True, "sort": True, "locale": "fr"},
                {"name": "j_type", "type": "string", "facet": True},
                {"name": "j_texte", "type": "string", "locale": "fr"}, # could add also "stem" field for stemming values before indexing
            ],
            "default_sorting_field": "j_date"
        })
    return data_collection

def insert_decisions_batch_typesense(client, decisions_batch, batch_size: int):
    client.collections[settings.TYPESENSE_COLLECTION_NAME].documents.import_(decisions_batch, {'action': 'create'}, {'batch_size': batch_size})

def insert_decisions_typesense(typesense_client, batch_size: int= 100):
    raw_decisions = RawDecisionsModel.objects.all()
    paginator = Paginator(raw_decisions, batch_size)
    collection = get_typesense_collection(client=typesense_client)
    
    for page_num in tqdm(paginator.page_range):
        raw_decisions = paginator.get_page(page_num)
        decisions_batch = []
        
        for decision in raw_decisions:
            decisions_batch.append({
                "id": str(decision.id),
                "j_rg": decision.j_rg,
                "j_date": int(datetime.combine(decision.j_date, datetime.min.time()).timestamp()),
                "j_ville": decision.j_ville,
                "j_chambre": decision.j_chambre,
                "j_type": decision.j_type,
                "j_texte": clean_text(decision.texte_net)
            })
        insert_decisions_batch_typesense(typesense_client, decisions_batch, batch_size)

def query_typesense_data_collection(client, query: str, query_by: str | List[str] , filter_by: str= "", sort_by: str= "j_date:desc", page: int = 1, per_page: int= 10):
    search_parameters = {
        'q': query,
        'query_by': 'j_texte',
        'filter_by': filter_by,
        'sort_by': sort_by,
        'page': page,
        'per_page': per_page,
        'num_typos': 2,  
        'prioritize_exact_match': True,
    }
    search_results = client.collections[settings.TYPESENSE_COLLECTION_NAME].documents.search(search_parameters)
    return search_results

def authenticate_judilibre():  
    oauth_url = settings.JUDILIBRE_OAUTH_URL
    client_id = settings.JUDILIBRE_CLIENT_ID
    client_secret = settings.JUDILIBRE_CLIENT_SECRET
    scope = settings.JUDILIBRE_SCOPE
   
    response = request("POST", oauth_url, data={
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": scope,
        "grant_type": "client_credentials"
    })
    print(response.status_code, "response from judilibre oauth")
    return response.json()['access_token']

def get_query_response(access_token: str= None, judilibre_url: str= None, params: dict= {}):
    response = request("GET", judilibre_url, headers={
        "Authorization": f"Bearer {access_token}"
    }, params=params)
    return response.json()

def insert_decisions_batch(decisions_batch: dict, batch_size: int, typesense_client: typesense.Client):
    decisions = decisions_batch['results']
    validated_decisions = []
    for decision in decisions:
        serializer = RawDecisionsSerializer(data=decision)
        if serializer.is_valid():
            validated_decisions.append(serializer.create(serializer.validated_data))
        else:
            print(serializer.errors)
    
    validated_decisions = RawDecisionsModel.objects.bulk_create(validated_decisions, ignore_conflicts=True) # ignore_conflicts=True to avoid IntegrityError when trying to insert duplicate decisions (same j_id)
    
    typesense_decisions = []
    for decision in validated_decisions:
        decision_date = datetime.strptime(decision.j_date, '%Y-%m-%d')
        typesense_decisions.append({
            "id": str(decision.id),
            "j_rg": decision.j_rg,
            "j_date": int(datetime.combine(decision_date, datetime.min.time()).timestamp()),
            "j_ville": decision.j_ville,
            "j_chambre": decision.j_chambre,
            "j_type": decision.j_type,
            "j_texte": clean_text(decision.texte_net)
        })
    insert_decisions_batch_typesense(typesense_client, typesense_decisions, batch_size)

def export_ca_decisions(start_date: datetime= None, end_date: datetime= None):
    def refresh_token_if_needed():
        nonlocal access_token, start_token_time
        if time() - start_token_time >= time_limit:
            access_token = authenticate_judilibre()
            start_token_time = time()

    def update_export_dates():
        nonlocal current_date
        export_params["date_start"] = current_date.strftime('%Y-%m-%d')
        current_date += timedelta(weeks=1)
        export_params["date_end"] = current_date.strftime('%Y-%m-%d')

    def process_batch():
        nonlocal decisions_batch
        nonlocal typesense_client
        nonlocal batch_size
        
        decisions_batch = get_query_response(access_token, export_url, export_params)
        insert_decisions_batch(decisions_batch, batch_size, typesense_client)
        print(f"Processed batch {export_params['batch']} from {export_params['date_start']} to {export_params['date_end']}")
        print(f"RawDecisions size: {RawDecisionsModel.objects.count()}, total results: {decisions_batch['total']}")
        print(f"Next batch: {decisions_batch['next_batch']}")
        print(f"Typesense data collection size {typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()['num_documents']}")

    # Initial setup
    access_token = authenticate_judilibre()
    export_url = settings.JUDILIBRE_URL + "export"
    current_date = start_date
    decisions_batch = None
    batch_size = 1000
    time_limit = 60 * 60 - 60  # Token refresh time limit (1 hour minus a minute buffer)
    start_token_time = time()
    typesense_client = connect_to_typesense()
    
    # Initialize export parameters
    export_params = {
        "jurisdiction": ["ca"],
        "type": ["arret", "ordonnance", "other"],
        "batch_size": batch_size,
        "batch": 0
    }

    # Calculate progress bar length
    num_weeks = date_range(start=start_date, end=end_date, freq='W').shape[0]
    pbar = tqdm(total=num_weeks + 1)

    # Weekly export loop
    while current_date <= end_date:
        update_export_dates()
        process_batch()
        pbar.update(1)

        # Process additional batches within the same week if needed
        while decisions_batch.get("next_batch") is not None:
            refresh_token_if_needed()
            export_params["batch"] += 1
            process_batch()

        # Reset batch number for the next week
        export_params["batch"] = 0
        refresh_token_if_needed()

    print("All batches completed.")
    pbar.close()

def get_values_from_taxonomy(query: str, context_value: str= 'ca'):
    access_token = authenticate_judilibre()
    taxonomy_url = settings.JUDILIBRE_URL + "/taxonomy"
    taxonomy_params = {
        "id": query,
        "context_value": context_value
    }
    taxonomy_reposonse = get_query_response(access_token, taxonomy_url, taxonomy_params)
    print(taxonomy_reposonse)
    
def search_decision_judilibre(access_token: str, j_id : str):
    judilibre_url = settings.JUDILIBRE_URL + "decision"
    params = {
        "id": j_id,
    }
    response = get_query_response(access_token, judilibre_url, params)
    print(response)

def main():
    start_date = datetime(1998, 1, 1)
    end_date = datetime(2024, 11, 8)
    export_ca_decisions(start_date, end_date)
    # get_values_from_taxonomy("type")

# compare typesense search results with raw decisions model filter results
def main_2():
    t1 = time()
    typesense_client = connect_to_typesense()
    """ batch_size = 1000
    insert_decisions_typesense(typesense_client, batch_size) """
    
    # query_filter = "j_type:arret"
    query = 'article 700'
    query_by = "j_texte"
    query_filter = ""
    sort_by = "j_date:desc"
    page_size = 10
    search_results = query_typesense_data_collection(typesense_client, 
                                                     query = query,
                                                     query_by = query_by,
                                                     filter_by = query_filter,
                                                     sort_by = sort_by, 
                                                     page = 1,
                                                     per_page = page_size, 
                                                    )
    print(search_results['found'])
    raw_collection_decisions = typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].documents.export( {'include_fields' : 'id'} )
    raw_ids = []
    for decision in raw_collection_decisions.strip().splitlines():
        raw_ids.append(loads(decision)['id'])
    raw_decisions = RawDecisionsModel.objects.all()
    
    paginator = Paginator(raw_decisions, 1000)
    first_page = paginator.page(1).object_list
    filtered_count = sum(1 for obj in first_page if obj.texte_net and "article 700" in obj.texte_net.lower() )
    ids = [str(obj.id) for obj in first_page]
    print(f"Filtered decisions count: {filtered_count}")
    print(f"Total decisions count: {len(ids)} { len(raw_ids)}")
    print(f"Intersection count: {len(set(ids).intersection(set(raw_ids)))}")
    print("Sets equal: ", set(ids) == set(raw_ids))
    print(f"Total time: {time() - t1}")

# insert decisions into typesense
def main_3():
    typesense_client = connect_to_typesense()
    print(f"Typesense data collection size {typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()['num_documents']}")
    batch_size = 1000
    insert_decisions_typesense(typesense_client, batch_size)
    print(f"Typesense data collection size {typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()['num_documents']}")
    
if __name__ == "__main__":
    main_3()