### fetch all pokemon

import requests

def fetch_all_pokemon():
    url = "https://pokeapi.co/api/v2/pokemon?limit=1025"
    response = requests.get(url)
    if response.status_code == 200:
        return response.json()
    ## write to /backend/pokemon.json
    with open("/backend/pokemon.json", "w") as f:
        json.dump(response.json(), f)
    return None

if __name__ == "__main__":
    pokemon_data = fetch_all_pokemon()
    if pokemon_data:
        print(pokemon_data)
    else:
        print("Failed to fetch pokemon data")
        
    
