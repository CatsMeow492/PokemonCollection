package handlers

import (
    "encoding/json"
    "io/ioutil"
    "log"
    "net/http"
    "os"

    "github.com/CatsMeow492/PokemonCollection/models"
    "github.com/CatsMeow492/PokemonCollection/services"
)

func GetCards(w http.ResponseWriter, r *http.Request) {
    apiKey := os.Getenv("POKEMON_TCG_API_KEY")

    // Read collection.json
    file, err := ioutil.ReadFile("collection.json")
    if err != nil {
        log.Fatalf("Error reading collection.json: %v", err)
    }

    var collection []models.Card
    if err := json.Unmarshal(file, &collection); err != nil {
        log.Fatalf("Error unmarshalling collection.json: %v", err)
    }

    cards := []models.Card{}
    for _, card := range collection {
        fetchedCard, err := services.FetchCard(apiKey, card.Name, card.Set)
        if err != nil {
            log.Printf("Error fetching card %s: %v", card.Name, err)
            continue
        }
        // Update fetched card with grade and price from collection.json
        fetchedCard.Grade = card.Grade
        fetchedCard.Price = card.Price
        cards = append(cards, *fetchedCard)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(cards)
}
