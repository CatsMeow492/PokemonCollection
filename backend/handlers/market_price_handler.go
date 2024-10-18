package handlers

import (
	"encoding/json"
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

func GetMarketPriceHandler(w http.ResponseWriter, r *http.Request) {
	cardName := r.URL.Query().Get("name")
	cardId := r.URL.Query().Get("id")
	edition := r.URL.Query().Get("edition")
	grade := r.URL.Query().Get("grade")

	log.Printf("Received market value request for %s %s %s %s", cardName, cardId, edition, grade)

	marketValue, err := services.FetchAndStoreMarketPrice(cardName, cardId, edition, grade)
	if err != nil {
		log.Printf("Error in GetMarketPriceHandler: %v", err)
		sendJSONResponse(w, 0, err.Error())
		return
	}

	log.Printf("Sending market value response for %s: %f", cardId, marketValue)
	sendJSONResponse(w, marketValue, "")
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
