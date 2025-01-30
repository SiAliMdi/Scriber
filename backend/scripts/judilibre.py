from pathlib import Path
from os import environ
from os.path import join
import uuid
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
# from django.db.models import Count
import logging
from logging.handlers import TimedRotatingFileHandler

BASE_DIR = Path(__file__).resolve().parent.parent
sys.path.append(str(BASE_DIR))
environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()  

from decisions.models import RawDecisionsModel
from decisions.serializers import RawDecisionsSerializer
from cleaner_utils import clean_text
from django.conf import settings
from django.db.models import Count, Subquery, OuterRef
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
from more_itertools import chunked
from itertools import islice
import math

def connect_to_typesense(connection_timeout_seconds : int = 6000):
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

def setup_logger(logger_name: str = "ExportLogger"):
    logger = logging.getLogger(logger_name)
    logger.setLevel(logging.INFO)
    current_date = datetime.now()
    year = current_date.strftime('%Y')
    month = current_date.strftime('%m')
    day = current_date.strftime('%d')
    
    log_dir = join(settings.CELERY_ROOT_LOG_PATH, year, month)
    Path(log_dir).mkdir(parents=True, exist_ok=True)
    log_filename = join(log_dir, f"{day}.log")
    
    handler = TimedRotatingFileHandler(
        filename=log_filename,
        when="midnight",
        encoding="utf-8"
    )
    handler.suffix = "%Y-%m-%d"
    handler.level = logging.INFO
    
    formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s', datefmt='%Y-%m-%d %H:%M:%S')
    handler.setFormatter(formatter)
    handler.setLevel(logging.INFO)
    logger.addHandler(handler)
    return logger

