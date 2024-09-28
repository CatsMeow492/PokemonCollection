package services

import (
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/CatsMeow492/PokemonCollection/data"

	"github.com/PuerkitoBio/goquery"
)

func GetMarketPrice(cardName, cardId, edition, grade string) (float64, error) {
	// Load existing market data
	store, err := data.LoadMarketData()
	if err != nil {
		return 0, err
	}

	// Fetch new price
	price, err := fetchMarketPrice(cardName, cardId, edition, grade)
	if err != nil {
		return 0, err
	}

	// Add new data
	newData := data.MarketData{
		CardID:    cardId,
		Price:     price,
		FetchedAt: time.Now(),
	}
	store.AddMarketData(newData)

	// Save updated market data
	err = data.SaveMarketData(store)
	if err != nil {
		fmt.Printf("Error saving market data: %v\n", err)
	}

	return price, nil
}

func fetchMarketPrice(cardName, cardId, edition, grade string) (float64, error) {
	// Use all parameters in the search query
	searchQuery := fmt.Sprintf("%s %s %s %s", cardName, cardId, edition, grade)
	url := fmt.Sprintf("https://www.ebay.com/sch/i.html?_nkw=%s&_ipg=100&_sop=13", strings.ReplaceAll(searchQuery, " ", "+"))

	res, err := http.Get(url)
	if err != nil {
		return 0, err
	}
	defer res.Body.Close()

	if res.StatusCode != 200 {
		return 0, fmt.Errorf("failed to fetch data: %s", res.Status)
	}

	doc, err := goquery.NewDocumentFromReader(res.Body)
	if err != nil {
		return 0, err
	}

	var prices []float64
	doc.Find(".s-item__price").Each(func(i int, s *goquery.Selection) {
		priceText := s.Text()
		priceText = strings.ReplaceAll(priceText, "$", "")
		priceText = strings.ReplaceAll(priceText, ",", "")
		price, err := strconv.ParseFloat(priceText, 64)
		if err == nil {
			prices = append(prices, price)
		}
	})

	if len(prices) == 0 {
		return 0, fmt.Errorf("market price not found")
	}

	var total float64
	for _, price := range prices {
		total += price
	}
	return total / float64(len(prices)), nil
}
