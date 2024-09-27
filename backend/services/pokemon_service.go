package services

import (
	"encoding/json"
	"fmt"
	"net/http"
	"sync"
	"time"

	"github.com/patrickmn/go-cache"
)

const pokemonAPI = "https://pokeapi.co/api/v2/pokemon?limit=1025"

var (
	pokemonCache       *cache.Cache
	pokemonCacheMutex  sync.Mutex
	pokemonLastUpdated time.Time
)

const pokemonCacheDuration = 7 * 24 * time.Hour

func init() {
	pokemonCache = cache.New(pokemonCacheDuration, 48*time.Hour) // Cache for 1 week, purge expired items every 2 days
}

func FetchPokemonNames() ([]string, error) {
	resp, err := http.Get(pokemonAPI)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("received non-200 response code: %d", resp.StatusCode)
	}

	var result struct {
		Results []struct {
			Name string `json:"name"`
		} `json:"results"`
	}
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, err
	}

	names := make([]string, len(result.Results))
	for i, pokemon := range result.Results {
		names[i] = pokemon.Name
	}

	return names, nil
}

func GetCachedPokemonNames() ([]string, error) {
	pokemonCacheMutex.Lock()
	defer pokemonCacheMutex.Unlock()

	if time.Since(pokemonLastUpdated) > pokemonCacheDuration {
		names, err := FetchPokemonNames()
		if err != nil {
			return nil, err
		}
		pokemonCache.Set("names", names, cache.DefaultExpiration)
		pokemonLastUpdated = time.Now()
	}

	if cachedNames, found := pokemonCache.Get("names"); found {
		return cachedNames.([]string), nil
	}

	return nil, fmt.Errorf("no cached data found")
}