def get_typesense_collection(client: typesense.Client):
    # delete data collection if it exists
    try:
        # client.collections[settings.TYPESENSE_COLLECTION_NAME].delete()
        data_collection = client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()
        print("collection found")
    except typesense.exceptions.ObjectNotFound:
        print("collection not found")
        data_collection = client.collections.create({
            "name": settings.TYPESENSE_COLLECTION_NAME,
            "fields": [
                {"name": "id", "type": "string", "facet": False, "index": True}, # id of document in database
                # {"name": "j_id", "type": "string", "index": False},
                {"name": "j_rg", "type": "string", "sort": True, "facet": True},
                {"name": "j_juridiction", "type": "string", "facet": True, "sort": True},
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
                "j_juridiction": decision.j_juridiction,
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
    return response.json()['access_token']

def get_query_response(access_token: str= None, judilibre_url: str= None, params: dict= {}):
    response = request("GET", judilibre_url, headers={
        "Authorization": f"Bearer {access_token}"
    }, params=params)
    return response.json()

def insert_decisions_batch(decisions_batch: dict, batch_size: int, typesense_client: typesense.Client, logger: logging.Logger, batch_num: int = 0):
    decisions = decisions_batch['results']
    # logger.info(f"Le batch {batch_num} contient : {decisions_batch['total']} décisions.")
    validated_decisions = []
    for decision in decisions:
        serializer = RawDecisionsSerializer(data=decision)
        if serializer.is_valid():
            validated_decisions.append(serializer.create(serializer.validated_data))
        else:
            logger.error(serializer.errors)
    
    validated_decisions = RawDecisionsModel.objects.bulk_create(validated_decisions, ignore_conflicts=True) # ignore_conflicts=True to avoid IntegrityError when trying to insert duplicate decisions (same j_id)
    
    """ typesense_decisions = []
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
    insert_decisions_batch_typesense(typesense_client, typesense_decisions, batch_size) """
       
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
        nonlocal logger
        
        decisions_batch = get_query_response(access_token, export_url, export_params)
        insert_decisions_batch(decisions_batch, batch_size, typesense_client, logger, export_params["batch"])
        
        logger.info(f"Le batch {export_params['batch']} de la période du {export_params['date_start']} au {export_params['date_end']}, contenant {decisions_batch['total']} décisions, a été traité.")
        # logger.info(f"Quantité de décisions dans la base : {RawDecisionsModel.objects.count()}, Quantité de décisions dans le batch: {decisions_batch['total']}")
        """ if decisions_batch.get("next_batch") is not None:
            logger.info(f"Le batch suivant : {decisions_batch['next_batch']}") """
        # logger.info(f"Quantité de décisions dans le moteur de recherche : {typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()['num_documents']}")

    def delete_unmatched_decisions():
        t1 = time()
        log_handler = next((h for h in logger.handlers if isinstance(h, logging.FileHandler)), None)
        log_file = log_handler.stream if log_handler else sys.stdout
        collection_name = settings.TYPESENSE_COLLECTION_NAME

        # Constants
        FILTER_BY_MAX_CHARS = 4000  # Typesense filter_by character limit
        DELETE_BATCH_SIZE = 1000     # Batch size for deletions
        INSERT_CHECK_BATCH = 1000   # Batch size for existence checks
        INSERT_BATCH_SIZE = 1000     # Batch size for document inserts
        MAX_THREADS = 20            # Max threads for parallel execution

        # Helper function to calculate safe batch size for filter_by
        def calculate_safe_batch_size(ids):
            """Calculate batch size that won't exceed filter_by character limit."""
            avg_id_length = sum(len(id) for id in ids) / len(ids)
            return math.floor(FILTER_BY_MAX_CHARS / (avg_id_length + 6))  # 6 accounts for "id: || "
        logger.info("Début de la synchronisation de la base de données avec Typesense...")
        # Step 1: Insert missing documents using paginated queryset and threading
        logger.info("1. Insertion des décisions non existantes dans Typesense...")
        
        # Get all PostgreSQL IDs using iterator
        qs = RawDecisionsModel.objects.all().only('id').iterator()
        ids_to_insert = []

        # Function to check existence of a batch of IDs in Typesense
        def check_existence_batch(batch):
            try:
                result = typesense_client.collections[collection_name].documents.search({
                    'q': '*',
                    'filter_by': f'id: {" || id: ".join(batch)}',
                    'per_page': len(batch)
                })
                existing_ids = {doc['document']['id'] for doc in result['hits']}
                return [id for id in batch if id not in existing_ids]
            except typesense.exceptions.RequestMalformed:
                # Fallback to individual checks if batch fails
                missing_ids = []
                for id in batch:
                    try:
                        typesense_client.collections[collection_name].documents[id].retrieve()
                    except typesense.exceptions.ObjectNotFound:
                        missing_ids.append(id)
                return missing_ids

        # Check existence in parallel using ThreadPoolExecutor
        total_docs = RawDecisionsModel.objects.count()
        milestones = {0, total_docs//4, total_docs//2, 3*total_docs//4, total_docs}
        current_milestone = 0
        processed = 0
        with tqdm(total=RawDecisionsModel.objects.count(), desc="Vérification des décisions de la base", file=log_file) as pbar:
            with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
                futures = []
                
                while True:
                    batch = list(islice(qs, INSERT_CHECK_BATCH))
                    if not batch:
                        break
                    
                    str_batch = [str(d.id) for d in batch]
                    safe_batch_size = calculate_safe_batch_size(str_batch)
                    
                    # Submit batches to thread pool
                    for chunk in chunked(str_batch, safe_batch_size):
                        futures.append(executor.submit(check_existence_batch, chunk))
                        
                    # Update progress tracking
                    processed += len(batch)
                
                    # Check if we passed a milestone
                    while milestones and processed >= current_milestone:
                        pbar.update(current_milestone - pbar.n)
                        current_milestone = min(milestones)
                        milestones.discard(current_milestone)
        
            # Collect results from futures
            for future in as_completed(futures):
                ids_to_insert.extend(future.result())
            
            # Ensure 100% is reached
            if pbar.n < total_docs:
                pbar.update(total_docs - pbar.n)

        # Function to prepare documents for insertion
        def prepare_documents(batch_ids):
            decisions = RawDecisionsModel.objects.filter(id__in=batch_ids)
            return [{
                "id": str(d.id),
                "j_rg": d.j_rg,
                "j_juridiction": d.j_juridiction,
                # "j_date": int(d.j_date.timestamp()) if d.j_date else 0,
                "j_date": int(datetime.combine(d.j_date, datetime.min.time()).timestamp()),
                "j_ville": d.j_ville,
                "j_chambre": d.j_chambre,
                "j_type": d.j_type,
                "j_texte": clean_text(d.texte_net)
            } for d in decisions]

        # Batch insert using ThreadPoolExecutor
        if ids_to_insert:
            logger.info(f"Insertion de {len(ids_to_insert)} non existantes dans Typesense")
            paginator = Paginator(ids_to_insert, INSERT_BATCH_SIZE)

            with tqdm(total=paginator.count, desc="Insertion des décisions", file=log_file) as pbar:
                with ThreadPoolExecutor(max_workers=MAX_THREADS) as executor:
                    futures = []
                    for page_num in paginator.page_range:
                        page = paginator.page(page_num)
                        batch_ids = page.object_list
                        
                        # Submit document preparation and insertion tasks
                        futures.append(executor.submit(prepare_documents, batch_ids))
                    
                    # Process completed futures
                    for future in as_completed(futures):
                        docs = future.result()
                        if docs:
                            typesense_client.collections[collection_name].documents.import_(docs)
                            pbar.update(len(docs))
        else:
            logger.info("Aucune décision à insérer dans Typesense")

        # Step 2: Delete documents existing in Typesense but not in PostgreSQL
        logger.info("2. Suppression des décisions duplicatas dans Typesense...")
        
        # Get Typesense IDs
        ts_docs = typesense_client.collections[collection_name].documents.export({'include_fields': 'id'})
        ts_ids = {loads(line)['id'] for line in ts_docs.strip().splitlines()}
        
        # Batch check existence in PostgreSQL
        ids_to_delete = []
        paginator = Paginator(sorted(ts_ids), DELETE_BATCH_SIZE)
        progress_log = paginator.count // 4
        with tqdm(total=paginator.count, desc="Vérification des décisions de Typesense", file=  log_file) as pbar:
            for i, page_num in enumerate(paginator.page_range):
                page = paginator.page(page_num)
                batch = list(page.object_list)
                
                exists_in_db = set(
                    str(id) for id in 
                    RawDecisionsModel.objects.filter(id__in=[uuid.UUID(id) for id in batch])
                    .values_list('id', flat=True)
                )
                
                ids_to_delete.extend([id for id in batch if id not in exists_in_db])
                if i % progress_log == 0:
                    pbar.update(len(batch))

        # Batch delete using efficient import API
        if ids_to_delete:
            logger.info(f"Suppression de {len(ids_to_delete)} décisions duplicatas dans Typesense")
            paginator = Paginator(ids_to_delete, DELETE_BATCH_SIZE)
            progress_log = paginator.count // 4
            with tqdm(total=paginator.count, desc="Suppression des décisions Typesense", file=log_file) as pbar:
                for i, page_num in enumerate(paginator.page_range):
                    page = paginator.page(page_num)
                    batch = list(page.object_list)
                    
                    # Use batch delete filter
                    typesense_client.collections[collection_name].documents.delete({
                        'filter_by': f'id: {" || id: ".join(batch)}'
                    })
                    if i % progress_log == 0:
                        pbar.update(len(batch))
        else:
            logger.info("Aucune décision à supprimer dans Typesense")

        # Final stats
        ts_count = typesense_client.collections[collection_name].retrieve()['num_documents']
        db_count = RawDecisionsModel.objects.count()
        logger.info(f"Sync terminée. Typesense : {ts_count} | PostgreSQL : {db_count}")
        logger.info(f"Typesense -> Supprimées : {len(ids_to_delete)} | Insérées : {len(ids_to_insert)}")
        net_time = f"{time() - t1:.2f}"
        # human readable time
        logger.info(f"Temps de netoyage : {net_time} seconds") if net_time < "60" else logger.info(f"Temps de netoyage : {net_time/60:.2f} minutes")

    # Initial setup
    t1 = time()
    logger = setup_logger()
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
    logger.info(f"Exportation des décisions de la période entre {str(start_date.date())} ===>> {str(end_date.date())} en cours...")
    count_decisions = RawDecisionsModel.objects.count()
    logger.info(f"Taille de la base de données avant l'exportation : {count_decisions}")
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
    insertions_count = RawDecisionsModel.objects.count() - count_decisions
    logger.info(f"Nombre d'inserions dans la base de données : {insertions_count}")
    logger.info("Suppression des décisions vides...")
    # delete empty decisions from the database
    RawDecisionsModel.objects.filter(texte_net="").delete()
    RawDecisionsModel.objects.filter(texte_net__isnull=True).delete()
    # logger.info("Suppression des décisions dupliquées...")
    # delete duplicated decisions from the database but keep the recent entry (newest created_at date) in each duplicate group
    # ids_to_keep = RawDecisionsModel.objects.filter(texte_net=OuterRef('texte_net')).order_by('-created_at').values('id')[:1]
    # Delete all duplicates except the one we're keeping
    """ RawDecisionsModel.objects.filter(
    texte_net__in=RawDecisionsModel.objects.values('texte_net')
        .annotate(count=Count('id'))
        .filter(count__gt=1)
        .values('texte_net')
        ).exclude(
            id__in=Subquery(ids_to_keep)
        ).delete() """
    exportation_time = f"{time() - t1:.2f}"
    # human readable time
    logger.info(f"Exportation des décisions terminée dans : {exportation_time} seconds") if exportation_time < "60" else logger.info(f"Exportation des décisions terminée dans : {exportation_time/60:.2f} minutes")
    logger.info(f"Nouvelle taille de la base de données : {RawDecisionsModel.objects.count()}")
    pbar.close()

    # Delete unmatched decisions
    delete_unmatched_decisions()

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
    # insert_decisions_typesense(typesense_client, batch_size= 10_000)
    typesense_client = connect_to_typesense()
    end_date = datetime.today().strftime('%Y-%m-%d')
    start_date = (datetime.today() - timedelta(weeks=10)).strftime('%Y-%m-%d')    
    start_date = datetime.strptime(start_date, '%Y-%m-%d')
    end_date = datetime.strptime(end_date, '%Y-%m-%d')
    print(f"Typesense data collection size {typesense_client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()['num_documents']}")
    export_ca_decisions(start_date, end_date)
    # count duplicate decisions by j_texte field in my collection
    # print(RawDecisionsModel.objects.values('id').annotate(count=Count('texte_net')).filter(count__gt=1))
    # loop over all decisions and search for un existing decisions in the database
    
if __name__ == "__main__":
    main_3()