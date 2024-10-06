import React, { useState, useEffect, useContext } from 'react';
import { 
  Container, 
  Typography, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  IconButton,
  Box
} from '@mui/material';
import { Add, Remove, Delete } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { getCart, updateCartItem, removeFromCart, getCartCount, getCartTotal } from '../utils/cartUtils';
import '../styles/Cart.css';
import { AuthContext } from '../context/AuthContext';
import config from '../config';
const verbose = config.verbose;

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);
  const navigate = useNavigate();
  const [cartCount, setCartCount] = useState(0);
  const [cartTotal, setCartTotal] = useState(0);
  const { id: userId } = useContext(AuthContext);
  
  useEffect(() => {
    if (userId) {
      fetchCart();
    }
  }, [userId]);

  const fetchCart = async () => {
    if (verbose) console.log('Fetching cart for user ID:', userId);
    if (userId) {
      const cart = await getCart(userId);
      if (verbose) console.log('Fetched cart:', cart);
      setCartItems(cart);
      setCartCount(getCartCount(cart));
      setCartTotal(getCartTotal(cart));
    }
  };

  const handleQuantityChange = async (itemId, newQuantity) => {
    if (userId) {
      await updateCartItem(userId, itemId, newQuantity);
      fetchCart();
    }
  };

  const handleRemoveItem = async (itemId) => {
    if (userId) {
      await removeFromCart(userId, itemId);
      fetchCart();
    }
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
  };

  const formatPrice = (price) => {
    const numPrice = Number(price);
    return isNaN(numPrice) ? '0.00' : numPrice.toFixed(2);
  };

  return (
    <Container className="cart-container">
      <Typography variant="h4" className="cart-title">Your Cart</Typography>
      {cartItems.length === 0 ? (
        <Box className="empty-cart">
          <Typography variant="h6">Your cart is empty</Typography>
          <Button variant="contained" color="primary" onClick={() => navigate('/shop')}>
            Continue Shopping
          </Button>
        </Box>
      ) : (
        <>
          <TableContainer component={Paper} className="cart-table">
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Product</TableCell>
                  <TableCell align="right">Price</TableCell>
                  <TableCell align="center">Quantity</TableCell>
                  <TableCell align="right">Total</TableCell>
                  <TableCell align="center">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {cartItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell component="th" scope="row">
                      <Box className="product-info">
                        <img src={item.image} alt={item.name} className="product-image" />
                        <Typography>{item.name}</Typography>
                      </Box>
                    </TableCell>
                    <TableCell align="right">${formatPrice(item.price)}</TableCell>
                    <TableCell align="center">
                      <Box className="quantity-control">
                        <IconButton onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>
                          <Remove />
                        </IconButton>
                        <Typography>{item.quantity}</Typography>
                        <IconButton onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>
                          <Add />
                        </IconButton>
                      </Box>
                    </TableCell>
                    <TableCell align="right">${formatPrice(Number(item.price) * item.quantity)}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => handleRemoveItem(item.id)} color="error">
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Box className="cart-summary">
            <Typography variant="h5">Total: ${calculateTotal()}</Typography>
            <Button variant="contained" color="primary" className="checkout-button">
              Proceed to Checkout
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
};

export default Cart;
