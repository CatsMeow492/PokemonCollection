package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/services"
	"github.com/CatsMeow492/PokemonCollection/utils"
	"github.com/google/uuid"
	"github.com/gorilla/mux"
)

func generateUniqueID() string {
	return uuid.New().String()
}

func GetItemsByUserIDAndCollectionName(w http.ResponseWriter, r *http.Request, userID string, collectionName string) {
	log.Printf("GetItemsByUserIDAndCollectionName: Fetching items for user ID: %s, collection: %s", userID, collectionName)

	data, err := utils.ReadCollectionFile()
	if err != nil {
		log.Printf("GetItemsByUserIDAndCollectionName: Error reading collection file: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	var items []models.Item
	for _, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			items = append(items, collection.Items...)
			break
		}
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

	data, err := utils.ReadCollectionFile()
	if err != nil {
		log.Printf("Error reading collection file: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	var updatedItem *models.Item
	for i, collection := range data.User.Collections {
		if collection.CollectionName == requestBody.CollectionName {
			for j, item := range collection.Items {
				if item.ID == requestBody.ItemID {
					data.User.Collections[i].Items[j].Quantity = requestBody.Quantity
					updatedItem = &data.User.Collections[i].Items[j]
					break
				}
			}
		}
		if updatedItem != nil {
			break
		}
	}

	if updatedItem == nil {
		log.Printf("Item not found: UserID=%s, CollectionName=%s, ItemID=%s",
			requestBody.UserID, requestBody.CollectionName, requestBody.ItemID)
		http.Error(w, "Item not found", http.StatusNotFound)
		return
	}

	if err := utils.WriteCollectionFile(data); err != nil {
		log.Printf("Error writing to collection file: %v", err)
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
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

	var itemData struct {
		Name    string  `json:"name"`
		Grade   string  `json:"grade"` // Changed from string to int
		Edition string  `json:"edition"`
		Price   float64 `json:"price"`
	}

	if err := json.NewDecoder(r.Body).Decode(&itemData); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	log.Printf("Received item data: %+v", itemData)

	item := models.Item{
		ID:       generateUniqueID(),
		Name:     itemData.Name,
		Edition:  itemData.Edition,
		Grade:    itemData.Grade, // Convert int to string
		Price:    itemData.Price,
		Quantity: 1,
	}

	log.Printf("Created item to be added: %+v", item)

	err := services.AddItemToCollection(userID, collectionName, item)
	if err != nil {
		log.Printf("Error adding item to collection: %v", err)
		http.Error(w, err.Error(), http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(item)
}

func RemoveItemFromCollectionWithUserIDAndCollection(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	itemID := vars["item_id"]

	log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Received request to remove item with ID: %s from collection: %s for user ID: %s", itemID, collectionName, userID)

	data, err := utils.ReadCollectionFile()
	if err != nil {
		log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Error reading collection file: %v", err)
		http.Error(w, "Error reading collection file", http.StatusInternalServerError)
		return
	}

	itemRemoved := false
	for i, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			for j, item := range collection.Items {
				if item.ID == itemID {
					data.User.Collections[i].Items = append(data.User.Collections[i].Items[:j], data.User.Collections[i].Items[j+1:]...)
					itemRemoved = true
					log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Successfully removed item with ID: %s from collection: %s", itemID, collectionName)
					break
				}
			}
			if itemRemoved {
				break
			}
		}
	}

	if !itemRemoved {
		log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Item not found in collection: %s", collectionName)
		http.Error(w, "Item not found in collection", http.StatusNotFound)
		return
	}

	if err := utils.WriteCollectionFile(data); err != nil {
		log.Printf("RemoveItemFromCollectionWithUserIDAndCollection: Error writing to collection file: %v", err)
		http.Error(w, "Error writing to collection file", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}
