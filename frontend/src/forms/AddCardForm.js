import React, { useState, useEffect } from 'react';
import { Container, Button, Typography, Select, MenuItem, FormControl, InputLabel, Autocomplete, TextField } from '@mui/material';
import '../styles/AddCardForm.css';
import { addCard, fetchPokemonNames } from '../utils/apiUtils';
import { AuthContext } from '../context/AuthContext';
import { useContext } from 'react';
import config from '../config';

const AddCardForm = ({ onCardAdded, setAddCardModalOpen, collections }) => {
  const { id } = useContext(AuthContext);
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [priceError, setPriceError] = useState('');
  const [set, setSet] = useState('');
  const [pokemonNames, setPokemonNames] = useState([]);
  const { verbose } = config;
  const [selectedCollection, setSelectedCollection] = useState('');
  useEffect(() => {
    fetchPokemonNames()
      .then(data => {
        if (verbose) console.log(data);
        setPokemonNames(data);
      })
      .catch(error => {
        console.error('Error fetching pokemon names:', error);
      });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newCard = { 
      name, 
      edition, 
      grade, 
      price: parseFloat(price) || 0, 
      image, 
      set, 
      collectionName: selectedCollection 
    };
    try {
      const addedCard = await addCard(newCard, id, selectedCollection);
      console.log('Card added successfully:', addedCard);
      setAddCardModalOpen(false); // Close the modal after adding the card
      onCardAdded(addedCard); // Update the parent component
      // Reset form fields
      setName('');
      setEdition('');
      setGrade('');
      setPrice('');
      setImage('');
      setSet('');
      setSelectedCollection('');
    } catch (error) {
      console.error('Failed to add card:', error);
      // Optionally, you can set an error state here to display to the user
    }
  };

  const setAndEditions = require('../data/sets_and_editions.json');
  const sets = Array.from(setAndEditions).map((set) => ({ label: set.name, value: set.id }));
  const editions = Array.from(setAndEditions).map((edition) => ({ label: edition.name, value: edition.id }));

  return (
    <Container className="add-card-form">
      <Typography variant="h5" component="h2" gutterBottom>
        Add New Card
      </Typography>
      <form onSubmit={handleSubmit}>
        <Autocomplete
          id="pokemon-name-select"
          options={pokemonNames}
          getOptionLabel={(option) => option}
          renderInput={(params) => <TextField {...params} label="Pokémon Name" />}
          value={name}
          onChange={(e, newValue) => setName(newValue || '')}
          fullWidth
          margin="normal"
        />
        <Autocomplete
          id="editions-select"
          options={editions}
          getOptionLabel={(option) => option.label}
          renderInput={(params) => <TextField {...params} label="Edition" />}
          onChange={(e, newValue) => {
            setEdition(newValue ? newValue.label : '');
            const selectedSet = setAndEditions.find((item) => item.name === (newValue ? newValue.label : ''));
            setSet(selectedSet ? selectedSet.id : '');
          }}
          fullWidth
          margin="normal"
        />
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel htmlFor="collection-select">Collection</InputLabel>
          <Select
            id="collection-select"
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            label="Collection"
          >
            {collections.map((collectionName) => (
              <MenuItem key={collectionName} value={collectionName}>
                {collectionName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal" variant="outlined">
          <InputLabel htmlFor="grade-select">Grade</InputLabel>
          <Select
            id="grade-select"
            value={grade}
            onChange={(e) => setGrade(e.target.value.toString())}
            label="Grade"
          >
            <MenuItem value="Ungraded">Ungraded</MenuItem>
            {[...Array(10).keys()].map((num) => (
              <MenuItem key={num + 1} value={num + 1}>
                {num + 1}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <TextField
          label="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          margin="normal"
          error={!!priceError}
          helperText={priceError}
        />
        <Button type="submit" variant="contained" color="primary" style={{ margin: '1rem' }}>
          Add Card
        </Button>
      </form>
    </Container>
  );
};

export default AddCardForm;
