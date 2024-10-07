package handlers

import (
	"encoding/json"
	"fmt"
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

	var item struct {
		ProductID int `json:"ProductID"`
		Quantity  int `json:"Quantity"`
	}
	err := json.NewDecoder(r.Body).Decode(&item)
	if err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}
	log.Printf("Received item to add: %+v", item)

	// Fetch product details
	product, err := getProductById(item.ProductID)
	if err != nil {
		log.Printf("Error fetching product details: %v", err)
		http.Error(w, "Product not found", http.StatusNotFound)
		return
	}

	// Create a new CartItem with all details
	newItem := models.CartItem{
		ProductID: item.ProductID,
		Quantity:  item.Quantity,
		Name:      product.Name,
		Price:     product.Price,
		Image:     product.Image,
	}

	// Check if the item already exists in the cart
	cart, exists := userCarts[userID]
	if !exists {
		log.Printf("Cart not found for user_id: %s. Creating new cart.", userID)
		cart = models.Cart{UserID: userID, Items: []models.CartItem{}}
	}

	for i, cartItem := range cart.Items {
		if cartItem.ProductID == newItem.ProductID {
			log.Printf("Item %d already exists in cart. Updating quantity.", newItem.ProductID)
			cart.Items[i].Quantity += newItem.Quantity
			userCarts[userID] = cart
			w.Header().Set("Content-Type", "application/json")
			json.NewEncoder(w).Encode(cart)
			log.Printf("Updated cart for user_id: %s - Cart: %+v", userID, cart)
			return
		}
	}

	// If the item doesn't exist, add it to the cart
	log.Printf("Adding new item to cart for user_id: %s", userID)
	cart.Items = append(cart.Items, newItem)
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

// Add this function to fetch product details
func getProductById(id int) (models.Product, error) {
	products := GetAllProducts()
	for _, product := range products {
		if product.ID == id {
			return product, nil
		}
	}
	return models.Product{}, fmt.Errorf("product not found")
}
