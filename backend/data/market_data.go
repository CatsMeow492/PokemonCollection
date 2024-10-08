package data

import (
	"encoding/json"
	"errors"
	"os"
	"time"
)

type MarketData struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Type      string    `json:"type"` // "card" or "item"
	Edition   string    `json:"edition,omitempty"`
	Grade     string    `json:"grade,omitempty"`
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

func (store *MarketDataStore) GetLatestPrice(itemType, name, edition, grade string) (float64, error) {
	var latestData MarketData
	var found bool

	for _, data := range store.Data {
		if data.Type == itemType && data.Name == name &&
			data.Edition == edition && data.Grade == grade {
			if !found || data.FetchedAt.After(latestData.FetchedAt) {
				latestData = data
				found = true
			}
		}
	}

	if !found {
		return 0, ErrNoDataFound
	}

	return latestData.Price, nil
}

var ErrNoDataFound = errors.New("no market data found for the specified item")
