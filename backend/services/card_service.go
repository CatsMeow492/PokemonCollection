package services

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/patrickmn/go-cache"
    "github.com/CatsMeow492/PokemonCollection/models"
)

var cardCache *cache.Cache
var imageCache *cache.Cache

func init() {
    cardCache = cache.New(24*time.Hour, 48*time.Hour) // Cache for 1 day, purge expired items every 2 days
    imageCache = cache.New(24*time.Hour, 48*time.Hour) // Cache for 1 day, purge expired items every 2 days
}

func FetchCard(apiKey, name, setID string) (*models.Card, error) {
    if cachedCard, found := cardCache.Get(name + setID); found {
        return cachedCard.(*models.Card), nil
    }

    url := fmt.Sprintf("https://api.pokemontcg.io/v2/cards?q=name:%s%%20set.id:%s", name, setID)
    req, _ := http.NewRequest("GET", url, nil)
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

    data, ok := result["data"].([]interface{})
    if !ok || len(data) == 0 {
        return nil, fmt.Errorf("no data found for card: %s", name)
    }

    cardData, ok := data[0].(map[string]interface{})
    if !ok {
        return nil, fmt.Errorf("unexpected data format for card: %s", name)
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
        Price:   "N/A", // Price is not provided by the API
        Image:   imageURL,
    }

    cardCache.Set(name+setID, card, cache.DefaultExpiration)
    return card, nil
}
