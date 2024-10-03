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
