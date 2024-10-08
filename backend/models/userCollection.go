package models

import (
	"encoding/json"
	"io/ioutil"
)

type CollectionData struct {
	User User `json:"user"`
}

type Card struct {
	Name     string      `json:"name"`
	Edition  string      `json:"edition"`
	Set      string      `json:"set"`
	Grade    interface{} `json:"grade"`
	Price    interface{} `json:"price"`
	Image    string      `json:"image"`
	Quantity int         `json:"quantity"`
	ID       string      `json:"id"`
}

type Collection struct {
	CollectionName string `json:"collectionName"`
	Collection     []Card `json:"collection"`
	Items          []Item `json:"items"`
}

func FetchCollectionsByUserID(userID string) ([]Collection, error) {
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		return nil, err
	}

	var data CollectionData
	if err := json.Unmarshal(file, &data); err != nil {
		return nil, err
	}

	if data.User.ID == userID {
		return data.User.Collections, nil
	}

	return nil, nil
}
