package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/CatsMeow492/PokemonCollection/services"
	"github.com/patrickmn/go-cache"
)

var marketPriceCache *cache.Cache

func init() {
	marketPriceCache = cache.New(24*time.Hour, 48*time.Hour) // Cache for 1 day, purge expired items every 2 days
}

func GetCardMarketPrice(w http.ResponseWriter, r *http.Request) {
	cardName := r.URL.Query().Get("card_name")
	cardId := r.URL.Query().Get("card_id")
	edition := r.URL.Query().Get("edition")
	grade := r.URL.Query().Get("grade")

	log.Printf("Received request for card market price: card_name=%s, card_id=%s, edition=%s, grade=%s", cardName, cardId, edition, grade)

	if cardName == "" || cardId == "" || edition == "" || grade == "" {
		log.Println("Missing required parameters for card")
		http.Error(w, "Missing required parameters", http.StatusBadRequest)
		return
	}

	cacheKey := fmt.Sprintf("card-%s-%s-%s-%s", cardName, cardId, edition, grade)
	if cachedPrice, found := marketPriceCache.Get(cacheKey); found {
		sendJSONResponse(w, cachedPrice.(float64), "")
		return
	}

	marketPrice, err := services.GetMarketPrice(cardName, cardId, edition, grade)
	if err != nil {
		log.Printf("Error getting card market price: %v", err)
		sendJSONResponse(w, 0, err.Error())
		return
	}

	marketPriceCache.Set(cacheKey, marketPrice, cache.DefaultExpiration)
	sendJSONResponse(w, marketPrice, "")
}

func GetItemMarketPrice(w http.ResponseWriter, r *http.Request) {
	itemName := r.URL.Query().Get("item_name")
	itemEdition := r.URL.Query().Get("item_edition")
	itemGrade := r.URL.Query().Get("grade")

	log.Printf("Received request for item market price: item_name=%s, item_edition=%s, grade=%s", itemName, itemEdition, itemGrade)

	if itemName == "" {
		log.Println("Missing required parameter: item_name")
		http.Error(w, "Missing required parameter: item_name", http.StatusBadRequest)
		return
	}

	cacheKey := fmt.Sprintf("item-%s-%s-%s", itemName, itemEdition, itemGrade)
	if cachedPrice, found := marketPriceCache.Get(cacheKey); found {
		sendJSONResponse(w, cachedPrice.(float64), "")
		return
	}

	marketPrice, err := services.GetItemMarketPrice(itemName, itemEdition)
	if err != nil {
		log.Printf("Error getting item market price: %v", err)
		sendJSONResponse(w, 0, err.Error())
		return
	}

	marketPriceCache.Set(cacheKey, marketPrice, cache.DefaultExpiration)
	sendJSONResponse(w, marketPrice, "")
}

func sendJSONResponse(w http.ResponseWriter, price float64, errMsg string) {
	response := struct {
		MarketPrice float64 `json:"market_price"`
		Error       string  `json:"error,omitempty"`
	}{
		MarketPrice: price,
		Error:       errMsg,
	}

	w.Header().Set("Content-Type", "application/json")
	if errMsg != "" {
		w.WriteHeader(http.StatusNotFound)
	}
	json.NewEncoder(w).Encode(response)
}
