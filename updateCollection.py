import requests
import json
import os

API_KEY = ''
COLLECTION_PATH = os.path.join('backend', 'collection.json')

def fetch_card_id(name, set_id):
    url = f"https://api.pokemontcg.io/v2/cards?q=name:{name} set.id:{set_id}"
    headers = {
        'X-Api-Key': API_KEY
    }
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        data = response.json()
        if data['data']:
            return data['data'][0]['id']
    return None

def update_collection():
    with open(COLLECTION_PATH, 'r') as file:
        collection = json.load(file)

    for card in collection:
        if 'id' not in card or not card['id']:
            card_id = fetch_card_id(card['name'], card['set'])
            if card_id:
                card['id'] = card_id
                print(f"Updated {card['name']} with ID: {card_id}")
            else:
                print(f"No ID found for {card['name']}")

    with open(COLLECTION_PATH, 'w') as file:
        json.dump(collection, file, indent=2)
    print('Collection updated successfully.')

if __name__ == "__main__":
    update_collection()