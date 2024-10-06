package handlers

import (
	"encoding/json"
	"log"
	"net/http"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/gorilla/mux"
)

var userCarts = make(map[string]models.Cart)

func GetCart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	log.Printf("GetCart called for user_id: %s", userID)

	cart, exists := userCarts[userID]
	if !exists {
		log.Printf("Cart not found for user_id: %s. Creating new cart.", userID)
		cart = models.Cart{UserID: userID, Items: []models.CartItem{}}
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cart.Items) // Return just the Items array
	log.Printf("GetCart response for user_id: %s - Cart Items: %+v", userID, cart.Items)
}

func AddToCart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]
	log.Printf("AddToCart called for user_id: %s", userID)

	var item models.CartItem
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Received item to add: %+v", item)

	cart, exists := userCarts[userID]
	if !exists {
		log.Printf("Cart not found for user_id: %s. Creating new cart.", userID)
		cart = models.Cart{UserID: userID, Items: []models.CartItem{}}
	}

	// Check if the item already exists in the cart
	for i, cartItem := range cart.Items {
		if cartItem.ProductID == item.ProductID {
			log.Printf("Item %s already exists in cart. Updating quantity.", item.ProductID)
			cart.Items[i].Quantity += item.Quantity
			userCarts[userID] = cart
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cart)
			log.Printf("Updated cart for user_id: %s - Cart: %+v", userID, cart)
			return
		}
	}

	// If the item doesn't exist, add it to the cart
	log.Printf("Adding new item to cart for user_id: %s", userID)
	cart.Items = append(cart.Items, item)
	userCarts[userID] = cart

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(cart)
}

func UpdateCartItem(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	var item models.CartItem
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cart, exists := userCarts[userID]
	if !exists {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	for i, cartItem := range cart.Items {
		if cartItem.ProductID == item.ProductID {
			cart.Items[i].Quantity = item.Quantity
			userCarts[userID] = cart
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cart)
			return
		}
	}

	http.Error(w, "Item not found in cart", http.StatusNotFound)
}

func RemoveFromCart(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	userID := vars["user_id"]

	var item models.CartItem
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	cart, exists := userCarts[userID]
	if !exists {
		http.Error(w, "Cart not found", http.StatusNotFound)
		return
	}

	for i, cartItem := range cart.Items {
		if cartItem.ProductID == item.ProductID {
			cart.Items = append(cart.Items[:i], cart.Items[i+1:]...)
			userCarts[userID] = cart
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cart)
			return
		}
	}

	http.Error(w, "Item not found in cart", http.StatusNotFound)
}
