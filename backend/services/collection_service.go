package services

import (
	"github.com/CatsMeow492/PokemonCollection/database"
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
