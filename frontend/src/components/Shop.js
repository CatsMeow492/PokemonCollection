import React from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Button } from '@mui/material';
import '../styles/Shop.css';

// Dummy data
const products = [
  { id: 1, name: 'Poké Ball', price: '$10', image: 'path/to/pokeball.jpg' },
  { id: 2, name: 'Great Ball', price: '$20', image: 'path/to/greatball.jpg' },
  { id: 3, name: 'Ultra Ball', price: '$30', image: 'path/to/ultraball.jpg' },
  { id: 4, name: 'Master Ball', price: '$100', image: 'path/to/masterball.jpg' },
  { id: 5, name: 'Potion', price: '$5', image: 'path/to/potion.jpg' },
];

const Shop = () => {
  return (
    <Container>
      <Typography variant="h4" component="h1" className="title" style={{ color: 'aliceblue' }} gutterBottom>
      PokéMart
      </Typography>
      <Grid container spacing={3}>
        {products.map(product => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={product.id}>
            <Card className="shop-card">
              <CardMedia
                component="img"
                alt={product.name}
                height="140"
                image={product.image}
                title={product.name}
              />
              <CardContent>
                <Typography gutterBottom variant="h5" component="h2">
                  {product.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  {product.price}
                </Typography>
                <Button variant="contained" color="primary" className="shop-button">
                  Add to Cart
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Container>
  );
};

export default Shop;
