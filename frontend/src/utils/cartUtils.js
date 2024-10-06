import config from '../config';
const verbose = config.verbose;

const API_BASE_URL = '/api'; // Adjust this if your API is hosted elsewhere

export const getCart = async (userId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}`);
        if (!response.ok) throw new Error('Failed to fetch cart');
        return await response.json();
    } catch (error) {
        console.error('Error fetching cart:', error);
        return [];
    }
};

export const addToCart = async (userId, productId, quantity) => {
    if (verbose) console.log(`In CartUtils.js: Adding item to cart for user_id: ${userId} - ProductID: ${productId}, Quantity: ${quantity}`);
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}/add`, {
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
        const response = await fetch(`${API_BASE_URL}/cart/${userId}/remove`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ itemId }),
        });
        if (!response.ok) throw new Error('Failed to remove item from cart');
        return await response.json();
    } catch (error) {
        console.error('Error removing from cart:', error);
        return null;
    }
};

export const updateCartItem = async (userId, item) => {
    try {
        const response = await fetch(`${API_BASE_URL}/cart/${userId}/update`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(item),
        });
        if (!response.ok) throw new Error('Failed to update cart item');
        return await response.json();
    } catch (error) {
        console.error('Error updating cart item:', error);
        return null;
    }
};

export const getCartTotal = (cart) => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
};

export const getCartCount = (cart) => {
    return cart.reduce((count, item) => count + item.quantity, 0);
};
