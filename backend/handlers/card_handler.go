package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/services"
)

func GetCardsByUserIDAndCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	log.Printf("GetCardsByUserIDAndCollectionName handler called with userID: %s, collectionName: %s", userID, collectionName)

	cards, err := services.GetCardsByUserIDAndCollectionName(userID, collectionName)
	if err != nil {
		log.Printf("Error fetching cards: %v", err)
		http.Error(w, "Error fetching cards", http.StatusInternalServerError)
		return
	}

	log.Printf("Retrieved %d cards", len(cards))
	for _, card := range cards {
		log.Printf("Card to be sent to client: ID=%s, Name=%s, Price=%.2f", card.ID, card.Name, card.PurchasePrice)
	}

	w.Header().Set("Content-Type", "application/json")
	err = json.NewEncoder(w).Encode(cards)
	if err != nil {
		log.Printf("Error encoding cards to JSON: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
		return
	}
	log.Println("Successfully sent cards to client")
}

func UpdateCardQuantity(w http.ResponseWriter, r *http.Request) {
	var requestBody struct {
		UserID         string `json:"user_id"`
		CollectionName string `json:"collection_name"`
		CardID         string `json:"card_id"`
		Quantity       int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Received request to update card quantity: %+v", requestBody)

	updatedCard, err := services.UpdateCardQuantity(requestBody.UserID, requestBody.CollectionName, requestBody.CardID, requestBody.Quantity)
	if err != nil {
		log.Printf("Error updating card quantity: %v", err)
		http.Error(w, fmt.Sprintf("Error updating card quantity: %v", err), http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedCard)
}

func GetCollectionByUserIDandCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	collection, err := services.GetCollectionByUserIDandCollectionName(userID, collectionName)
	if err != nil {
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collection)
}

func GetAllCardsByUserID(w http.ResponseWriter, r *http.Request, userID string) {
	cards, err := services.GetAllCardsByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching cards", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
}

func AddCardWithUserID(w http.ResponseWriter, r *http.Request) {
	var newCard struct {
		UserID string      `json:"user_id"`
		Card   models.Card `json:"card"`
	}
	if err := json.NewDecoder(r.Body).Decode(&newCard); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	// Fetch the card from the API to ensure we have the correct ID
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")
	fetchedCard, err := services.FetchCardFromAPI(apiKey, newCard.Card.Name)
	if err != nil {
		http.Error(w, "Error fetching card details", http.StatusInternalServerError)
		return
	}

	// Update the card with fetched data, preserving user-provided information
	newCard.Card.ID = fetchedCard.ID
	newCard.Card.Image = fetchedCard.Image
	// Add any other fields you want to update from the API response

	err = services.AddCardToCollection(newCard.UserID, "Default", newCard.Card)
	if err != nil {
		http.Error(w, "Error adding card to collection", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(newCard.Card)
}

func AddCardWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	var newCard struct {
		UserID         string      `json:"user_id"`
		CollectionName string      `json:"collection_name"`
		Card           models.Card `json:"card"`
	}

	body, err := ioutil.ReadAll(r.Body)
	if err != nil {
		log.Printf("Error reading request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Raw request body: %s", string(body))

	if err := json.Unmarshal(body, &newCard); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	log.Printf("Decoded request: %+v", newCard)
	log.Printf("Card grade: %v (type: %T)", newCard.Card.Grade, newCard.Card.Grade)

	// Fetch the card from the API
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")
	fetchedCard, err := services.FetchCardFromAPI(apiKey, fmt.Sprintf("%s-%s", newCard.Card.Set, newCard.Card.Name))
	if err != nil {
		log.Printf("Error fetching card details: %v", err)
		http.Error(w, fmt.Sprintf("Error fetching card details: %v", err), http.StatusInternalServerError)
		return
	}

	// Merge fetched card data with user-provided data
	mergedCard := models.Card{
		ID:            fetchedCard.ID,
		Name:          fetchedCard.Name,
		Edition:       fetchedCard.Edition,
		Set:           fetchedCard.Set,
		Image:         fetchedCard.Image,
		Grade:         newCard.Card.Grade,
		PurchasePrice: newCard.Card.PurchasePrice,
		Quantity:      newCard.Card.Quantity,
		Type:          "Pokemon Card", // Add this line
	}

	// After fetching the card from the API
	if fetchedCard.ID == "" {
		fetchedCard.ID = fmt.Sprintf("%s-%s", fetchedCard.Set, fetchedCard.Name)
	}

	mergedCard.ID = fetchedCard.ID

	err = services.AddCardToCollection(newCard.UserID, newCard.CollectionName, mergedCard)
	if err != nil {
		log.Printf("Error adding card to collection: %v", err)
		http.Error(w, fmt.Sprintf("Error adding card to collection: %v", err), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(mergedCard)
}

func RemoveCardFromCollectionWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	cardID := vars["card_id"]

	log.Printf("RemoveCardFromCollectionWithUserIDAndCollection: Received request to remove card with ID: %s from collection: %s for user ID: %s", cardID, collectionName, userID)

	err := services.RemoveCardFromCollection(userID, collectionName, cardID)
	if err != nil {
		log.Printf("RemoveCardFromCollectionWithUserIDAndCollection: Error removing card: %v", err)
		http.Error(w, "Error removing card from collection", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
