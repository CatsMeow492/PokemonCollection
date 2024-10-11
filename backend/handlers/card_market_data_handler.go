package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/data"
	"github.com/gorilla/mux"
)

func GetCardMarketData(w http.ResponseWriter, r *http.Request) {
	cardId := mux.Vars(r)["cardId"]

	store, err := data.LoadMarketData()
	if err != nil {
		http.Error(w, "Failed to load market data", http.StatusInternalServerError)
		return
	}

	cardData := store.GetDataByID(cardId)

	if len(cardData) == 0 {
		http.Error(w, "No market data found for this card", http.StatusNotFound)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cardData)
}
