package services

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"log"
	"net/http"
	"strings"
	"time"

	"net/url"

	"github.com/CatsMeow492/PokemonCollection/database"
	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/patrickmn/go-cache"
	"gorm.io/gorm"
)

var cardCache *cache.Cache
var imageCache *cache.Cache

func init() {
	cardCache = cache.New(24*time.Hour, 48*time.Hour)  // Cache for 1 day, purge expired items every 2 days
	imageCache = cache.New(24*time.Hour, 48*time.Hour) // Cache for 1 day, purge expired items every 2 days
}

func FetchCard(apiKey, cardIdentifier string) (*models.Card, error) {
	log.Printf("FetchCard: Attempting to fetch card with identifier: %s", cardIdentifier)

	// Split the identifier into set and name
	parts := strings.Split(cardIdentifier, "-")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid card identifier format")
	}
	set, name := parts[0], parts[1]

	// Construct the search URL
	apiURL := fmt.Sprintf("https://api.pokemontcg.io/v2/cards?q=set.id:%s name:%s", url.QueryEscape(set), url.QueryEscape(name))
	log.Printf("FetchCard: API URL: %s", apiURL)

	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("X-Api-Key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("FetchCard: Error making request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		log.Printf("FetchCard: Received non-200 response code: %d, Body: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	var result struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		log.Printf("FetchCard: No cards found matching the criteria for identifier: %s", cardIdentifier)
		return nil, fmt.Errorf("no cards found matching the criteria")
	}

	cardData := result.Data[0]
	imageURL := cardData["images"].(map[string]interface{})["large"].(string)

	card := &models.Card{
		ID:            cardData["id"].(string),
		Name:          cardData["name"].(string),
		Edition:       cardData["set"].(map[string]interface{})["name"].(string),
		Set:           cardData["set"].(map[string]interface{})["id"].(string),
		Grade:         "N/A", // This is now valid as Grade is an interface{}
		PurchasePrice: 0.00,  // Price is not provided by the API
		Image:         imageURL,
	}

	log.Printf("FetchCard: Successfully fetched card: %+v", card)

	cardCache.Set(card.ID, card, cache.DefaultExpiration)

	return card, nil
}

