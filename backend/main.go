package main

import (
    "encoding/json"
    "net/http"
    "github.com/gorilla/mux"
)

type Card struct {
    Name    string `json:"name"`
    Edition string `json:"edition"`
    Grade   string `json:"grade"`
    Price   string `json:"price"`
}

func getCards(w http.ResponseWriter, r *http.Request) {
    cards := []Card{
        {"Haunter", "Fossil", "CGC 10 GEM MINT", "$259.99"},
        {"Mew", "2000 Black Star Promo", "CGC 10 Gem Mint", "$425.00"},
        {"Articuno", "1999 Fossil - Unlimited", "CGC 9 MINT", "$89.99"},
        {"Moltres", "1999 Fossil", "PSA 8", "$59.99"},
        {"Jolteon", "1999 Jungle", "CGC 8.5 NM", "$55.00"},
        {"Kangaskhan", "Jungle Unlimited", "NM", "$11.99"},
        {"Clefable", "Jungle", "PSA 8 Near Mint-Mint", "$39.99"},
        {"Flareon", "1999 Jungle Unlimited", "SGC 8", "$50.00"},
        {"Mr. Mime", "1999 Jungle", "PSA 7 NM", "$30.00"},
        {"Vaporeon", "1999 Jungle", "PSA 8", "$50.00"},
        {"Lily Pad Mew", "Pokémon Evolutions", "PSA 9 MINT", "$34.90"},
        {"Gengar", "1999 Fossil 1st Edition", "PSA 8", "$245.00"},
    }
    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(cards)
}

func main() {
    r := mux.NewRouter()
    r.HandleFunc("/api/cards", getCards).Methods("GET")
    http.ListenAndServe(":8000", r)
}
