package services

import (
	"encoding/json"
	"fmt"
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
	return card, nil
}
