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
	"github.com/gorilla/mux"
)

func GetCardsByUserIDAndCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		http.Error(w, "Error reading collection.json", http.StatusInternalServerError)
		return
	}

	var data struct {
		User models.User `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		http.Error(w, "Error unmarshalling collection.json", http.StatusInternalServerError)
		return
	}

	var cards []models.Card
	for _, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			for _, card := range collection.Collection {
				fetchedCard, err := services.FetchCard(apiKey, card.ID)
				if err != nil {
					log.Printf("Error fetching card %s: %v", card.ID, err)
					continue
				}
				// Update fetched card with grade and price from collection.json
				fetchedCard.Grade = card.Grade
				fetchedCard.Price = card.Price
				fetchedCard.Quantity = card.Quantity
				fetchedCard.ID = card.ID
				cards = append(cards, *fetchedCard)
			}
			break
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

func AddCard(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Invalid request method", http.StatusMethodNotAllowed)
		return
	}

	var newCard struct {
		UserID         string      `json:"user_id"`
		CollectionName string      `json:"collection_name"`
		Card           models.Card `json:"card"`
	}
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

	var data struct {
		User models.User `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		http.Error(w, "Error unmarshalling collection file", http.StatusInternalServerError)
		return
	}

	// Find the collection and add the new card
	for i, collection := range data.User.Collections {
		if collection.CollectionName == newCard.CollectionName {
			data.User.Collections[i].Collection = append(data.User.Collections[i].Collection, newCard.Card)
			break
		}
	}

	// Write updated collection back to collection.json
	updatedData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		http.Error(w, "Error marshalling updated collection", http.StatusInternalServerError)
		return
	}

	if err := ioutil.WriteFile(collectionFilePath, updatedData, 0644); err != nil {
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(newCard.Card)
}

func UpdateCardQuantity(w http.ResponseWriter, r *http.Request) {
	cardID := r.URL.Query().Get("id")
	if cardID == "" {
		http.Error(w, "Missing card ID", http.StatusBadRequest)
		return
	}

	var requestBody struct {
		UserID         string `json:"user_id"`
		CollectionName string `json:"collection_name"`
		Quantity       int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Fatalf("Error reading collection.json: %v", err)
	}

	var data struct {
		User models.User `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		log.Fatalf("Error unmarshalling collection.json: %v", err)
	}

	var updatedCard *models.Card
	for i, collection := range data.User.Collections {
		if collection.CollectionName == requestBody.CollectionName {
			for j, card := range collection.Collection {
				if card.ID == cardID {
					data.User.Collections[i].Collection[j].Quantity = requestBody.Quantity
					updatedCard = &data.User.Collections[i].Collection[j]
					break
				}
			}
		}
	}

	if updatedCard == nil {
		http.Error(w, "Card not found", http.StatusNotFound)
		return
	}

	// Check if the image is available in the cache
	if updatedCard.Image == "" {
		// Fetch the image using card_service
		fetchedCard, err := services.FetchCard(os.Getenv("POKEMON_TCG_API_KEY"), updatedCard.ID)
		if err != nil {
			log.Printf("Error fetching card %s: %v", updatedCard.ID, err)
			http.Error(w, "Error fetching card image", http.StatusInternalServerError)
			return
		}
		updatedCard.Image = fetchedCard.Image
	}

	// Write updated collection back to file
	updatedFile, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Fatalf("Error marshalling updated collection: %v", err)
	}
	if err := ioutil.WriteFile("collection.json", updatedFile, 0644); err != nil {
		log.Fatalf("Error writing updated collection to file: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedCard)
}

func GetCollectionsByUserID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	collections, err := models.FetchCollectionsByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching collections", http.StatusInternalServerError)
		return
	}

	if collections == nil {
		http.Error(w, "No collections found for user", http.StatusNotFound)
		return
	}

	// Prepare response with collection name, collection ID, and all cards
	response := []map[string]interface{}{}
	for _, collection := range collections {
		response = append(response, map[string]interface{}{
			"collectionName": collection.CollectionName,
			"cards":          collection.Collection,
		})
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(response)
}

func GetAllCardsByUserID(w http.ResponseWriter, r *http.Request, userID string) {
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Fatalf("Error reading collection.json: %v", err)
	}

	var data struct {
		User models.User `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		log.Fatalf("Error unmarshalling collection.json: %v", err)
	}

	cards := []models.Card{}
	if data.User.ID == userID {
		for _, collection := range data.User.Collections {
			for _, card := range collection.Collection {
				fetchedCard, err := services.FetchCard(apiKey, card.ID)
				if err != nil {
					log.Printf("Error fetching card %s: %v", card.ID, err)
					continue
				}
				// Update fetched card with grade and price from collection.json
				fetchedCard.Grade = card.Grade
				fetchedCard.Price = card.Price
				fetchedCard.Quantity = card.Quantity
				fetchedCard.ID = card.ID
				cards = append(cards, *fetchedCard)
			}
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
