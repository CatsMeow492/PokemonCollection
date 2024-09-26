package main

import (
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/handlers"
	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/api/cards", handlers.GetCards).Methods("GET")
	r.HandleFunc("/api/market-price", handlers.MarketPriceHandler).Methods("GET")
	r.HandleFunc("/api/cards", handlers.AddCard).Methods("POST")
	r.HandleFunc("/api/health", handlers.HealthCheck).Methods("GET")
	log.Println("Listening on :8000")
	http.ListenAndServe(":8000", r)
}
