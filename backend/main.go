package main

import (
	"encoding/json"
	"log"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/CatsMeow492/PokemonCollection/handlers"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/mux"
	"github.com/joho/godotenv"
)

var jwtKey []byte

func InitJWTKey(key string) {
	jwtKey = []byte(key)
}

const pokemonCacheDuration = 10 * time.Minute // or any duration you prefer
var pokemonCacheMutex sync.Mutex

func main() {
	err := godotenv.Load()
	if err != nil {
		log.Fatalf("Error loading .env file")
	}

	jwtKey := os.Getenv("JWT_KEY")
	if jwtKey == "" {
		log.Fatalf("JWT_KEY environment variable not set")
	}

	handlers.InitJWTKey(jwtKey)

	r := mux.NewRouter()
	// Login and Register
	r.HandleFunc("/api/login", handlers.Login).Methods("POST")
	r.HandleFunc("/api/register", handlers.Register).Methods("POST")

	// Cards
	r.HandleFunc("/api/cards", func(w http.ResponseWriter, r *http.Request) {
		userID := r.URL.Query().Get("user_id")
		collectionName := r.URL.Query().Get("collection_name")
		if userID != "" {
			if collectionName != "" {
				handlers.GetCardsByUserIDAndCollectionName(w, r, userID, collectionName)
			} else {
				handlers.GetAllCardsByUserID(w, r, userID)
			}
		} else {
			// This should return a demo collection
			println("No user ID provided")
		}
	}).Methods("GET")
	r.HandleFunc("/api/collections/{user_id}", handlers.GetCollectionsByUserID).Methods("GET")
	r.HandleFunc("/api/market-price", handlers.MarketPriceHandler).Methods("GET")
	r.HandleFunc("/api/cards", handlers.AddCard).Methods("POST")
	r.HandleFunc("/api/health", handlers.HealthCheck).Methods("GET")
	r.HandleFunc("/api/pokemon-names", handlers.GetPokemonNames).Methods("GET")
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
	log.Println("Server is running on port 8000")
	log.Println("JWT Key:", jwtKey)
	log.Fatal(http.ListenAndServe(":8000", r))
}
