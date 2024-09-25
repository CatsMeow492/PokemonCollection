package models

type Card struct {
    Name    string `json:"name"`
    Edition string `json:"edition"`
    Set     string `json:"set"`
    Grade   string `json:"grade"`
    Price   string `json:"price"`
    Image   string `json:"image"`
}
