package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/services"
	"github.com/gorilla/mux"
)

func GetCollectionsByUserID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	collections, err := services.GetCollectionsByUserID(userID)
	if err != nil {
		log.Printf("Error fetching collections: %v", err)
		http.Error(w, "Error fetching collections", http.StatusInternalServerError)
		return
	}

	// If no collections are found, return an empty array instead of null
	if collections == nil {
		collections = []models.Collection{}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(collections)
}

func CreateCollectionByUserIDandCollectionName(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]

	err := services.CreateCollection(userID, collectionName)
	if err != nil {
		http.Error(w, "Error creating collection", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	json.NewEncoder(w).Encode(map[string]bool{"success": true})
}

func DeleteCollectionByUserIDandCollectionName(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]

	err := services.DeleteCollection(userID, collectionName)
	if err != nil {
		http.Error(w, "Error deleting collection", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusOK)
}
