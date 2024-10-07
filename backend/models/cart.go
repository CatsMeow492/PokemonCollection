package models

type CartItem struct {
	ProductID int    `json:"ProductID"`
	Quantity  int    `json:"Quantity"`
	Name      string `json:"Name"`
	Price     string `json:"Price"`
	Image     string `json:"Image"`
}

type Cart struct {
	UserID string     `json:"user_id"`
	Items  []CartItem `json:"items"`
}
