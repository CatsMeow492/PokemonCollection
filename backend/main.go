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
	"github.com/rs/cors"
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
	r.HandleFunc("/api/cards", handlers.AddCardWithUserID).Methods("POST")
	r.HandleFunc("/api/cards/collection", handlers.AddCardWithUserIDAndCollection).Methods("POST")

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
	r.HandleFunc("/api/cards/remove/{user_id}/{collection_name}/{card_id}", handlers.RemoveCardFromCollectionWithUserIDAndCollection).Methods("DELETE")

	// Items
	r.HandleFunc("/api/items/{user_id}/{collection_name}", func(w http.ResponseWriter, r *http.Request) {
		log.Printf("Endpoint hit: POST /api/items/{user_id}/{collection_name}")
		handlers.AddItemWithUserIDAndCollection(w, r)
	}).Methods("POST")
	r.HandleFunc("/api/items/{user_id}/{collection_name}/{item_id}", handlers.RemoveItemFromCollectionWithUserIDAndCollection).Methods("DELETE")

	// Collections
	r.HandleFunc("/api/collections/{user_id}", handlers.GetCollectionsByUserID).Methods("GET")
	r.HandleFunc("/api/collections/{user_id}/{collection_name}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		userID := vars["user_id"]
		collectionName := vars["collection_name"]
		handlers.GetCollectionByUserIDandCollectionName(w, r, userID, collectionName)
	}).Methods("GET")
	r.HandleFunc("/api/collections/{user_id}/{collection_name}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		log.Printf("DELETE request received for user_id: %s, collection_name: %s", vars["user_id"], vars["collection_name"])
		handlers.DeleteCollectionByUserIDandCollectionName(w, r)
	}).Methods("DELETE")
	r.HandleFunc("/api/collections/{user_id}/{collection_name}", func(w http.ResponseWriter, r *http.Request) {
		vars := mux.Vars(r)
		log.Printf("POST request received for user_id: %s, collection_name: %s", vars["user_id"], vars["collection_name"])
		handlers.CreateCollectionByUserIDandCollectionName(w, r)
	}).Methods("POST")

	r.HandleFunc("/api/market-price", func(w http.ResponseWriter, r *http.Request) {
		log.Println("Market price endpoint hit")
		handlers.GetCardMarketPrice(w, r)
	}).Methods("GET")
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
	r.HandleFunc("/api/cards/quantity", handlers.UpdateCardQuantity).Methods("PUT")
	log.Println("Registered PUT /api/cards/quantity route")

	// Cart endpoints
	r.HandleFunc("/api/cart/{user_id}", handlers.GetCart).Methods("GET")
	r.HandleFunc("/api/cart/{user_id}/add", handlers.AddToCart).Methods("POST")
	r.HandleFunc("/api/cart/{user_id}/update", handlers.UpdateCartItem).Methods("PUT")
	r.HandleFunc("/api/cart/{user_id}/remove", handlers.RemoveFromCart).Methods("DELETE")

	// Serve images from the "images" directory
	r.PathPrefix("/images/").Handler(http.StripPrefix("/images/", http.FileServer(http.Dir("./images"))))

	// Add this before wrapping your router with the CORS handler
	r.Methods("OPTIONS").HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
	})

	// Create a new CORS handler
	c := cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"}, // Allow requests from your frontend
		AllowedMethods:   []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"*"}, // Allow all headers
		AllowCredentials: true,
	})

	// Wrap your router with the CORS handler
	handler := c.Handler(r)

	r.HandleFunc("/api/item-market-price", handlers.GetItemMarketPrice).Methods("GET")

	log.Println("Server is running on :8000")
	log.Fatal(http.ListenAndServe(":8000", handler))
}
