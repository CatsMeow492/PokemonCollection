package models

type CartItem struct {
	ProductID int    `json:"product_id"`
	Quantity  int    `json:"quantity"`
	Name      string `json:"name"`
	Price     string `json:"price"`
	Image     string `json:"image"`
}

type Cart struct {
	UserID string     `json:"user_id"`
	Items  []CartItem `json:"items"`
}
