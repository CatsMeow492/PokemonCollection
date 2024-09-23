package main

type Card struct {
    Name    string `json:"name"`
    Edition string `json:"edition"`
    Grade   string `json:"grade"`
    Price   string `json:"price"`
    Image   string `json:"image"`
}