package models

type Collection struct {
	Name     string  `json:"name"`
	Edition  string  `json:"edition"`
	Set      string  `json:"set"`
	Grade    string  `json:"grade"`
	Price    float64 `json:"price"`
	Image    string  `json:"image"`
	Quantity int     `json:"quantity"`
	ID       string  `json:"id"`
}
