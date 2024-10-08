package utils

import (
	"encoding/json"
	"io/ioutil"
	"log"

	"github.com/CatsMeow492/PokemonCollection/models"
)

// TODO: This will eventually be replaced with a database
// ReadCollectionFile reads the collection file and returns the data
func ReadCollectionFile() (models.CollectionData, error) {
	var data models.CollectionData
	file, err := ioutil.ReadFile("collection.json")
	if err != nil {
		return data, err
	}

	err = json.Unmarshal(file, &data)
	if err != nil {
		return data, err
	}

	return data, nil
}

// WriteCollectionFile writes the provided data to the collection file
func WriteCollectionFile(data models.CollectionData) error {
	log.Printf("WriteCollectionFile: Writing data to collection file: %+v", data)
	jsonData, err := json.MarshalIndent(data, "", "  ")
	if err != nil {
		log.Printf("WriteCollectionFile: Error marshaling data: %v", err)
		return err
	}

	err = ioutil.WriteFile("collection.json", jsonData, 0644)
	if err != nil {
		log.Printf("WriteCollectionFile: Error writing file: %v", err)
		return err
	}

	log.Printf("WriteCollectionFile: Successfully wrote data to collection file")
	return nil
}
