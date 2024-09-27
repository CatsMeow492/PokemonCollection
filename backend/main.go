package main

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/handlers"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/mux"
)

func main() {
	r := mux.NewRouter()
	r.HandleFunc("/api/cards", handlers.GetCards).Methods("GET")
	r.HandleFunc("/api/market-price", handlers.MarketPriceHandler).Methods("GET")
	r.HandleFunc("/api/cards", handlers.AddCard).Methods("POST")
	r.HandleFunc("/api/health", handlers.HealthCheck).Methods("GET")
	r.HandleFunc("/api/product/{id}", func(w http.ResponseWriter, r *http.Request) {
		// Create a new gin context
		c, _ := gin.CreateTestContext(w)
		c.Request = r
		handlers.GetProductByID(c)
	}).Methods("GET")
	r.HandleFunc("/api/products", func(w http.ResponseWriter, r *http.Request) {
		products := handlers.GetAllProducts()
		json.NewEncoder(w).Encode(products)
	}).Methods("GET")
	r.HandleFunc("/api/cards/quantity", handlers.UpdateCardQuantity).Methods("PUT") // Ensure the method is specified

	// Serve images from the "images" directory
	r.PathPrefix("/images/").Handler(http.StripPrefix("/images/", http.FileServer(http.Dir("./images"))))

	log.Println("Listening on :8000")
	http.ListenAndServe(":8000", r)
}
