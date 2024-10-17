package services

import (
	"database/sql"
	"fmt"

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

		cardsQuery := `
			SELECT i.item_id, i.name, i.edition, i.set, i.image, ui.grade, ui.price, ui.quantity
			FROM UserItems ui
			JOIN Items i ON ui.item_id = i.item_id
			WHERE ui.collection_id = $1
		`
		cardRows, err := database.DB.Query(cardsQuery, collection.CollectionID)
		if err != nil {
			return nil, err
		}
		defer cardRows.Close()

		collection.Cards = []models.Card{}
		for cardRows.Next() {
			var card models.Card
			var edition, set, image, grade sql.NullString
			var price sql.NullFloat64
			err := cardRows.Scan(&card.ID, &card.Name, &edition, &set, &image, &grade, &price, &card.Quantity)
			if err != nil {
				return nil, fmt.Errorf("error scanning card: %v", err)
			}
			card.Edition = edition.String
			card.Set = set.String
			card.Image = image.String
			if grade.Valid {
				card.Grade = grade.String
			} else {
				card.Grade = "Ungraded"
			}
			if price.Valid {
				card.Price = price.Float64
			}
			collection.Cards = append(collection.Cards, card)
		}

		collections = append(collections, collection)
	}

	return collections, nil
}
