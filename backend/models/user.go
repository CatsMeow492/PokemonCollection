package models

import "github.com/dgrijalva/jwt-go"

type User struct {
	ID             string       `json:"id"`
	FirstName      string       `json:"first_name"`
	LastName       string       `json:"last_name"`
	Username       string       `json:"username"`
	Email          string       `json:"email"`
	Password       string       `json:"password"`
	ProfilePicture string       `json:"profile_picture"`
	Collections    []Collection `json:"collections"`
}

type Claims struct {
	Username string `json:"username"`
	jwt.StandardClaims
}
