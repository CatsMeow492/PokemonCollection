package data

import (
	"encoding/json"
	"os"
	"time"
)

type MarketData struct {
	CardID    string    `json:"card_id"`
	Price     float64   `json:"price"`
	FetchedAt time.Time `json:"fetched_at"`
}

type MarketDataStore struct {
	Data []MarketData `json:"data"`
}

const marketDataFile = "market_data.json"

func LoadMarketData() (MarketDataStore, error) {
	var store MarketDataStore
	data, err := os.ReadFile(marketDataFile)
	if err != nil {
		if os.IsNotExist(err) {
			return store, nil
		}
		return store, err
	}
	err = json.Unmarshal(data, &store)
	return store, err
}

func SaveMarketData(store MarketDataStore) error {
	data, err := json.MarshalIndent(store, "", "  ")
	if err != nil {
		return err
	}
	return os.WriteFile(marketDataFile, data, 0644)
}

func (store *MarketDataStore) AddMarketData(newData MarketData) {
	store.Data = append(store.Data, newData)
}
