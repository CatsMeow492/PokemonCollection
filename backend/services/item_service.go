package services

import (
	"log"

	"github.com/CatsMeow492/PokemonCollection/database"
	"github.com/CatsMeow492/PokemonCollection/models"
)

func GetItemsByUserIDAndCollectionName(userID string, collectionName string) ([]models.Item, error) {
	query := `
		SELECT i.item_id, i.name, i.edition, i.grade, ui.purchase_price, ui.quantity
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1 AND c.collection_name = $2
	`
	rows, err := database.DB.Query(query, userID, collectionName)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var items []models.Item
	for rows.Next() {
		var item models.Item
		err := rows.Scan(&item.ID, &item.Name, &item.Edition, &item.Grade, &item.PurchasePrice, &item.Quantity)
		if err != nil {
			return nil, err
		}
		items = append(items, item)
	}
	return items, nil
}

func UpdateItemQuantity(userID string, collectionName string, itemID string, quantity int) (*models.Item, error) {
	tx, err := database.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	_, err = tx.Exec(`
		UPDATE UserItems
		SET quantity = $1
		WHERE collection_id = (SELECT collection_id FROM Collections WHERE user_id = $2 AND collection_name = $3)
		AND item_id = $4
	`, quantity, userID, collectionName, itemID)
	if err != nil {
		return nil, err
	}

	var item models.Item
	err = tx.QueryRow(`
		SELECT i.item_id, i.name, i.edition, i.grade, ui.purchase_price, ui.quantity
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1 AND c.collection_name = $2 AND i.item_id = $3
	`, userID, collectionName, itemID).Scan(&item.ID, &item.Name, &item.Edition, &item.Grade, &item.PurchasePrice, &item.Quantity)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

	return &item, nil
}

func AddItemToCollection(userID string, collectionName string, item models.Item) error {
	log.Printf("Adding item to collection: %+v", item)

	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	var collectionID int
	err = tx.QueryRow(`
		INSERT INTO Collections (user_id, collection_name)
		VALUES ($1, $2)
		ON CONFLICT (user_id, collection_name) DO UPDATE SET collection_name = EXCLUDED.collection_name
		RETURNING collection_id
	`, userID, collectionName).Scan(&collectionID)
	if err != nil {
		return err
	}

	// Ensure item.Type is set correctly before inserting
	if item.Type == "" {
		item.Type = "Item" // Default to "Item" if not specified
	}

	_, err = tx.Exec(`
		INSERT INTO Items (item_id, name, edition, set, image, grade, type)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (item_id) DO UPDATE SET
			name = EXCLUDED.name,
			edition = EXCLUDED.edition,
			set = EXCLUDED.set,
			image = EXCLUDED.image,
			grade = EXCLUDED.grade,
			type = EXCLUDED.type
	`, item.ID, item.Name, item.Edition, item.Set, item.Image, item.Grade, item.Type)
	if err != nil {
		return err
	}

	// Log the inserted/updated item
	log.Printf("Item inserted/updated: ID=%s, Name=%s, PurchasePrice=%.2f", item.ID, item.Name, item.PurchasePrice)

	_, err = tx.Exec(`
		INSERT INTO UserItems (collection_id, item_id, quantity, purchase_price)
		VALUES ($1, $2, $3, $4)
		ON CONFLICT (collection_id, item_id) DO UPDATE SET
			quantity = UserItems.quantity + EXCLUDED.quantity,
			purchase_price = EXCLUDED.purchase_price
	`, collectionID, item.ID, item.Quantity, item.PurchasePrice)
	if err != nil {
		return err
	}

	log.Printf("Item inserted/updated: ID=%s, Name=%s, PurchasePrice=%.2f", item.ID, item.Name, item.PurchasePrice)

	return tx.Commit()
}

func RemoveItemFromCollection(userID string, collectionName string, itemID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM UserItems
		WHERE collection_id = (SELECT collection_id FROM Collections WHERE user_id = $1 AND collection_name = $2)
		AND item_id = $3
	`, userID, collectionName, itemID)
	return err
}

// ... (update other functions similarly)
