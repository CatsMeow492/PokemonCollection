package handlers

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"os"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/services"
	"github.com/gorilla/mux"
)

func GetCardsByUserIDAndCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {

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
			cards = append(cards, collection.Collection...)
			break
		}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cards)
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

func GetCollectionByUserIDandCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
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

	for _, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(collection)
			return
		}
	}

	http.Error(w, "Collection not found", http.StatusNotFound)
}

func GetAllCardsByUserID(w http.ResponseWriter, r *http.Request, userID string) {
	log.Printf("GetAllCardsByUserID: Fetching all cards for user ID: %s", userID)

	// Read collection.json
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Printf("GetAllCardsByUserID: Error reading collection.json: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	var data struct {
		User models.User `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		log.Printf("GetAllCardsByUserID: Error unmarshalling collection.json: %v", err)
		http.Error(w, "Error processing collection data", http.StatusInternalServerError)
		return
	}

	if data.User.ID != userID {
		log.Printf("GetAllCardsByUserID: User not found, ID: %s", userID)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	var cards []models.Card
	for _, collection := range data.User.Collections {
		for _, card := range collection.Collection {
			// Directly append the card from collection.json
			cards = append(cards, card)
		}
	}

	w.Header().Set("Content-Type", "application/json")
	if err := json.NewEncoder(w).Encode(cards); err != nil {
		log.Printf("GetAllCardsByUserID: Error encoding response: %v", err)
		http.Error(w, "Error encoding response", http.StatusInternalServerError)
	}
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}

func AddCardWithUserID(w http.ResponseWriter, r *http.Request) {
	log.Println("AddCardWithUserID: Starting function")
	var newCard struct {
		UserID string      `json:"user_id"`
		Card   models.Card `json:"card"`
	}
	if err := json.NewDecoder(r.Body).Decode(&newCard); err != nil {
		log.Printf("AddCardWithUserID: Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("AddCardWithUserID: Received request for user ID: %s", newCard.UserID)

	// Fetch the card from the API to ensure we have the correct ID
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")
	fetchedCard, err := services.FetchCard(apiKey, newCard.Card.Name) // Use the card name to fetch
	if err != nil {
		log.Printf("AddCardWithUserID: Error fetching card from API: %v", err)
		http.Error(w, "Error fetching card details", http.StatusInternalServerError)
		return
	}

	// Update the card with fetched data, preserving user-provided information
	newCard.Card.ID = fetchedCard.ID
	newCard.Card.Image = fetchedCard.Image
	// Add any other fields you want to update from the API response

	data, err := readCollectionFile()
	if err != nil {
		log.Printf("AddCardWithUserID: Error reading collection file: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	if data.User.ID != newCard.UserID {
		log.Printf("AddCardWithUserID: User not found, ID: %s", newCard.UserID)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	// Add to the first collection or create a new one if none exists
	if len(data.User.Collections) == 0 {
		log.Println("AddCardWithUserID: Creating new default collection for user")
		data.User.Collections = append(data.User.Collections, models.Collection{
			CollectionName: "Default",
			Collection:     []models.Card{newCard.Card},
		})
	} else {
		log.Println("AddCardWithUserID: Adding card to existing default collection")
		data.User.Collections[0].Collection = append(data.User.Collections[0].Collection, newCard.Card)
	}

	if err := writeCollectionFile(data); err != nil {
		log.Printf("AddCardWithUserID: Error writing to collection file: %v", err)
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
		return
	}

	log.Println("AddCardWithUserID: Successfully added card")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(newCard.Card)
}

func AddCardWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	log.Println("AddCardWithUserIDAndCollection: Starting function")
	var newCard struct {
		UserID         string      `json:"user_id"`
		CollectionName string      `json:"collection_name"`
		Card           models.Card `json:"card"`
	}
	if err := json.NewDecoder(r.Body).Decode(&newCard); err != nil {
		log.Printf("AddCardWithUserIDAndCollection: Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("AddCardWithUserIDAndCollection: Received request for user ID: %s, collection: %s", newCard.UserID, newCard.CollectionName)

	// Fetch the card from the API
	apiKey := os.Getenv("POKEMON_TCG_API_KEY")
	if apiKey == "" {
		log.Println("AddCardWithUserIDAndCollection: API key not found in environment variables")
		http.Error(w, "Server configuration error", http.StatusInternalServerError)
		return
	}

	log.Printf("AddCardWithUserIDAndCollection: Attempting to fetch card: Set=%s, Name=%s", newCard.Card.Set, newCard.Card.Name)
	fetchedCard, err := services.FetchCard(apiKey, fmt.Sprintf("%s-%s", newCard.Card.Set, newCard.Card.Name))
	if err != nil {
		log.Printf("AddCardWithUserIDAndCollection: Error fetching card from API: %v", err)
		http.Error(w, "Error fetching card details", http.StatusInternalServerError)
		return
	}

	// Merge fetched card data with user-provided data
	mergedCard := models.Card{
		ID:       fetchedCard.ID,
		Name:     fetchedCard.Name,
		Edition:  fetchedCard.Edition,
		Set:      fetchedCard.Set,
		Image:    fetchedCard.Image,
		Grade:    newCard.Card.Grade,
		Price:    newCard.Card.Price,
		Quantity: newCard.Card.Quantity,
	}

	log.Printf("AddCardWithUserIDAndCollection: Merged card data: %+v", mergedCard)

	data, err := readCollectionFile()
	if err != nil {
		log.Printf("AddCardWithUserIDAndCollection: Error reading collection file: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	if data.User.ID != newCard.UserID {
		log.Printf("AddCardWithUserIDAndCollection: User not found, ID: %s", newCard.UserID)
		http.Error(w, "User not found", http.StatusNotFound)
		return
	}

	collectionFound := false
	for i, collection := range data.User.Collections {
		if collection.CollectionName == newCard.CollectionName {
			collectionFound = true
			data.User.Collections[i].Collection = append(data.User.Collections[i].Collection, mergedCard)
			log.Printf("AddCardWithUserIDAndCollection: Added card to existing collection: %s", newCard.CollectionName)
			break
		}
	}

	if !collectionFound {
		newCollection := models.Collection{
			CollectionName: newCard.CollectionName,
			Collection:     []models.Card{mergedCard},
		}
		data.User.Collections = append(data.User.Collections, newCollection)
		log.Printf("AddCardWithUserIDAndCollection: Created new collection: %s", newCard.CollectionName)
	}

	if err := writeCollectionFile(data); err != nil {
		log.Printf("AddCardWithUserIDAndCollection: Error writing to collection file: %v", err)
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
		return
	}

	log.Printf("AddCardWithUserIDAndCollection: Successfully added card with ID: %s to collection: %s", mergedCard.ID, newCard.CollectionName)
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(mergedCard)
}

func RemoveCardFromCollectionWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	cardID := vars["card_id"]

	log.Println("removeCardFromCollectionWithUserIDAndCollection: Starting function")
	log.Printf("removeCardFromCollectionWithUserIDAndCollection: Received request to remove card with ID: %s from collection: %s for user ID: %s", cardID, collectionName, userID)

	data, err := readCollectionFile()
	if err != nil {
		log.Printf("removeCardFromCollectionWithUserIDAndCollection: Error reading collection file: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	collectionFound := false
	for i, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			for j, card := range collection.Collection {
				if card.ID == cardID {
					data.User.Collections[i].Collection = append(data.User.Collections[i].Collection[:j], data.User.Collections[i].Collection[j+1:]...)
					collectionFound = true
					log.Printf("removeCardFromCollectionWithUserIDAndCollection: Successfully removed card with ID: %s from collection: %s", cardID, collectionName)
					break
				}
			}
			if collectionFound {
				break
			}
		}
	}

	if !collectionFound {
		log.Printf("removeCardFromCollectionWithUserIDAndCollection: Collection not found: %s", collectionName)
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	if err := writeCollectionFile(data); err != nil {
		log.Printf("removeCardFromCollectionWithUserIDAndCollection: Error writing to collection file: %v", err)
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
		return
	}

	log.Println("removeCardFromCollectionWithUserIDAndCollection: Successfully removed card from collection")
	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

// Helper functions to read and write collection file
func readCollectionFile() (struct {
	User models.User `json:"user"`
}, error) {
	log.Println("readCollectionFile: Starting to read collection file")
	var data struct {
		User models.User `json:"user"`
	}
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		log.Printf("readCollectionFile: Error reading file: %v", err)
		return data, err
	}
	err = json.Unmarshal(file, &data)
	if err != nil {
		log.Printf("readCollectionFile: Error unmarshalling data: %v", err)
	} else {
		log.Printf("readCollectionFile: Successfully read data for user ID: %s", data.User.ID)
	}
	return data, err
}

func writeCollectionFile(data struct {
	User models.User `json:"user"`
}) error {
	log.Println("writeCollectionFile: Starting to write collection file")
	updatedData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("writeCollectionFile: Error marshalling data: %v", err)
		return err
	}
	err = ioutil.WriteFile("collection.json", updatedData, 0644)
	if err != nil {
		log.Printf("writeCollectionFile: Error writing file: %v", err)
	} else {
		log.Println("writeCollectionFile: Successfully wrote data to file")
	}
	return err
}
