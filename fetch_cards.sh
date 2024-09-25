#!/bin/bash

API_KEY="7170968d-1f17-489b-86ad-32db4c8e6ffd"
BASE_URL="https://api.pokemontcg.io/v2/cards"
NAMES=("Haunter" "Mew" "Articuno" "Moltres" "Jolteon" "Kangaskhan" "Clefable" "Flareon" "Mr. Mime" "Vaporeon" "Lily Pad Mew" "Gengar")

for NAME in "${NAMES[@]}"; do
    ENCODED_NAME=$(echo $NAME | sed 's/ /%20/g')
    curl -H "X-Api-Key: $API_KEY" "$BASE_URL?q=name:$ENCODED_NAME"
done