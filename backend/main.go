package main

import (
    "log"
    "net/http"

    "github.com/gorilla/mux"
    "github.com/CatsMeow492/PokemonCollection/handlers"
)

func main() {
    r := mux.NewRouter()
    r.HandleFunc("/api/cards", handlers.GetCards).Methods("GET")
    r.HandleFunc("/api/market-price", handlers.MarketPriceHandler).Methods("GET")
    log.Println("Listening on :8000")
    http.ListenAndServe(":8000", r)
}
