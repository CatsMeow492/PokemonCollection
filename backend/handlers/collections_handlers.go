package handlers

import (
	"encoding/json"
	"io/ioutil"
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/gorilla/mux"
)

func readCollections() (*models.User, error) {
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		return nil, err
	}

	var data struct {
		User models.User `json:"user"`
	}
	err = json.Unmarshal(file, &data)
	if err != nil {
		return nil, err
	}

	return &data.User, nil
}

func writeCollections(user *models.User) error {
	data := struct {
		User *models.User `json:"user"`
	}{
		User: user,
	}
	file, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return err
	}

	return ioutil.WriteFile("collection.json", file, 0644)
}

func CreateCollectionByUserIDandCollectionName(w http.ResponseWriter, r *http.Request) {
	log.Println("CreateCollectionByUserIDandCollectionName: Handler called")
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	log.Printf("CreateCollectionByUserIDandCollectionName: Attempting to create collection '%s' for user ID '%s'", collectionName, userID)

	user, err := readCollections()
	if err != nil {
		log.Printf("CreateCollectionByUserIDandCollectionName: Error reading collections: %v", err)
		http.Error(w, "Error reading collections", http.StatusInternalServerError)
		return
	}

	if user.ID == userID {
		newCollection := models.Collection{CollectionName: collectionName}
		user.Collections = append(user.Collections, newCollection)
		if err := writeCollections(user); err != nil {
			log.Printf("CreateCollectionByUserIDandCollectionName: Error writing collections: %v", err)
			http.Error(w, "Error writing collections", http.StatusInternalServerError)
			return
		}
		log.Printf("CreateCollectionByUserIDandCollectionName: Successfully created collection '%s' for user ID '%s'", collectionName, userID)
		w.WriteHeader(http.StatusCreated)
		json.NewEncoder(w).Encode(newCollection)
		return
	}

	log.Printf("CreateCollectionByUserIDandCollectionName: User not found for ID '%s'", userID)
	http.Error(w, "User not found", http.StatusNotFound)
}

func DeleteCollectionByUserIDandCollectionName(w http.ResponseWriter, r *http.Request) {
	log.Println("DeleteCollectionByUserIDandCollectionName: Handler called")
	vars := mux.Vars(r)
	userID := vars["user_id"]
	collectionName := vars["collection_name"]
	log.Printf("DeleteCollectionByUserIDandCollectionName: Attempting to delete collection '%s' for user ID '%s'", collectionName, userID)

	user, err := readCollections()
	if err != nil {
		log.Printf("DeleteCollectionByUserIDandCollectionName: Error reading collections: %v", err)
		http.Error(w, "Error reading collections", http.StatusInternalServerError)
		return
	}

	if user.ID == userID {
		for i, collection := range user.Collections {
			if collection.CollectionName == collectionName {
				user.Collections = append(user.Collections[:i], user.Collections[i+1:]...)
				if err := writeCollections(user); err != nil {
					log.Printf("DeleteCollectionByUserIDandCollectionName: Error writing collections: %v", err)
					http.Error(w, "Error writing collections", http.StatusInternalServerError)
					return
				}
				log.Printf("DeleteCollectionByUserIDandCollectionName: Successfully deleted collection '%s' for user ID '%s'", collectionName, userID)
				w.WriteHeader(http.StatusNoContent)
				return
			}
		}
		log.Printf("DeleteCollectionByUserIDandCollectionName: Collection '%s' not found for user ID '%s'", collectionName, userID)
		http.Error(w, "Collection not found", http.StatusNotFound)
		return
	}

	log.Printf("DeleteCollectionByUserIDandCollectionName: User not found for ID '%s'", userID)
	http.Error(w, "User not found", http.StatusNotFound)
}
