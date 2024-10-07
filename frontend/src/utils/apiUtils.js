import config from '../config';
const verbose = config;
// Load base url from .env
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const fetchMarketPrice = async (cardName, cardId, edition, grade) => {
    try {
        const url = `/api/market-price?card_name=${encodeURIComponent(cardName)}&card_id=${encodeURIComponent(cardId)}&edition=${encodeURIComponent(edition)}&grade=${encodeURIComponent(grade)}`;
        console.log('Fetching market price from:', url);
        const response = await fetch(url);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch market price: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        if (verbose) console.log('Market price data:', data);
        return data.market_price;
    } catch (error) {
        console.error('Error fetching market price:', error);
        return null;
    }
};

export const fetchCardsByUserID = async (userID) => {
    if (verbose) console.log(`Fetching cards for user ID: ${userID}`);
    try {
        const response = await fetch(`/api/cards?user_id=${userID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch cards');
        }
        const data = await response.json();
        if (verbose) console.log('Fetched cards:', data);
        return data || []; // Return an empty array if data is null or undefined
    } catch (error) {
        console.error('Error fetching cards:', error);
        return []; // Return an empty array on error
    }
};

export const fetchCollectionsByUserID = async (userID) => {
    const verbose = config.verbose; // Ensure verbose is defined
    if (verbose) console.log(`Fetching collections for user ID: ${userID}`);
    
    try {
        const response = await fetch(`/api/collections/${userID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        
        // Ensure response.json() is called only once
        const data = await response.json();
        if (verbose) console.log('Collections fetched:', data);
        return data;
    } catch (error) {
        console.error('Error fetching collections:', error);
        throw error; // Re-throw the error to handle it in the calling function
    }
};

export const fetchCollectionByUserIDandCollectionName = async (userID, collectionName) => {
    const response = await fetch(`/api/collections/${userID}/${collectionName}`);
    if (!response.ok) {
        throw new Error('Failed to fetch collection');
    }
    return response.json();
};

export const processFetchedCards = (data, verbose) => {
    if (!data) {
        console.error('No data to process');
        return { totalCostSum: 0, cards: [] }; // Return default values if data is null or undefined
    }

    if (verbose) console.log('Fetched data:', data);

    const totalCostSum = data.reduce((acc, card) => {
        const price = parseFloat(card.price) || 0;
        if (verbose) console.log(`Card price: ${card.price}, Parsed price: ${price}`);
        return acc + (isNaN(price) ? 0 : price);
    }, 0);

    if (verbose) console.log('Total Cost Sum:', totalCostSum);

    return { totalCostSum, cards: data };
};

// Function to add a card with just userId (uses default collection)
export const addCardWithUserId = async (card, userId) => {
    if (verbose) console.log(`Adding card for user: ${userId}, ${JSON.stringify(card)}`);
    const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            card: card
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to add card');
    }

    return response.json();
};

// Function to add a card with userId and collectionName
export const addCardWithCollection = async (card, userId, collectionName) => {
    if (verbose) console.log(`Adding card to collection: ${userId}, ${JSON.stringify(card)}, ${collectionName}`);
    const response = await fetch('/api/cards/collection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            collection_name: collectionName,
            card: card
        }),
    });

    if (!response.ok) {
        throw new Error('Failed to add card to collection');
    }

    return response.json();
};

// You can keep the original addCard function as a wrapper if you want to maintain backwards compatibility
export const addCard = async (card, userId, collectionName) => {
    if (collectionName) {
        return addCardWithCollection(card, userId, collectionName);
    } else {
        return addCardWithUserId(card, userId);
    }
};

export const fetchProducts = async () => {
    const response = await fetch('/api/products');
    if (!response.ok) {
        throw new Error('Failed to fetch products');
    }
    return response.json();
};

export const fetchProductByID = async (id) => {
    const response = await fetch(`/api/product/${id}`);
    if (!response.ok) {
        throw new Error('Failed to fetch product');
    }
    return response.json();
};

export const updateCardQuantity = async (cardId, newQuantity, collectionName, userId) => {
    console.log(`Updating quantity for card with ID: ${cardId} to ${newQuantity} in collection: ${collectionName} for user: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/cards/quantity`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            collection_name: collectionName,
            card_id: cardId,
            quantity: newQuantity
        }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to update card quantity: ${errorText}`);
    }

    return response.json();
};

export const fetchPokemonNames = async () => {
    const response = await fetch('/api/pokemon-names');
    if (!response.ok) {
        throw new Error('Failed to fetch pokemon names');
    }
    return response.json();
};

export const registerUser = async (username, password, email) => {
    if (verbose) console.log(`Registering user: ${username}, ${password}, ${email}`);
    const response = await fetch('/api/register', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password, email }),
    });

    if (!response.ok) {
        throw new Error('Failed to register user');
    }

    // Check if the response has a body
    const responseBody = await response.text();
    if (responseBody) {
        return JSON.parse(responseBody);
    }

    return {};
};

export const loginUser = async (username, password) => {
    const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
    });

    if (!response.ok) {
        throw new Error('Failed to login user');
    }

    const data = await response.json();
    console.log('Login response data:', data); // Add logging here
    if (verbose) console.log(`ID: ${data.id}`);
    return { token: data.token, username: data.username, profile_picture: data.profile_picture, id: data.id };
};

export const updateUserProfile = async (newUsername, newProfilePicture) => {
    const response = await fetch('/api/update-profile', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ username: newUsername, profilePicture: newProfilePicture }),
    });

    if (!response.ok) {
        throw new Error('Failed to update user profile');
    }

    return response.json();
};

export const createCollection = async (userId, collectionName) => {
    const verbose = config.verbose;
    if (verbose) console.log(`Creating collection '${collectionName}' for user ID: ${userId}`);

    try {
        const response = await fetch(`/api/collections/${userId}/${collectionName}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error('Failed to create collection');
        }

        const data = await response.json();
        if (verbose) console.log('Collection created:', data);
        return data;
    } catch (error) {
        console.error('Error creating collection:', error);
        throw error;
    }
};

export const deleteCollection = async (userId, collectionName) => {
    const verbose = config.verbose;
    if (verbose) console.log(`Deleting collection '${collectionName}' for user ID: ${userId}`);

    try {
        const response = await fetch(`/api/collections/${userId}/${collectionName}`, {
            method: 'DELETE',
        });

        if (!response.ok) {
            throw new Error('Failed to delete collection');
        }

        if (verbose) console.log(`Collection '${collectionName}' deleted for user ID: ${userId}`);
    } catch (error) {
        console.error('Error deleting collection:', error);
        throw error;
    }
};

export const removeCardFromCollection = async (userId, collectionName, cardId) => {
    const encodedCollectionName = encodeURIComponent(collectionName);
    if (verbose) console.log(`Removing card from collection: ${userId}, ${collectionName}, ${cardId}`);
    const response = await fetch(`${API_BASE_URL}/api/cards/remove/${userId}/${encodedCollectionName}/${cardId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to remove card from collection');
    }

    return response.json();
};
