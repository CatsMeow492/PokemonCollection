package models

type Item struct {
	ID            string      `json:"id"`
	Name          string      `json:"name"`
	Edition       string      `json:"edition"`
	Set           string      `json:"set"`
	Image         string      `json:"image"`
	Grade         interface{} `json:"grade"`
	PurchasePrice float64     `json:"purchase_price"`
	Quantity      int         `json:"quantity"`
	Type          string      `json:"type"`
}

type Card Item