func GetCardsByUserIDAndCollectionName(userID string, collectionName string) ([]models.Card, error) {
	query := `
		SELECT i.item_id, i.name, i.edition, i.set, i.image, i.type, ui.grade, ui.purchase_price, ui.quantity
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

	var cards []models.Card
	for rows.Next() {
		var card models.Card
		err := rows.Scan(&card.ID, &card.Name, &card.Edition, &card.Set, &card.Image, &card.Type, &card.Grade, &card.PurchasePrice, &card.Quantity)
		if err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func UpdateCardQuantity(userID string, collectionName string, cardID string, quantity int) (*models.Card, error) {
	log.Printf("UpdateCardQuantity called with userID: %s, collectionName: %s, cardID: %s, quantity: %d", userID, collectionName, cardID, quantity)

	tx, err := database.DB.Begin()
	if err != nil {
		log.Printf("Error beginning transaction: %v", err)
		return nil, err
	}
	defer tx.Rollback()

	// Update the quantity
	result, err := tx.Exec(`
		UPDATE UserItems
		SET quantity = $1
		WHERE collection_id = (SELECT collection_id FROM Collections WHERE user_id = $2 AND collection_name = $3)
		AND item_id = $4
	`, quantity, userID, collectionName, cardID)
	if err != nil {
		log.Printf("Error updating quantity: %v", err)
		return nil, err
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		return nil, err
	}
	log.Printf("Rows affected by update: %d", rowsAffected)

	if rowsAffected == 0 {
		log.Printf("No rows were updated. Card might not exist in the collection.")
		return nil, fmt.Errorf("card not found in the collection")
	}

	// Fetch the updated card
	var card models.Card
	err = tx.QueryRow(`
		SELECT i.item_id, i.name, i.edition, i.set, i.image, ui.grade, ui.purchase_price, ui.quantity
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1 AND c.collection_name = $2 AND i.item_id = $3
	`, userID, collectionName, cardID).Scan(&card.ID, &card.Name, &card.Edition, &card.Set, &card.Image, &card.Grade, &card.PurchasePrice, &card.Quantity)
	if err != nil {
		log.Printf("Error fetching updated card: %v", err)
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		log.Printf("Error committing transaction: %v", err)
		return nil, err
	}

	log.Printf("Successfully updated card: %+v", card)
	return &card, nil
}

func GetCollectionByUserIDandCollectionName(userID string, collectionName string) (*models.Collection, error) {
	collection := &models.Collection{}
	err := database.DB.QueryRow(`
		SELECT collection_id, collection_name
		FROM Collections
		WHERE user_id = $1 AND collection_name = $2
	`, userID, collectionName).Scan(&collection.CollectionID, &collection.CollectionName)
	if err != nil {
		return nil, err
	}

	cards, err := GetCardsByUserIDAndCollectionName(userID, collectionName)
	if err != nil {
		return nil, err
	}
	collection.Cards = cards

	return collection, nil
}

func GetAllCardsByUserID(userID string) ([]models.Card, error) {
	log.Printf("Service: Fetching all cards for user ID: %s", userID)
	var cards []models.Card
	query := database.DB.Model(&models.Card{}).Where("user_id = ?", userID)

	// Print the generated SQL
	sql := query.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Find(&cards)
	})
	log.Printf("Generated SQL: %s", sql)

	err := query.Find(&cards).Error
	if err != nil {
		log.Printf("Service: Error fetching cards for user ID %s: %v", userID, err)
		return nil, err
	}
	log.Printf("Service: Successfully fetched %d cards for user ID: %s", len(cards), userID)
	return cards, nil
}

// You'll need to implement this function to fetch card data from the Pokemon TCG API
func FetchCardFromAPI(apiKey string, cardIdentifier string) (*models.Card, error) {
	log.Printf("FetchCardFromAPI: Attempting to fetch card with identifier: %s", cardIdentifier)

	// Split the identifier into set and name
	parts := strings.Split(cardIdentifier, "-")
	if len(parts) != 2 {
		return nil, fmt.Errorf("invalid card identifier format")
	}
	set, name := parts[0], parts[1]

	// Construct the search URL
	apiURL := fmt.Sprintf("https://api.pokemontcg.io/v2/cards?q=set.id:%s name:%s", url.QueryEscape(set), url.QueryEscape(name))
	log.Printf("FetchCardFromAPI: API URL: %s", apiURL)

	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("X-Api-Key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		log.Printf("FetchCardFromAPI: Error making request: %v", err)
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := ioutil.ReadAll(resp.Body)
		log.Printf("FetchCardFromAPI: Received non-200 response code: %d, Body: %s", resp.StatusCode, string(body))
		return nil, fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	var result struct {
		Data []map[string]interface{} `json:"data"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	if len(result.Data) == 0 {
		log.Printf("FetchCardFromAPI: No cards found matching the criteria for identifier: %s", cardIdentifier)
		return nil, fmt.Errorf("no cards found matching the criteria")
	}

	cardData := result.Data[0]
	imageURL := cardData["images"].(map[string]interface{})["large"].(string)

	card := &models.Card{
		ID:            cardData["id"].(string),
		Name:          cardData["name"].(string),
		Edition:       cardData["set"].(map[string]interface{})["name"].(string),
		Set:           cardData["set"].(map[string]interface{})["id"].(string),
		Grade:         "N/A", // This is now valid as Grade is an interface{}
		PurchasePrice: 0.00,  // Price is not provided by the API
		Image:         imageURL,
	}

	log.Printf("FetchCardFromAPI: Successfully fetched card: %+v", card)

	return card, nil
}

