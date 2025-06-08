from requests import request
import typesense 
import os
import sys
from tqdm import tqdm
# Get the project base directory (one level up from scripts folder)
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "backend.settings")
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(BASE_DIR)

# Set the Django settings module

# Optionally, initialize Django
import django
django.setup()
from django.conf import settings
from decisions.models import RawDecisionsModel
from tiktoken import encoding_for_model, get_encoding

def authenticate_judilibre():
    oauth_url = "https://sandbox-oauth.piste.gouv.fr/api/oauth/token"
    client_id = "eb37bfe6-0925-4063-b695-089f90bb10a4"
    client_secret = "c7005707-8352-45d0-a3af-806f3ae0414a"
    scope = "openid"
   
    response = request("POST", oauth_url, data={
        "client_id": client_id,
        "client_secret": client_secret,
        "scope": scope,
        "grant_type": "client_credentials"
    })
    return response.json()['access_token']


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

def get_typesense_collection(client: typesense.Client):
    try:
        data_collection = client.collections[settings.TYPESENSE_COLLECTION_NAME].retrieve()
    except typesense.exceptions.ObjectNotFound:
        data_collection = client.collections.create({
            "name": settings.TYPESENSE_COLLECTION_NAME,
            "fields": [
                {"name": "id", "type": "string", "facet": False, "index": True},
                {"name": "j_rg", "type": "string", "sort": True, "facet": True},
                {"name": "j_juridiction", "type": "string", "facet": True, "sort": True},
                {"name": "j_date", "type": "int64", "facet": True, "sort": True},
                {"name": "j_ville", "type": "string", "facet": True, "sort": True},
                {"name": "j_chambre", "type": "string", "facet": True, "sort": True, "locale": "fr"},
                {"name": "j_type", "type": "string", "facet": True},
                {"name": "j_texte", "type": "string", "locale": "fr"},
            ],
            "default_sorting_field": "j_date"
        })
    return data_collection

def delete_collection(client):
    try:
        client.collections[settings.TYPESENSE_COLLECTION_NAME].delete()
        print("Collection deleted successfully.")
    except typesense.exceptions.ObjectNotFound:
        print("Collection not found, nothing to delete.")
        
def calculate_decisions_tokens():
    decisions = RawDecisionsModel.objects.all()
    print(f"Number of decisions: {len(decisions)}")
    tokens_counts = []
    # name = "llama-2-70b-chat-hf"
    for decision in tqdm(decisions):
        tokens = encoding_for_model("gpt-4o").encode(decision.texte_net)
        tokens_counts.append(len(tokens))        
    
    print(f"Tokens counts: {tokens_counts}")
    avg = sum(tokens_counts) / len(tokens_counts)
    print(f"Average tokens: {avg}")
    min_tokens = min(tokens_counts)
    max_tokens = max(tokens_counts)
    print(f"Max tokens: {max_tokens}")
    print(f"Min tokens: {min_tokens}")
    # count the min value of the tokens
    print(f"Min tokens: {tokens_counts.count(min_tokens)}")
    print(f"Max tokens: {tokens_counts.count(max_tokens)}")
    print(f"Avg tokens: {tokens_counts.count(avg)}")
    

def main():
    calculate_decisions_tokens()

if __name__ == "__main__":
    main()
    