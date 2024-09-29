package models

type Card struct {
	Name     string  `json:"name"`
	Edition  string  `json:"edition"`
	Set      string  `json:"set"`
	Grade    string  `json:"grade"`
	Price    float64 `json:"price"` // Changed from int to float64
	Image    string  `json:"image"`
	Quantity int     `json:"quantity"`
	Id       string  `json:"id"`
}
