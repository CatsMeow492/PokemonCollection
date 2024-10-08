package models

type Item struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Edition  string  `json:"edition"`
	Grade    string  `json:"grade"`
	Price    float64 `json:"price"`
	Quantity int     `json:"quantity"`
}
