import React from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Button } from '@mui/material';
import '../styles/Shop.css';
import { fetchProducts, fetchProductByID } from '../utils/apiUtils';
import { useState, useEffect } from 'react';
import useRouteLoading from '../hooks/useRouteLoading';
import { ClipLoader } from 'react-spinners';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const loading = useRouteLoading();

  useEffect(() => {
    fetchProducts().then(setProducts);
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <ClipLoader color="#ffffff" loading={loading} size={150} />
      </div>
    );
  }

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
                <Typography gutterBottom variant="h5" component="h2" style={{ color: 'black', fontWeight: 'bold' }}>
                  {product.name}
                </Typography>
                <Typography variant="body2" color="textSecondary" component="p">
                  {product.description}
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
