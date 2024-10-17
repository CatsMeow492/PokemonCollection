package models

type Card struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Edition  string  `json:"edition"`
	Set      string  `json:"set"`
	Image    string  `json:"image"`
	Grade    string  `json:"grade"` // This should be a string
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
}
