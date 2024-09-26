package handlers

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"path/filepath"

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
		fetchedCard.Quantity = card.Quantity
		cards = append(cards, *fetchedCard)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

func AddCard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var newCard models.Card
	if err := json.NewDecoder(r.Body).Decode(&newCard); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Read existing cards from collection.json
	collectionFilePath := filepath.Join("collection.json")
	file, err := ioutil.ReadFile(collectionFilePath)
	if err != nil {
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	var cards []models.Card
	if err := json.Unmarshal(file, &cards); err != nil {
		http.Error(w, "Error unmarshalling collection file", http.StatusInternalServerError)
		return
	}

	// Add the new card to the collection
	cards = append(cards, newCard)

	// Write updated collection back to collection.json
	updatedData, err := json.MarshalIndent(cards, "", "  ")
	if err != nil {
		http.Error(w, "Error marshalling updated collection", http.StatusInternalServerError)
		return
	}

	if err := ioutil.WriteFile(collectionFilePath, updatedData, 0644); err != nil {
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(newCard)
}
