import React from 'react';
import { Container, Grid, Card, CardMedia, CardContent, Typography, Button } from '@mui/material';
import '../styles/Shop.css';
import { fetchProducts, fetchProductByID } from '../utils/apiUtils';
import { useState, useEffect } from 'react';
import useRouteLoading from '../hooks/useRouteLoading';
import { ClipLoader } from 'react-spinners';
import { addToCart, getCart, getCartCount, getCartTotal, removeFromCart } from '../utils/cartUtils';
import { AuthContext } from '../context/AuthContext';
import config from '../config';
const verbose = config.verbose;

const Shop = () => {
  const [products, setProducts] = useState([]);
  const loading = useRouteLoading();
  const { id } = React.useContext(AuthContext);

  useEffect(() => {
    fetchProducts().then(products => {
      if (verbose) console.log('Fetched products:', products);
      setProducts(products);
    });
  }, []);

  if (loading) {
    return (
      <div className="spinner-container">
        <ClipLoader color="#ffffff" loading={loading} size={150} />
      </div>
    );
  }

  const handleAddToCart = async (product) => {
    if (verbose) console.log(`In Shop.js: Adding item to cart for user_id: ${id} - ProductID: ${product.id}, Quantity: 1`);
    await addToCart(id, product.id, 1);
  };

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
                <Button variant="contained" color="primary" className="shop-button" onClick={() => handleAddToCart(product)}>
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
