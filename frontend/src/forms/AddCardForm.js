import React, { useState, useEffect } from 'react';
import { Container, Button, Typography, Select, MenuItem, FormControl, InputLabel, Autocomplete, TextField } from '@mui/material';
import '../styles/AddCardForm.css';
import { addCard, fetchPokemonNames } from '../utils/apiUtils';
import config from '../config';

const AddCardForm = () => {
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');
  const [priceError, setPriceError] = useState('');
  const [set, setSet] = useState('');
  const [pokemonNames, setPokemonNames] = useState([]);
  const { verbose } = config;

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

  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form submission

    // Validate price
    const pricePattern = /^\d+(\.\d{1,2})?$/;
    if (!pricePattern.test(price)) {
      setPriceError('Please enter a valid dollar amount');
      return;
    } else {
      setPriceError('');
    }

    const newCard = { name, edition, grade, price, image, set };

    addCard(newCard);

    setName('');
    setEdition('');
    setGrade('');
    setPrice('');
    setImage('');
    setSet('');
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
          <InputLabel htmlFor="grade-select">Grade</InputLabel>
          <Select
            id="grade-select"
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
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
