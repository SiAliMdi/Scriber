from pathlib import Path
from os import getenv
from os.path import join
from dotenv import load_dotenv
import typesense
    
def create_collection():
    BASE_DIR = Path(__file__).resolve().parent.parent.parent

    load_dotenv(join(str(BASE_DIR),"local.env"))
    print(BASE_DIR)
    TYPESENSE_HOST = getenv('TYPESENSE_HOST')
    TYPESENSE_PORT = getenv('TYPESENSE_PORT')
    TYPESENSE_API_KEY = getenv('TYPESENSE_API_KEY')
    print(TYPESENSE_HOST, TYPESENSE_PORT, TYPESENSE_API_KEY)
    client = typesense.Client({
        'nodes': [{
            'host': TYPESENSE_HOST,
            'port': TYPESENSE_PORT,
            'protocol': 'http',
        }],
        'api_key': TYPESENSE_API_KEY,
        'connection_timeout_seconds': 2
    })
    print("client", client)
    try:
        client.collections['decisions'].delete()
    except Exception as e:
        print(e)

    # Create a collection
    print("creating collection")
    create_response = client.collections.create({
        "name": "decisions",
        "fields": [
            {"name": "rg", "type": "string"},
            {"name": "date", "type": "string"},
            {"name": "ville", "type": "string"},
            {"name": "chambre", "type": "string"},
            {"name": "texte", "type": "string"},
        ],
        "default_sorting_field": "date"
    })

    print(create_response)

    # Retrieve the collection we just created
    print("retrieving collection")
    retrieve_response = client.collections['decisions'].retrieve()
    print(retrieve_response)

    # Try retrieving all collections
    retrieve_all_response = client.collections.retrieve()
    print(retrieve_all_response)

if __name__ == "__main__":
    create_collection()