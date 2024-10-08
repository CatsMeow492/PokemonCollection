package services

import (
	"fmt"
	"log"

	"github.com/CatsMeow492/PokemonCollection/models"
	"github.com/CatsMeow492/PokemonCollection/utils"
)

func AddItemToCollection(userID, collectionName string, item models.Item) error {
	log.Printf("AddItemToCollection: Adding item %+v to collection %s for user %s", item, collectionName, userID)

	data, err := utils.ReadCollectionFile()
	if err != nil {
		return fmt.Errorf("error reading collection file: %v", err)
	}

	if data.User.ID != userID {
		return fmt.Errorf("user not found")
	}

	collectionFound := false
	for i, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			data.User.Collections[i].Items = append(data.User.Collections[i].Items, item)
			collectionFound = true
			log.Printf("Added item to existing collection: %+v", data.User.Collections[i])
			break
		}
	}

	if !collectionFound {
		newCollection := models.Collection{
			CollectionName: collectionName,
			Items:          []models.Item{item},
		}
		data.User.Collections = append(data.User.Collections, newCollection)
		log.Printf("Created new collection with item: %+v", newCollection)
	}

	if err := utils.WriteCollectionFile(data); err != nil {
		return fmt.Errorf("error writing to collection file: %v", err)
	}

	log.Printf("AddItemToCollection: Successfully added item %+v to collection %s", item, collectionName)
	return nil
}

func UpdateItemInCollection(userID, collectionName string, updatedItem models.Item) error {
	log.Printf("UpdateItemInCollection: Updating item %s in collection %s for user %s", updatedItem.ID, collectionName, userID)

	data, err := utils.ReadCollectionFile()
	if err != nil {
		return fmt.Errorf("error reading collection file: %v", err)
	}

	if data.User.ID != userID {
		return fmt.Errorf("user not found")
	}

	itemUpdated := false
	for i, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			for j, item := range collection.Items {
				if item.ID == updatedItem.ID {
					data.User.Collections[i].Items[j] = updatedItem
					itemUpdated = true
					break
				}
			}
		}
		if itemUpdated {
			break
		}
	}

	if !itemUpdated {
		return fmt.Errorf("item not found in collection")
	}

	if err := utils.WriteCollectionFile(data); err != nil {
		return fmt.Errorf("error writing to collection file: %v", err)
	}

	log.Printf("UpdateItemInCollection: Successfully updated item %s in collection %s", updatedItem.ID, collectionName)
	return nil
}

func RemoveItemFromCollection(userID, collectionName, itemID string) error {
	log.Printf("RemoveItemFromCollection: Removing item %s from collection %s for user %s", itemID, collectionName, userID)

	data, err := utils.ReadCollectionFile()
	if err != nil {
		return fmt.Errorf("error reading collection file: %v", err)
	}

	if data.User.ID != userID {
		return fmt.Errorf("user not found")
	}

	itemRemoved := false
	for i, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			for j, item := range collection.Items {
				if item.ID == itemID {
					data.User.Collections[i].Items = append(data.User.Collections[i].Items[:j], data.User.Collections[i].Items[j+1:]...)
					itemRemoved = true
					break
				}
			}
		}
		if itemRemoved {
			break
		}
	}

	if !itemRemoved {
		return fmt.Errorf("item not found in collection")
	}

	if err := utils.WriteCollectionFile(data); err != nil {
		return fmt.Errorf("error writing to collection file: %v", err)
	}

	log.Printf("RemoveItemFromCollection: Successfully removed item %s from collection %s", itemID, collectionName)
	return nil
}

func GetItemFromCollection(userID, collectionName, itemID string) (*models.Item, error) {
	log.Printf("GetItemFromCollection: Fetching item %s from collection %s for user %s", itemID, collectionName, userID)

	data, err := utils.ReadCollectionFile()
	if err != nil {
		return nil, fmt.Errorf("error reading collection file: %v", err)
	}

	if data.User.ID != userID {
		return nil, fmt.Errorf("user not found")
	}

	for _, collection := range data.User.Collections {
		if collection.CollectionName == collectionName {
			for _, item := range collection.Items {
				if item.ID == itemID {
					log.Printf("GetItemFromCollection: Successfully fetched item %s", itemID)
					return &item, nil
				}
			}
		}
	}

	return nil, fmt.Errorf("item not found in collection")
}
