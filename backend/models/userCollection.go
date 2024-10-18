package models

import (
	"github.com/CatsMeow492/PokemonCollection/database"
)

type Collection struct {
	CollectionID   int    `json:"collection_id"`
	CollectionName string `json:"collection_name"`
	Cards          []Card `json:"cards"`
	Items          []Item `json:"items"`
}

func FetchCollectionsByUserID(userID string) ([]Collection, error) {
	collections := []Collection{}

	// Fetch collections for the user
	rows, err := database.DB.Query(`
		SELECT collection_id, collection_name 
		FROM Collections 
		WHERE user_id = $1`, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var collection Collection
		err := rows.Scan(&collection.CollectionID, &collection.CollectionName)
		if err != nil {
			return nil, err
		}

		// Fetch cards for each collection
		cardRows, err := database.DB.Query(`
			SELECT i.item_id, i.name, i.edition, i.set, i.image, ui.grade, ui.price, ui.quantity
			FROM UserItems ui
			JOIN Items i ON ui.item_id = i.item_id
			WHERE ui.collection_id = $1`, collection.CollectionID)
		if err != nil {
			return nil, err
		}
		defer cardRows.Close()

		for cardRows.Next() {
			var card Card
			err := cardRows.Scan(&card.ID, &card.Name, &card.Edition, &card.Set, &card.Image, &card.Grade, &card.PurchasePrice, &card.Quantity)
			if err != nil {
				return nil, err
			}
			collection.Cards = append(collection.Cards, card)
		}

		collections = append(collections, collection)
	}

	return collections, nil
}
