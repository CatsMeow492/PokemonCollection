package services

import (
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
		ID:      cardData["id"].(string),
		Name:    cardData["name"].(string),
		Edition: cardData["set"].(map[string]interface{})["name"].(string),
		Set:     cardData["set"].(map[string]interface{})["id"].(string),
		Grade:   "N/A", // This is now valid as Grade is an interface{}
		Price:   0.00,  // Price is not provided by the API
		Image:   imageURL,
	}

	log.Printf("FetchCard: Successfully fetched card: %+v", card)

	cardCache.Set(card.ID, card, cache.DefaultExpiration)

	return card, nil
}

func GetCardsByUserIDAndCollectionName(userID string, collectionName string) ([]models.Card, error) {
	query := `
		SELECT i.item_id, i.name, i.edition, i.set, i.image, ui.grade, ui.price, ui.quantity
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
		err := rows.Scan(&card.ID, &card.Name, &card.Edition, &card.Set, &card.Image, &card.Grade, &card.Price, &card.Quantity)
		if err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}
	return cards, nil
}

func UpdateCardQuantity(userID string, collectionName string, cardID string, quantity int) (*models.Card, error) {
	tx, err := database.DB.Begin()
	if err != nil {
		return nil, err
	}
	defer tx.Rollback()

	// Update the quantity
	_, err = tx.Exec(`
		UPDATE UserItems
		SET quantity = $1
		WHERE collection_id = (SELECT collection_id FROM Collections WHERE user_id = $2 AND collection_name = $3)
		AND item_id = $4
	`, quantity, userID, collectionName, cardID)
	if err != nil {
		return nil, err
	}

	// Fetch the updated card
	var card models.Card
	err = tx.QueryRow(`
		SELECT i.item_id, i.name, i.edition, i.set, i.image, ui.grade, ui.price, ui.quantity
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1 AND c.collection_name = $2 AND i.item_id = $3
	`, userID, collectionName, cardID).Scan(&card.ID, &card.Name, &card.Edition, &card.Set, &card.Image, &card.Grade, &card.Price, &card.Quantity)
	if err != nil {
		return nil, err
	}

	err = tx.Commit()
	if err != nil {
		return nil, err
	}

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
	query := `
		SELECT i.item_id, i.name, i.edition, i.set, i.image, ui.grade, ui.price, ui.quantity
		FROM UserItems ui
		JOIN Items i ON ui.item_id = i.item_id
		JOIN Collections c ON ui.collection_id = c.collection_id
		WHERE c.user_id = $1
	`
	rows, err := database.DB.Query(query, userID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var cards []models.Card
	for rows.Next() {
		var card models.Card
		err := rows.Scan(&card.ID, &card.Name, &card.Edition, &card.Set, &card.Image, &card.Grade, &card.Price, &card.Quantity)
		if err != nil {
			return nil, err
		}
		cards = append(cards, card)
	}
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
		ID:      cardData["id"].(string),
		Name:    cardData["name"].(string),
		Edition: cardData["set"].(map[string]interface{})["name"].(string),
		Set:     cardData["set"].(map[string]interface{})["id"].(string),
		Grade:   "N/A", // This is now valid as Grade is an interface{}
		Price:   0.00,  // Price is not provided by the API
		Image:   imageURL,
	}

	log.Printf("FetchCardFromAPI: Successfully fetched card: %+v", card)

	return card, nil
}

func AddCardToCollection(userID string, collectionName string, card models.Card) error {
	tx, err := database.DB.Begin()
	if err != nil {
		return err
	}
	defer tx.Rollback()

	// Check if the collection exists, if not create it
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

	// Insert or update the Items table
	_, err = tx.Exec(`
		INSERT INTO Items (item_id, name, edition, set, image, type)
		VALUES ($1, $2, $3, $4, $5, 'Pokemon Card')
		ON CONFLICT (item_id) DO UPDATE SET
			name = EXCLUDED.name,
			edition = EXCLUDED.edition,
			set = EXCLUDED.set,
			image = EXCLUDED.image
	`, card.ID, card.Name, card.Edition, card.Set, card.Image)
	if err != nil {
		return err
	}

	// Insert or update the UserItems table
	_, err = tx.Exec(`
		INSERT INTO UserItems (collection_id, item_id, grade, price, quantity)
		VALUES ($1, $2, $3, $4, $5)
		ON CONFLICT (collection_id, item_id) DO UPDATE SET
			grade = EXCLUDED.grade,
			price = EXCLUDED.price,
			quantity = UserItems.quantity + EXCLUDED.quantity
	`, collectionID, card.ID, card.Grade, card.Price, card.Quantity)
	if err != nil {
		return err
	}

	return tx.Commit()
}

func RemoveCardFromCollection(userID string, collectionName string, cardID string) error {
	_, err := database.DB.Exec(`
		DELETE FROM UserItems
		WHERE collection_id = (SELECT collection_id FROM Collections WHERE user_id = $1 AND collection_name = $2)
		AND item_id = $3
	`, userID, collectionName, cardID)
	return err
}
