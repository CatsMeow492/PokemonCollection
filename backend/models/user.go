package models

import "github.com/dgrijalva/jwt-go"

type User struct {
	ID             string `json:"id"`
	Username       string `json:"username"`
	Email          string `json:"email"`
	Password       string `json:"password"`
	ProfilePicture string `json:"profile_picture"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}
