package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/utils"

	"github.com/dgrijalva/jwt-go"
	"golang.org/x/crypto/bcrypt"
)

var jwtKey []byte

func InitJWTKey(key string) {
	jwtKey = []byte(key)
}

type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}

func Register(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		log.Printf("Error decoding request body: %v", err)
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Check if the username or email already exists
	if _, err := utils.GetUserByUsername(user.Username); err == nil {
		log.Printf("Username already exists: %s", user.Username)
		http.Error(w, "Username already exists", http.StatusConflict)
		return
	}
	if _, err := utils.GetUserByEmail(user.Email); err == nil {
		log.Printf("Email already exists: %s", user.Email)
		http.Error(w, "Email already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}
	user.Password = string(hashedPassword)

	if err := utils.SaveUser(user); err != nil {
		log.Printf("Error saving user: %v", err)
		http.Error(w, "Error saving user", http.StatusInternalServerError)
		return
	}

	w.WriteHeader(http.StatusCreated)
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]string{"message": "User registered successfully"})
	log.Printf("User registered successfully: %s", user.Username)
}

func Login(w http.ResponseWriter, r *http.Request) {
	var user models.User
	if err := json.NewDecoder(r.Body).Decode(&user); err != nil {
		http.Error(w, "Invalid request body", http.StatusBadRequest)
		return
	}

	// Try to get the user by username or email
	storedUser, err := utils.GetUserByUsername(user.Username)
	if err != nil {
		storedUser, err = utils.GetUserByEmail(user.Email)
		if err != nil {
			http.Error(w, "Invalid username/email or password", http.StatusUnauthorized)
			return
		}
	}

	if err := bcrypt.CompareHashAndPassword([]byte(storedUser.Password), []byte(user.Password)); err != nil {
		http.Error(w, "Invalid username/email or password", http.StatusUnauthorized)
		return
	}

	expirationTime := time.Now().Add(24 * time.Hour)
	claims := &Claims{
		Username: storedUser.Username,
		StandardClaims: jwt.StandardClaims{
			ExpiresAt: expirationTime.Unix(),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	tokenString, err := token.SignedString(jwtKey)
	if err != nil {
		http.Error(w, "Error generating token", http.StatusInternalServerError)
		return
	}

	http.SetCookie(w, &http.Cookie{
		Name:    "token",
		Value:   tokenString,
		Expires: expirationTime,
	})

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"token": tokenString, "username": storedUser.Username, "profile_picture": storedUser.ProfilePicture, "id": storedUser.ID}
	log.Printf("Login response: %+v", response) // Add logging here
	json.NewEncoder(w).Encode(response)
}
