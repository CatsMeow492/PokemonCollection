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
		ID:        cardId,
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

func GetItemMarketPrice(itemName, itemGrade string) (float64, error) {
	store, err := data.LoadMarketData()
	if err != nil {
		return 0, err
	}

	price, err := fetchMarketPrice(itemName, itemGrade, "", "")
	if err != nil {
		return 0, err
	}

	newData := data.MarketData{
		ID:        itemName,
		Price:     price,
		FetchedAt: time.Now(),
	}
	store.AddMarketData(newData)

	err = data.SaveMarketData(store)
	if err != nil {
		fmt.Printf("Error saving market data: %v\n", err)
	}

	return price, nil
}

func fetchMarketPrice(cardName, cardId, edition, grade string) (float64, error) {
	var searchQuery string
	if strings.ToLower(grade) == "ungraded" {
		searchQuery = fmt.Sprintf("%s %s %s -graded -psa -bgs -cgc", cardName, cardId, edition)
	} else {
		searchQuery = fmt.Sprintf("%s %s %s grade:%s", cardName, cardId, edition, grade)
	}

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
	doc.Find(".s-item__wrapper").Each(func(i int, s *goquery.Selection) {
		title := strings.ToLower(s.Find(".s-item__title").Text())
		priceText := s.Find(".s-item__price").Text()

		if strings.ToLower(grade) == "ungraded" {
			// For ungraded cards, exclude listings that mention grading
			if !strings.Contains(title, "graded") && !strings.Contains(title, "psa") &&
				!strings.Contains(title, "bgs") && !strings.Contains(title, "cgc") {
				price := parsePrice(priceText)
				if price > 0 {
					prices = append(prices, price)
				}
			}
		} else {
			// For graded cards, include only listings that mention the specific grade
			if strings.Contains(title, strings.ToLower(grade)) {
				price := parsePrice(priceText)
				if price > 0 {
					prices = append(prices, price)
				}
			}
		}
	})

	if len(prices) == 0 {
		return 0, fmt.Errorf("market price not found for %s", grade)
	}

	return calculateAveragePrice(prices), nil
}

func parsePrice(priceText string) float64 {
	priceText = strings.ReplaceAll(priceText, "$", "")
	priceText = strings.ReplaceAll(priceText, ",", "")
	price, err := strconv.ParseFloat(priceText, 64)
	if err != nil {
		return 0
	}
	return price
}

func calculateAveragePrice(prices []float64) float64 {
	if len(prices) == 0 {
		return 0
	}
	var total float64
	for _, price := range prices {
		total += price
	}
	return total / float64(len(prices))
}
