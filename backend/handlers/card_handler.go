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

// Update the function signature to accept userID and collectionName
func GetCardsByUserIDAndCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Fatalf("Error reading collection.json: %v", err)
	}

	var userCollection models.UserCollection
	if err := json.Unmarshal(file, &userCollection); err != nil {
		log.Fatalf("Error unmarshalling collection.json: %v", err)
	}

	cards := []models.Card{}
	for _, card := range userCollection.Cards { // Changed Collection to Cards
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

	var userCollection models.UserCollection
	if err := json.Unmarshal(file, &userCollection); err != nil {
		http.Error(w, "Error unmarshalling collection file", http.StatusInternalServerError)
		return
	}

	// Add the new card to the collection
	userCollection.Cards = append(userCollection.Cards, newCard)

	// Write updated collection back to collection.json
	updatedData, err := json.MarshalIndent(userCollection, "", "  ")
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

func UpdateCardQuantity(w http.ResponseWriter, r *http.Request) {
	cardID := r.URL.Query().Get("id")
	if cardID == "" {
		http.Error(w, "Missing card ID", http.StatusBadRequest)
		return
	}

	var requestBody struct {
		Quantity int `json:"quantity"`
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

	var userCollection models.UserCollection
	if err := json.Unmarshal(file, &userCollection); err != nil {
		log.Fatalf("Error unmarshalling collection.json: %v", err)
	}

	var updatedCard *models.Card
	for i, card := range userCollection.Cards { // Changed Collection to Cards
		if card.ID == cardID {
			userCollection.Cards[i].Quantity = requestBody.Quantity
			updatedCard = &userCollection.Cards[i]
			break
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
	updatedFile, err := json.MarshalIndent(userCollection, "", "  ")
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
	userID := r.URL.Query().Get("user_id")
	if userID == "" {
		http.Error(w, "User ID is required", http.StatusBadRequest)
		return
	}

	collections, err := models.FetchCollectionsByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching collections", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collections)
}

// GetCardsByCollection fetches cards based on userID and collectionName
func GetCardsByCollection(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Fatalf("Error reading collection.json: %v", err)
	}

	var userCollection models.UserCollection
	if err := json.Unmarshal(file, &userCollection); err != nil {
		log.Fatalf("Error unmarshalling collection.json: %v", err)
	}

	cards := []models.Card{}
	for _, card := range userCollection.Cards {
		if card.UserID == userID && contains(card.CollectionNames, collectionName) {
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

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

// GetAllCards fetches all cards
func GetAllCardsByUserID(w http.ResponseWriter, r *http.Request, userID string) {
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Fatalf("Error reading collection.json: %v", err)
	}

	var data struct {
		User struct {
			ID         string        `json:"id"`
			Collection []models.Card `json:"collection"`
		} `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		log.Fatalf("Error unmarshalling collection.json: %v", err)
	}

	log.Printf("User ID: %s", userID)
	log.Printf("User Collection: %+v", data.User.Collection)

	cards := []models.Card{}
	if data.User.ID == userID {
		for _, card := range data.User.Collection {
			log.Printf("Processing card: %+v", card)
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

	log.Printf("Fetched Cards: %+v", cards)

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
