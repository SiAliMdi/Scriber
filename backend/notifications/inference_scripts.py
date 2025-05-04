from json import dumps
from backend.settings import MISTRAL_API_URL, LLAMA_API_URL, MISTRAL_TAG, LLAMA_TAG, LLM_API_KEY
from openai import OpenAI
from tqdm import tqdm
from to_json_schema.to_json_schema import SchemaBuilder
from asgiref.sync import sync_to_async

default_json_object = {
  "métadonnées": {
    "date_décision": "YYYY-MM-DD",
    "id_décision": "XXXX/XXXXXX",
    "ville_décision": "VILLE",
    },
  "prétentions": [
    {
      "demande": "PRETENTION1",
      "montant": "QUANTITE_RECLAMEE" or None,
      "regle": "REGLE",
      "caract_demandeur": "CARACTERISTIQUES_GENERIQUES",
      "type_demandeur": "HOMME" or "FEMME" or "ENTREPRISE" or "ETAT",
      "caract_defendeur": "CARACTERISTIQUES_GENERIQUES",
      "type_défendeur": "HOMME" or "FEMME" or "ENTREPRISE" or "ETAT",
      "faits_details": "FAITS1",
      "moyens_demandeur": "INFOS",
      "moyens_defendeur": "INFOS",
      "motivation": "INFOS",
      "resultat": "ACCEPTEE" or "REJETEE" or None,
      "quantum": "QUANTITE_ATTRIBUEE" or None
    },
  ]
}

default_json_template= {
  "type": "object",
  "properties": {
    "métadonnées": {
      "type": "object",
      "properties": {
        "date_décision": {
          "type": "string",
          "format": "date"
        },
        "id_décision": {
          "type": "string",
          "pattern": "^\\d{2,4}[\\/\\\\-]\\d{4,6}$"
        },
        "ville_décision": {
          "type": "string"
        },
      },
      "required": ["date_décision", "id_décision", "ville_décision"]
    },
    "prétentions": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "demande": {
            "type": "string"
          },
          "montant": {
            "type": "string",
            "minLength": 0
          },
          "regle": {
            "type": "string",
            "minLength": 0
          },
          "caract_demandeur": {
            "type": "string"
          },
          "type_demandeur": {
            "type": "string",
            "enum": ["HOMME", "FEMME", "ENTREPRISE", "ETAT"]
          },
          "caract_defendeur": {
            "type": "string"
          },
          "type_défendeur": {
            "type": "string",
            "enum": ["HOMME", "FEMME", "ENTREPRISE", "ETAT"]
          },
          "faits_details": {
            "type": "string"
          },
          "moyens_demandeur": {
            "type": "string",
            "minLength": 0
          },
          "moyens_defendeur": {
            "type": "string",
            "minLength": 0
          },
          "motivation": {
            "type": "string"
          },
          "resultat": {
            "type": "string",
            "enum": ["ACCEPTEE", "REJETEE", ""]
          },
          "quantum": {
            "type": "string",
            "minLength": 0
          }
        },
        "required": [
          "demande",
          "montant",
          "regle",
          "caract_demandeur",
          "type_demandeur",
          "caract_defendeur",
          "type_défendeur",
          "faits_details",
          "moyens_demandeur",
          "moyens_defendeur",
          "motivation",
          "resultat",
          "quantum"
        ]
      }
    }
  },
  "required": ["métadonnées", "prétentions"]
}

default_user_prompt = {
    "role": "user",
    "content": f"""Objectives:
You must be exhaustive, detailed and precise.
You must give as much precise information as possible about the factual events that gave rise to the legal case.
You must list each of the parties' claims separately (like in the provided example).
You must give precise answers to the questions asked, using the text of the input decision.
You must extract the following information from the input decision: the Metadata and the list of the parties' Claims.
Do not add any comments. Use the following JSON template:  {default_json_object}
You must respect the JSON template and this JSON schema {default_json_template}.
Following is the legal decision text: """
    }

chat_template = "{%- if messages[0]['role'] == 'system' %}\n    {%- set system_message = messages[0]['content'] %}\n    {%- set loop_messages = messages[1:] %}\n{%- else %}\n    {%- set loop_messages = messages %}\n{%- endif %}\n\n{{- bos_token }}\n{%- for message in loop_messages %}\n    {%- if (message['role'] == 'user') != (loop.index0 % 2 == 0) %}\n        {{- raise_exception('After the optional system message, conversation roles must alternate user/assistant/user/assistant/...') }}\n    {%- endif %}\n    {%- if message['role'] == 'user' %}\n        {%- if loop.first and system_message is defined %}\n            {{- ' [INST] ' + system_message + '\\n\\n' + message['content'] + ' [/INST]' }}\n        {%- else %}\n            {{- ' [INST] ' + message['content'] + ' [/INST]' }}\n        {%- endif %}\n    {%- elif message['role'] == 'assistant' %}\n        {{- ' ' + message['content'] + eos_token}}\n    {%- else %}\n        {{- raise_exception('Only user and assistant roles are supported, with the exception of an initial optional system message!') }}\n    {%- endif %}\n{%- endfor %}\n"

