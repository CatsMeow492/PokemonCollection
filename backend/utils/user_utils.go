package utils

import (
	"encoding/json"
	"errors"
	"io/ioutil"
	"os"

	"github.com/CatsMeow492/PokemonCollection/models"
)

const userDataFile = "users.json"

func SaveUser(user models.User) error {
	users, err := loadUsers()
	if err != nil {
		return err
	}

	users = append(users, user)
	return saveUsers(users)
}

func GetUserByUsername(username string) (models.User, error) {
	users, err := loadUsers()
	if err != nil {
		return models.User{}, err
	}

	for _, user := range users {
		if user.Username == username {
			return user, nil
		}
	}

	return models.User{}, errors.New("user not found")
}

func GetUserByEmail(email string) (models.User, error) {
	users, err := loadUsers()
	if err != nil {
		return models.User{}, err
	}

	for _, user := range users {
		if user.Email == email {
			return user, nil
		}
	}

	return models.User{}, errors.New("user not found")
}

func UpdateUser(user models.User) error {
	users, err := loadUsers()
	if err != nil {
		return err
	}

	for i, u := range users {
		if u.ID == user.ID {
			users[i] = user
			return saveUsers(users)
		}
	}

	return errors.New("user not found")
}

func DeleteUser(username string) error {
	users, err := loadUsers()
	if err != nil {
		return err
	}

	for i, user := range users {
		if user.Username == username {
			users = append(users[:i], users[i+1:]...)
			return saveUsers(users)
		}
	}

	return errors.New("user not found")
}

func GetUserByID(id string) (models.User, error) {
	users, err := loadUsers()
	if err != nil {
		return models.User{}, err
	}

	for _, user := range users {
		if user.ID == id {
			return user, nil
		}
	}

	return models.User{}, errors.New("user not found")
}

// Helper functions

func loadUsers() ([]models.User, error) {
	file, err := ioutil.ReadFile(userDataFile)
	if err != nil {
		if os.IsNotExist(err) {
			return []models.User{}, nil // Return an empty slice if the file does not exist
		}
		return nil, err
	}

	var users []models.User
	if err := json.Unmarshal(file, &users); err != nil {
		return nil, err
	}

	return users, nil
}

func saveUsers(users []models.User) error {
	data, err := json.Marshal(users)
	if err != nil {
		return err
	}

	return ioutil.WriteFile(userDataFile, data, 0644)
}
