package handlers

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strconv"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/gin-gonic/gin"
)

func GetAllProducts() []models.Product {
	jsonFile, err := os.Open("shop.json")
	fmt.Println("Opening JSON file")
	if err != nil {
		log.Fatal(err)
	}
	defer jsonFile.Close()

	var data struct {
		Products []models.Product `json:"products"`
	}
	err = json.NewDecoder(jsonFile).Decode(&data)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Products:", data.Products)
	return data.Products
}

func GetProductByID(c *gin.Context) {
	// Get the id from the request
	id := c.Param("id")
	idInt, err := strconv.Atoi(id)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid product ID"})
		return
	}

	// Get all products
	products := GetAllProducts()

	// Find the product with the matching id
	for _, product := range products {
		if product.ID == idInt {
			c.JSON(http.StatusOK, product)
			return
		}
	}

	c.JSON(http.StatusNotFound, gin.H{"error": "Product not found"})
}
