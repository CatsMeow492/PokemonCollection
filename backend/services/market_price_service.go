package services

import (
	"fmt"
	"log"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/CatsMeow492/PokemonCollection/database"
	"github.com/PuerkitoBio/goquery"
)

func GetMarketPrice(cardName, cardId, edition, grade string) (float64, error) {
	db := database.GetDB()

	var price float64
	var lastUpdated time.Time

	err := db.QueryRow(`
		SELECT price, last_updated
		FROM marketdata
		WHERE item_id = $1 OR (name = $2 AND edition = $3 AND grade = $4 AND type = 'Pokemon Card')
	`, cardId, cardName, edition, grade).Scan(&price, &lastUpdated)

	if err != nil || time.Since(lastUpdated) > 24*time.Hour {
		// If no data found or data is older than 24 hours, fetch new price
		newPrice, err := fetchMarketPrice(cardName, cardId, edition, grade)
		if err != nil {
			return 0, err
		}

		// Update or insert new price in the database
		_, err = db.Exec(`
			INSERT INTO marketdata (item_id, name, edition, grade, type, price, last_updated)
			VALUES ($1, $2, $3, $4, $5, $6, $7)
			ON CONFLICT (item_id) DO UPDATE
			SET price = $6, last_updated = $7
		`, cardId, cardName, edition, grade, "Pokemon Card", newPrice, time.Now())

		if err != nil {
			return 0, err
		}

		return newPrice, nil
	}

	return price, nil
}

func GetItemMarketPrice(itemName, itemGrade string) (float64, error) {
	db := database.GetDB()

	var price float64
	var lastUpdated time.Time

	err := db.QueryRow(`
		SELECT price, last_updated
		FROM marketdata
		WHERE name = $1 AND grade = $2 AND type = 'Item'
	`, itemName, itemGrade).Scan(&price, &lastUpdated)

	if err != nil || time.Since(lastUpdated) > 24*time.Hour {
		// If no data found or data is older than 24 hours, fetch new price
		newPrice, err := fetchMarketPrice(itemName, "", "", itemGrade)
		if err != nil {
			return 0, err
		}

		// Update or insert new price in the database
		_, err = db.Exec(`
			INSERT INTO marketdata (name, grade, type, price, last_updated)
			VALUES ($1, $2, $3, $4, $5)
			ON CONFLICT (name, grade, type) DO UPDATE
			SET price = $4, last_updated = $5
		`, itemName, itemGrade, "Item", newPrice, time.Now())

		if err != nil {
			return 0, err
		}

		return newPrice, nil
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

func FetchAndStoreMarketPrice(cardName, cardId, edition, grade string) (float64, error) {
	db := database.GetDB()

	var marketValue float64
	var lastUpdated time.Time

	err := db.QueryRow(`
        SELECT market_value, last_updated
        FROM marketdata
        WHERE item_id = $1
        ORDER BY last_updated DESC
        LIMIT 1
    `, cardId).Scan(&marketValue, &lastUpdated)

	if err != nil {
		log.Printf("Error querying existing market value for %s: %v", cardId, err)
	}

	if err != nil || time.Since(lastUpdated) > 24*time.Hour {
		log.Printf("Fetching new market value for %s", cardId)
		newMarketValue, err := fetchMarketPrice(cardName, cardId, edition, grade)
		if err != nil {
			log.Printf("Error fetching market value for %s: %v", cardId, err)
			return 0, err
		}

		log.Printf("New market value for %s: %f", cardId, newMarketValue)

		// Insert new market value in the database
		_, err = db.Exec(`
            INSERT INTO marketdata (item_id, name, edition, grade, type, market_value, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT (item_id) DO UPDATE
            SET market_value = $6, last_updated = $7
        `, cardId, cardName, edition, grade, "Pokemon Card", newMarketValue, time.Now())

		if err != nil {
			log.Printf("Error inserting/updating market value for %s: %v", cardId, err)
			return 0, err
		}

		return newMarketValue, nil
	}

	log.Printf("Using existing market value for %s: %f", cardId, marketValue)
	return marketValue, nil
}
