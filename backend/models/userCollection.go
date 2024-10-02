package models

import (
	"encoding/json"
	"io/ioutil"
)

type Card struct {
	Name     string  `json:"name"`
	Edition  string  `json:"edition"`
	Set      string  `json:"set"`
	Grade    string  `json:"grade"`
	Price    float64 `json:"price"`
	Image    string  `json:"image"`
	Quantity int     `json:"quantity"`
	ID       string  `json:"id"`
}

type UserCollection struct {
	UserID         string `json:"id"`
	CollectionName string `json:"collectionName"`
	Collection     []Card `json:"collection"`
}

func FetchCollectionsByUserID(userID string) ([]UserCollection, error) {
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		return nil, err
	}

	var data struct {
		User UserCollection `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		return nil, err
	}

	if data.User.UserID == userID {
		return []UserCollection{data.User}, nil
	}

	return nil, nil
}
