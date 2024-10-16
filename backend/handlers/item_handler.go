package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/services"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func generateUniqueID() string {
	return uuid.New().String()
}

func GetItemsByUserIDAndCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	log.Printf("GetItemsByUserIDAndCollectionName: Fetching items for user ID: %s, collection: %s", userID, collectionName)

	items, err := services.GetItemsByUserIDAndCollectionName(userID, collectionName)
	if err != nil {
		log.Printf("GetItemsByUserIDAndCollectionName: Error fetching items: %v", err)
		http.Error(w, "Error fetching items", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(items)
}

func UpdateItemQuantity(w http.ResponseWriter, r *http.Request) {
	log.Println("UpdateItemQuantity handler called")
	var requestBody struct {
		UserID         string `json:"user_id"`
		CollectionName string `json:"collection_name"`
		ItemID         string `json:"item_id"`
		Quantity       int    `json:"quantity"`
	}
	if err := json.NewDecoder(r.Body).Decode(&requestBody); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	updatedItem, err := services.UpdateItemQuantity(requestBody.UserID, requestBody.CollectionName, requestBody.ItemID, requestBody.Quantity)
	if err != nil {
		log.Printf("Error updating item quantity: %v", err)
		http.Error(w, "Error updating item quantity", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(updatedItem)
}

func AddItemWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	log.Printf("AddItemWithUserIDAndCollection: Received request to add item to collection: %s for user ID: %s", collectionName, userID)

	var itemData models.Item
	if err := json.NewDecoder(r.Body).Decode(&itemData); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Received item data: %+v", itemData)

	itemData.ID = generateUniqueID()

	err := services.AddItemToCollection(userID, collectionName, itemData)
	if err != nil {
		log.Printf("Error adding item to collection: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(itemData)
}

func RemoveItemFromCollectionWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	itemID := vars["item_id"]

	log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Received request to remove item with ID: %s from collection: %s for user ID: %s", itemID, collectionName, userID)

	err := services.RemoveItemFromCollection(userID, collectionName, itemID)
	if err != nil {
		log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Error removing item: %v", err)
		http.Error(w, "Error removing item from collection", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
