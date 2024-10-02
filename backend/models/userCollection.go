package models

import (
	"encoding/json"
	"io/ioutil"
)

type Card struct {
	Name            string   `json:"name"`
	Edition         string   `json:"edition"`
	Set             string   `json:"set"`
	Grade           string   `json:"grade"`
	Price           float64  `json:"price"`
	Image           string   `json:"image"`
	Quantity        int      `json:"quantity"`
	ID              string   `json:"id"`
	UserID          string   `json:"user_id"`
	CollectionNames []string `json:"collection_names,omitempty"` // Use omitempty to allow for no collections
}

type UserCollection struct {
	UserID string `json:"user_id"`
	Cards  []Card `json:"cards"`
}

// FetchCollectionsByUserID fetches collections for a given user ID
func FetchCollectionsByUserID(userID string) ([]UserCollection, error) {
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		return nil, err
	}

	var collections []UserCollection
	if err := json.Unmarshal(file, &collections); err != nil {
		return nil, err
	}

	var userCollections []UserCollection
	for _, collection := range collections {
		if collection.UserID == userID {
			userCollections = append(userCollections, collection)
		}
	}

	return userCollections, nil
}
