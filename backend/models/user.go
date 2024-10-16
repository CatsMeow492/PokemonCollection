package models

import (
	"time"

	"github.com/dgrijalva/jwt-go"
)

type User struct {
	ID             string    `json:"id"`
	FirstName      string    `json:"first_name"`
	LastName       string    `json:"last_name"`
	Username       string    `json:"username"`
	Email          string    `json:"email"`
	Password       string    `json:"password"`
	ProfilePicture string    `json:"profile_picture"`
	Joined         time.Time `json:"joined"`
	LastLogin      time.Time `json:"last_login"`
	IsActive       bool      `json:"is_active"`
	IsAdmin        bool      `json:"is_admin"`
	IsSubscribed   bool      `json:"is_subscribed"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}
