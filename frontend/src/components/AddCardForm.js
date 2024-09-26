import React, { useState } from 'react';
import { Container, TextField, Button, Typography } from '@mui/material';
import '../styles/AddCardForm.css';

const AddCardForm = ({ onAddCard }) => {
  const [name, setName] = useState('');
  const [edition, setEdition] = useState('');
  const [grade, setGrade] = useState('');
  const [price, setPrice] = useState('');
  const [image, setImage] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newCard = { name, edition, grade, price, image };
    onAddCard(newCard);
    setName('');
    setEdition('');
    setGrade('');
    setPrice('');
    setImage('');
  };

  return (
    <Container className="add-card-form">
      <Typography variant="h5" component="h2" gutterBottom>
        Add New Card
      </Typography>
      <form onSubmit={handleSubmit}>
        <TextField
          label="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Edition"
          value={edition}
          onChange={(e) => setEdition(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Grade"
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Price"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          fullWidth
          margin="normal"
        />
        <TextField
          label="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
          fullWidth
          margin="normal"
        />
        <Button type="submit" variant="contained" color="primary">
          Add Card
        </Button>
      </form>
    </Container>
  );
};

export default AddCardForm;
