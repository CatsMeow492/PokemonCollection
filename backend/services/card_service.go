package services

import (
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"time"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/patrickmn/go-cache"
)

var cardCache *cache.Cache
var imageCache *cache.Cache

func init() {
	cardCache = cache.New(24*time.Hour, 48*time.Hour)  // Cache for 1 day, purge expired items every 2 days
	imageCache = cache.New(24*time.Hour, 48*time.Hour) // Cache for 1 day, purge expired items every 2 days
}

func FetchCard(apiKey, cardID string) (*models.Card, error) {
	if cachedCard, found := cardCache.Get(cardID); found {
		return cachedCard.(*models.Card), nil
	}

	if cardID == "" {
		return nil, fmt.Errorf("cardID must be provided")
	}

	apiURL := fmt.Sprintf("https://api.pokemontcg.io/v2/cards/%s", cardID)

	req, _ := http.NewRequest("GET", apiURL, nil)
	req.Header.Set("X-Api-Key", apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	var result map[string]interface{}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	cardData, ok := result["data"].(map[string]interface{})
	if !ok {
		return nil, fmt.Errorf("unexpected data format for card: %s", cardID)
	}

	imageURL := cardData["images"].(map[string]interface{})["large"].(string)
	if cachedImage, found := imageCache.Get(imageURL); found {
		imageURL = cachedImage.(string)
	} else {
		imageCache.Set(imageURL, imageURL, cache.DefaultExpiration)
	}

	card := &models.Card{
		Name:    cardData["name"].(string),
		Edition: cardData["set"].(map[string]interface{})["name"].(string),
		Grade:   "N/A", // Grade is not provided by the API
		Price:   0.00,  // Price is not provided by the API
		Image:   imageURL,
	}

	cardCache.Set(cardID, card, cache.DefaultExpiration)

	// Update collection.json with the new image URL
	if err := updateCollectionJSON(cardID, imageURL); err != nil {
		return nil, fmt.Errorf("failed to update collection.json: %v", err)
	}

	return card, nil
}

// Helper function to update collection.json
func updateCollectionJSON(cardID, imageURL string) error {
	filePath := "collection.json"

	// Read the existing collection.json
	file, err := ioutil.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("error reading collection.json: %v", err)
	}

	var data struct {
		User models.User `json:"user"`
	}
	if err := json.Unmarshal(file, &data); err != nil {
		return fmt.Errorf("error unmarshalling collection.json: %v", err)
	}

	// Update the card's image URL
	updated := false
	for i, collection := range data.User.Collections {
		for j, card := range collection.Collection {
			if card.ID == cardID {
				data.User.Collections[i].Collection[j].Image = imageURL
				updated = true
				break
			}
		}
		if updated {
			break
		}
	}

	if !updated {
		return fmt.Errorf("card ID %s not found in collection.json", cardID)
	}

	// Write the updated data back to collection.json
	updatedData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		return fmt.Errorf("error marshalling updated collection.json: %v", err)
	}

	if err := ioutil.WriteFile(filePath, updatedData, 0644); err != nil {
		return fmt.Errorf("error writing to collection.json: %v", err)
	}

	return nil
}
