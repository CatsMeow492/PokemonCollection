package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/services"
	"github.com/gorilla/mux"
)

func GetCollectionsByUserID(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	collections, err := services.GetCollectionsByUserID(userID)
	if err != nil {
		http.Error(w, "Error fetching collections", http.StatusInternalServerError)
		return
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
