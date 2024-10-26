import config from '../config';
const verbose = config.verbose;

const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;
console.log('API_BASE_URL in cartUtils:', process.env.REACT_APP_API_BASE_URL);

export const getCart = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch cart');
        if (verbose) console.log('Cart fetched successfully in cartUtils.js:', response);
        return await response.json();
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
};

export const addToCart = async (userId, productId, quantity) => {
    if (verbose) console.log(`In CartUtils.js: Adding item to cart for user_id: ${userId} - ProductID: ${productId}, Quantity: ${quantity}`);
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/add`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ProductID: productId,
                Quantity: quantity
            }),
        });
        if (!response.ok) throw new Error('Failed to add item to cart');
        return await response.json();
    } catch (error) {
        console.error('Error adding to cart:', error);
        return null;
    }
};

export const removeFromCart = async (userId, itemId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ProductID: itemId }),
        });
        if (!response.ok) throw new Error('Failed to remove item from cart');
        return await response.json();
    } catch (error) {
        console.error('Error removing from cart:', error);
        return null;
    }
};

export const updateCartItem = async (userId, itemId, newQuantity) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/cart/${userId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ ProductID: itemId, Quantity: newQuantity }),
        });
        if (!response.ok) throw new Error('Failed to update cart item');
        return await response.json();
    } catch (error) {
        console.error('Error updating cart item:', error);
        return null;
    }
};

export const getCartTotal = (cart) => {
    return cart.reduce((total, item) => {
        const price = typeof item.Price === 'string' 
            ? parseFloat(item.Price.replace('$', '')) 
            : (typeof item.price === 'number' ? item.price : 0);
        return total + price * (item.Quantity || item.quantity || 0);
    }, 0).toFixed(2);
};

export const getCartCount = (cart) => {
    return cart.reduce((count, item) => count + item.quantity, 0);
};
