package handlers

import (
	"encoding/json"
	"log"
	"net/http"
	"time"

	"github.com/CatsMeow492/PokemonCollection/database"
	"github.com/CatsMeow492/PokemonCollection/models"

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
	var existingUser models.User
	err := database.DB.QueryRow("SELECT user_id FROM Users WHERE username = $1 OR email = $2", user.Username, user.Email).Scan(&existingUser.ID)
	if err == nil {
		log.Printf("Username or email already exists: %s, %s", user.Username, user.Email)
		http.Error(w, "Username or email already exists", http.StatusConflict)
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(user.Password), bcrypt.DefaultCost)
	if err != nil {
		log.Printf("Error hashing password: %v", err)
		http.Error(w, "Error hashing password", http.StatusInternalServerError)
		return
	}

	// Insert the new user into the database
	_, err = database.DB.Exec(`
		INSERT INTO Users (username, first_name, last_name, email, password, profile_picture, joined)
		VALUES ($1, $2, $3, $4, $5, $6, $7)
	`, user.Username, user.FirstName, user.LastName, user.Email, string(hashedPassword), user.ProfilePicture, time.Now())

	if err != nil {
		log.Printf("Error inserting user into database: %v", err)
		http.Error(w, "Error registering user", http.StatusInternalServerError)
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

	// Retrieve the user from the database
	var storedUser models.User
	err := database.DB.QueryRow(`
		SELECT user_id, username, password, profile_picture
		FROM Users
		WHERE username = $1 OR email = $1
	`, user.Username).Scan(&storedUser.ID, &storedUser.Username, &storedUser.Password, &storedUser.ProfilePicture)

	if err != nil {
		http.Error(w, "Invalid username/email or password", http.StatusUnauthorized)
		return
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

	// Update last_login in the database
	_, err = database.DB.Exec("UPDATE Users SET last_login = $1 WHERE user_id = $2", time.Now(), storedUser.ID)
	if err != nil {
		log.Printf("Error updating last_login: %v", err)
	}

	w.Header().Set("Content-Type", "application/json")
	response := map[string]string{"token": tokenString, "username": storedUser.Username, "profile_picture": storedUser.ProfilePicture, "id": storedUser.ID}
	log.Printf("Login response: %+v", response)
	json.NewEncoder(w).Encode(response)
}
