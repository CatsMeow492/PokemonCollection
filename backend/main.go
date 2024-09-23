package main

import (
    "encoding/json"
    "net/http"
    "os"
    "github.com/gorilla/mux"
    "log"
    _ "github.com/joho/godotenv/autoload"
)

func getCards(w http.ResponseWriter, r *http.Request) {
    apiKey := os.Getenv("POKEMON_TCG_API_KEY")
    url := "https://api.pokemontcg.io/v2/cards?q=name:Haunter|name:Mew|name:Articuno|name:Moltres|name:Jolteon|name:Kangaskhan|name:Clefable|name:Flareon|name:Mr. Mime|name:Vaporeon|name:Lily Pad Mew|name:Gengar"

    req, _ := http.NewRequest("GET", url, nil)
    req.Header.Set("X-Api-Key", apiKey)

    client := &http.Client{}
    resp, err := client.Do(req)
    if err != nil {
        log.Fatalf("Error fetching data: %v", err)
    }
    defer resp.Body.Close()

    var result map[string]interface{}
    json.NewDecoder(resp.Body).Decode(&result)

    cards := []Card{}
    for _, cardData := range result["data"].([]interface{}) {
        card := cardData.(map[string]interface{})
        cards = append(cards, Card{
            Name:    card["name"].(string),
            Edition: card["set"].(map[string]interface{})["name"].(string),
            Grade:   "N/A", // Grade is not provided by the API
            Price:   "N/A", // Price is not provided by the API
            Image:   card["images"].(map[string]interface{})["large"].(string),
        })
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(cards)
}

func main() {
    r := mux.NewRouter()
    r.HandleFunc("/api/cards", getCards).Methods("GET")
    http.ListenAndServe(":8000", r)
}