init_prompt = [
    {
    "role": "system", 
    "content": """You are a profesionnal french legal decisions annotator. 
    You can produce only json annotations.
    Your JSON annotations must be valid and all values must be extracted from the provided decision text only."""
    },
    {
    "role": "user",
    "content": ""
    }
    ]

default_text_prompt = """Objectives:
You must be exhaustive, detailed and precise.
You must give as much precise information as possible about the factual events that gave rise to the legal case.
You must list each of the parties' claims separately (like in the provided example).
You must give precise answers to the questions asked, using the text of the input decision.
You must extract the following information from the input decision: the Metadata and the list of the parties' Claims.
Do not add any comments."""

decision_context_prompt = "\nFollowing is the legal decision text: \n"
json_schema_prompt = "\nYou must respect the JSON template and this JSON schema \n"
json_template_prompt = "\nUse the following JSON template: : \n"

@sync_to_async(thread_sensitive=False)
def mistral_inference(decision_texts, prompt_text=None, json_template=None):
    
    model= MISTRAL_TAG

    client = OpenAI(base_url=MISTRAL_API_URL, api_key= LLM_API_KEY)
    valid = False
    max_tries = 3
    tries = 0
    pbar = tqdm(total= len(decision_texts), desc="Processing decisions", unit="decision")
    responses = []
    
    for decision_text in decision_texts:
        pbar.update(1)
        
        prompt = init_prompt
        if prompt_text is None:
            prompt_text = default_text_prompt
        
        if json_template is None:
            json_template = default_json_object
            json_schema = default_json_template
        else:
          try:
            schema_builder = SchemaBuilder()
            json_schema    = schema_builder.to_json_schema(json_template)
          except Exception as e:
            print(f"Error: {e}")
            json_template = ""
            json_schema = ""
            
        prompt[1]["content"] = prompt_text  \
                        + json_template_prompt  \
                        + str(json_template) + json_schema_prompt  \
                        + str(json_schema) + decision_context_prompt + decision_text
        valid = False
        tries = 0
        while not valid and tries < max_tries:
            tries += 1
            try:
                response = client.chat.completions.create(
                    model=model,
                    messages= prompt,
                    max_tokens=8000,
                    temperature=.2,
                    extra_body={
                        "chat_template": chat_template,
                    },
                )
                response = response.choices[0].message.content.replace("```json", "")[:-3].strip()
                valid = True
                responses.append(response)
            except Exception as e:
                print(f"Error: {e}")

    pbar.close()
    print(f"Responses: {responses}")
    return responses

@sync_to_async(thread_sensitive=False)
def llama_inference(decision_texts, prompt_text=None, json_template=None):
    
    model= LLAMA_TAG

    client = OpenAI(base_url=LLAMA_API_URL, api_key= LLM_API_KEY)
    valid = False
    max_tries = 3
    tries = 0
    pbar = tqdm(total= len(decision_texts), desc="Processing decisions", unit="decision")
    responses = []
    
    for decision_text in decision_texts:
        pbar.update(1)
        
        prompt = init_prompt
        if prompt_text is None:
            prompt_text = default_text_prompt
        
        if json_template is None:
            json_template = default_json_object
            json_schema = default_json_template
        else:
          try:
            schema_builder = SchemaBuilder()
            json_schema    = schema_builder.to_json_schema(json_template)
          except Exception as e:
            print(f"Error: {e}")
            json_template = ""
            json_schema = ""
        prompt[1]["content"] = prompt_text  \
                        + json_template_prompt  \
                        + str(json_template) + json_schema_prompt  \
                        + str(json_schema) + decision_context_prompt + decision_text
        valid = False
        tries = 0
        while not valid and tries < max_tries:
            tries += 1
            try:
                response = client.chat.completions.create(
                model=model,
                messages=prompt,
                max_tokens=8000,
                temperature=.3,
                extra_body={
                    "guided_json": dumps(json_template),
                    "chat_template": chat_template,
                },
                )
                response = response.choices[0].message.content
                valid = True
                responses.append(response)
            except Exception as e:
                print(f"Error: {e}")

    pbar.close()
    print(f"Responses: {responses}")
    return responses


