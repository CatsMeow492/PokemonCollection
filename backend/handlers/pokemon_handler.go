package handlers

import (
	"encoding/json"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/services"
)

func GetPokemonNames(w http.ResponseWriter, r *http.Request) {
	names, err := services.GetCachedPokemonNames()
	if err != nil {
		http.Error(w, "Error fetching Pokémon names", http.StatusInternalServerError)
		return
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(names)
}
