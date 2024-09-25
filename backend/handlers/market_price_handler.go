package handlers

import (
    "encoding/json"
    "fmt"
    "net/http"
    "time"

    "github.com/CatsMeow492/PokemonCollection/services"
    "github.com/patrickmn/go-cache"
)

var marketPriceCache *cache.Cache

func init() {
    marketPriceCache = cache.New(24*time.Hour, 48*time.Hour) // Cache for 1 day, purge expired items every 2 days
}

func MarketPriceHandler(w http.ResponseWriter, r *http.Request) {
    cardName := r.URL.Query().Get("card_name")
    edition := r.URL.Query().Get("edition")
    grade := r.URL.Query().Get("grade")

    if cardName == "" || edition == "" || grade == "" {
        http.Error(w, "Missing required parameters", http.StatusBadRequest)
        return
    }

    cacheKey := fmt.Sprintf("%s-%s-%s", cardName, edition, grade)
    if cachedPrice, found := marketPriceCache.Get(cacheKey); found {
        response := struct {
            MarketPrice float64 `json:"market_price"`
        }{
            MarketPrice: cachedPrice.(float64),
        }
        w.Header().Set("Content-Type", "application/json")
        json.NewEncoder(w).Encode(response)
        return
    }

    marketPrice, err := services.GetMarketPrice(cardName, edition, grade)
    response := struct {
        MarketPrice float64 `json:"market_price"`
        Error       string  `json:"error,omitempty"`
    }{}
    if err != nil {
        response.Error = err.Error()
        w.WriteHeader(http.StatusNotFound)
    } else {
        response.MarketPrice = marketPrice
        marketPriceCache.Set(cacheKey, marketPrice, cache.DefaultExpiration)
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(response)
}