func AddCardToCollection(userID string, collectionName string, card models.Card) error {
	tx, err := database.DB.Begin()
	if err != nil {
		log.Printf("Error beginning transaction: %v", err)
		return err
	}
	defer tx.Rollback()

	// Get the collection ID
	var collectionID int
	err = tx.QueryRow(`
		SELECT collection_id FROM Collections 
		WHERE user_id = $1 AND collection_name = $2
	`, userID, collectionName).Scan(&collectionID)
	if err != nil {
		if err == sql.ErrNoRows {
			log.Printf("Collection not found: %s", collectionName)
			return fmt.Errorf("collection not found: %s", collectionName)
		}
		log.Printf("Error fetching collection: %v", err)
		return err
	}

	// Insert or update the Items table
	_, err = tx.Exec(`
		INSERT INTO Items (item_id, name, edition, set, image, type, grade)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
		ON CONFLICT (item_id) DO UPDATE SET
			name = EXCLUDED.name,
			edition = EXCLUDED.edition,
			set = EXCLUDED.set,
			image = EXCLUDED.image,
			type = EXCLUDED.type,
			grade = EXCLUDED.grade
	`, card.ID, card.Name, card.Edition, card.Set, card.Image, card.Type, card.Grade)
	if err != nil {
		log.Printf("Error inserting/updating item: %v", err)
		return err
	}

	// Insert or update the UserItems table (with purchase_price)
	result, err := tx.Exec(`
		INSERT INTO UserItems (collection_id, item_id, grade, purchase_price, quantity)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (collection_id, item_id) DO UPDATE SET
			grade = EXCLUDED.grade,
			purchase_price = EXCLUDED.purchase_price,
			quantity = UserItems.quantity + EXCLUDED.quantity
	`, collectionID, card.ID, card.Grade, card.PurchasePrice, card.Quantity)
	if err != nil {
		log.Printf("Error inserting/updating user item: %v", err)
		return err
	}
	rowsAffected, _ := result.RowsAffected()
	log.Printf("Rows affected in UserItems: %d", rowsAffected)

	err = tx.Commit()
	if err != nil {
		log.Printf("Error committing transaction: %v", err)
		return err
	}

	// After tx.Commit()
	var storedPrice float64
	err = database.DB.QueryRow("SELECT purchase_price FROM UserItems WHERE collection_id = $1 AND item_id = $2", collectionID, card.ID).Scan(&storedPrice)
	if err != nil {
		log.Printf("Error fetching stored price: %v", err)
	} else {
		log.Printf("Stored price for card %s in collection %d: %.2f", card.ID, collectionID, storedPrice)
	}

	return nil
}

func RemoveCardFromCollection(userID string, collectionName string, cardID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM UserItems
		WHERE collection_id = (SELECT collection_id FROM Collections WHERE user_id = $1 AND collection_name = $2)
		AND item_id = $3
	`, userID, collectionName, cardID)
	return err
}

func DebugPrintCardPrices(userID string, collectionName string) {
	query := `
		SELECT i.name, ui.price
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1 AND c.collection_name = $2
	`
	rows, err := database.DB.Query(query, userID, collectionName)
	if err != nil {
		log.Printf("Debug: Error querying card prices: %v", err)
		return
	}
	defer rows.Close()

	log.Println("Debug: Card prices from database:")
	for rows.Next() {
		var name string
		var price float64
		if err := rows.Scan(&name, &price); err != nil {
			log.Printf("Debug: Error scanning row: %v", err)
			continue
		}
		log.Printf("Debug: Card: %s, Price: %.2f", name, price)
	}
}

func DebugPrintUserItemPrices(userID string) {
	query := `
		SELECT i.name, ui.price
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1
	`
	rows, err := database.DB.Query(query, userID)
	if err != nil {
		log.Printf("Debug: Error querying user item prices: %v", err)
		return
	}
	defer rows.Close()

	log.Println("Debug: User item prices from database:")
	for rows.Next() {
		var name string
		var price float64
		if err := rows.Scan(&name, &price); err != nil {
			log.Printf("Debug: Error scanning row: %v", err)
			continue
		}
		log.Printf("Debug: Card: %s, Price: %.2f", name, price)
	}
}

func GetUserItemPrice(userID, collectionName, itemID string) (float64, error) {
	query := `
		SELECT ui.price
		FROM UserItems ui
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1 AND c.collection_name = $2 AND ui.item_id = $3
	`
	var price float64
	err := database.DB.QueryRow(query, userID, collectionName, itemID).Scan(&price)
	if err != nil {
		return 0, fmt.Errorf("error querying UserItems: %w", err)
	}
	log.Printf("Price for item %s in collection %s for user %s: %.2f", itemID, collectionName, userID, price)
	return price, nil
}
