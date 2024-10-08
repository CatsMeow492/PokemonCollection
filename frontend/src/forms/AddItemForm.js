import React, { useState } from 'react';
import { 
    TextField, 
    Button, 
    FormControl, 
    InputLabel, 
    Select, 
    MenuItem, 
    Container, 
    Typography, 
    Autocomplete 
} from '@mui/material';
import '../styles/AddItemForm.css';
import config from '../config';
const { verbose } = config;

const setAndEditions = require('../data/sets_and_editions.json');
const sets = Array.from(setAndEditions).map((set) => ({ label: set.name, value: set.id }));
const editions = Array.from(setAndEditions).map((edition) => ({ label: edition.name, value: edition.id }));

const AddItemForm = ({ onAddItem, collections }) => {
  const [itemName, setItemName] = useState('');
  const [edition, setEdition] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [selectedCollection, setSelectedCollection] = useState('');
  const [priceError, setPriceError] = useState('');
  const [sets, setSets] = useState(Array.from(setAndEditions).map((set) => ({ label: set.name, value: set.id })));
  const [editions, setEditions] = useState(Array.from(setAndEditions).map((edition) => ({ label: edition.name, value: edition.id })));
  const [set, setSet] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();

    // Validate price
    const pricePattern = /^\d+(\.\d{1,2})?$/;
    if (!pricePattern.test(price)) {
      setPriceError('Please enter a valid dollar amount');
      return;
    } else {
      setPriceError('');
    }

    const newItem = {
      name: itemName,
      edition,
      grade: grade === 'Ungraded' ? 'Ungraded' : parseInt(grade, 10),
      price: parseFloat(price) || 0,
      collectionName: selectedCollection
    };

    onAddItem(newItem);

    // Reset form
    setItemName('');
    setEdition('');
    setGrade('');
    setPrice('');
    setSelectedCollection('');
    if (verbose) console.log('Form submitted in AddItemForm.js with newItem:', newItem);
  };

  return (
    <Container className="add-item-form">
      <form onSubmit={handleSubmit}>
        <TextField
          label="Item Name"
          value={itemName}
          onChange={(e) => setItemName(e.target.value)}
          fullWidth
          margin="normal"
          required
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
        <FormControl fullWidth margin="normal">
          <InputLabel>Collection</InputLabel>
          <Select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
          >
            {collections.map((collection) => (
              <MenuItem key={collection.collectionName} value={collection.collectionName}>
                {collection.collectionName}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
        <FormControl fullWidth margin="normal">
          <InputLabel>Grade</InputLabel>
          <Select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
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
          required
        />
        <Button type="submit" variant="contained" color="primary" style={{ margin: '1rem 0' }}>
          Add Item
        </Button>
      </form>
    </Container>
  );
};

export default AddItemForm;
