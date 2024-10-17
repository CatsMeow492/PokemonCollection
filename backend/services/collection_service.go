package services

import (
	"database/sql"
	"fmt"
	"log"

	"github.com/CatsMeow492/PokemonCollection/database"
	"github.com/CatsMeow492/PokemonCollection/models"
)

func CreateCollection(userID string, collectionName string) error {
	_, err := database.DB.Exec(`
		INSERT INTO Collections (user_id, collection_name)
		VALUES ($1, $2)
		ON CONFLICT (user_id, collection_name) DO NOTHING
	`, userID, collectionName)
	return err
}

func DeleteCollection(userID string, collectionName string) error {
	_, err := database.DB.Exec(`
		DELETE FROM Collections
		WHERE user_id = $1 AND collection_name = $2
	`, userID, collectionName)
	return err
}

func GetCollectionsByUserID(userID string) ([]models.Collection, error) {
	collections := []models.Collection{}

	query := `
		SELECT c.collection_id, c.collection_name
		FROM Collections c
		WHERE c.user_id = $1
	`
	rows, err := database.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var collection models.Collection
		err := rows.Scan(&collection.CollectionID, &collection.CollectionName)
		if err != nil {
			return nil, err
		}

		itemsQuery := `
			SELECT i.item_id, i.name, i.edition, i.set, i.image, i.grade, i.price, ui.quantity, i.type
			FROM UserItems ui
			JOIN Items i ON ui.item_id = i.item_id
			WHERE ui.collection_id = $1
		`
		itemRows, err := database.DB.Query(itemsQuery, collection.CollectionID)
		if err != nil {
			return nil, err
		}
		defer itemRows.Close()

		collection.Cards = []models.Card{}
		collection.Items = []models.Item{}
		for itemRows.Next() {
			var id, itemType sql.NullString
			var name, edition, set, image, grade sql.NullString
			var price sql.NullFloat64
			var quantity int

			err := itemRows.Scan(&id, &name, &edition, &set, &image, &grade, &price, &quantity, &itemType)
			if err != nil {
				return nil, fmt.Errorf("error scanning item: %v", err)
			}

			item := models.Item{
				ID:       id.String,
				Name:     name.String,
				Edition:  edition.String,
				Set:      set.String,
				Image:    image.String,
				Grade:    grade.String,
				Price:    price.Float64,
				Quantity: quantity,
				Type:     itemType.String,
			}

			log.Printf("Retrieved item: ID=%s, Name=%s, Price=%.2f", item.ID, item.Name, item.Price)

			if item.Type == "Pokemon Card" {
				card := models.Card(item) // Convert Item to Card
				collection.Cards = append(collection.Cards, card)
			} else {
				collection.Items = append(collection.Items, item)
			}
		}

		collections = append(collections, collection)
	}

	return collections, nil
}
