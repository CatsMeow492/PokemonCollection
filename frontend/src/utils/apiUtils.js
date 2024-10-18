import config from '../config';
const verbose = config;
// Load base url from .env
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:8000';

export const fetchMarketPrice = async (name, id, edition, grade, type) => {
    const params = new URLSearchParams({
        name: name || '',
        id: id || '',
        edition: edition || '',
        grade: grade || '',
        type: type || ''
    });
    
    try {
        // Change this line to match your backend route
        const response = await fetch(`/api/item-market-price?${params}`);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to fetch market value: ${response.status} ${response.statusText} - ${errorText}`);
        }
        const data = await response.json();
        if (verbose) console.log('Fetched market value:', data);
        if (verbose) console.log('Fetched market value:', data.market_price);
        return data.market_price; // Change this to match your backend response structure
    } catch (error) {
        console.error('Error fetching market value:', error);
        return null; // Return null instead of throwing, so we can continue processing other items
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
    const verbose = config.verbose;
    if (verbose) console.log(`Fetching collections for user ID: ${userID}`);
    
    try {
        const response = await fetch(`/api/collections/${userID}`);
        if (!response.ok) {
            throw new Error('Failed to fetch collections');
        }
        
        const data = await response.json();
        if (verbose) {
            console.log('Collections fetched:', data);
            // Log the price of each card in each collection
            data.forEach((collection, index) => {
                console.log(`Collection ${index + 1}:`);
                collection.cards.forEach(card => {
                    console.log(`Card: ${card.name}, Price: ${card.price}`);
                });
            });
        }
        return data;
    } catch (error) {
        console.error('Error fetching collections:', error);
        throw error;
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
    if (verbose) console.log('Adding card with collection:', card, userId, collectionName);
    const payload = {
        user_id: userId,
        collection_name: collectionName,
        card: {
            ...card,
            purchase_price: card.price || card.purchase_price, // Use price if available, otherwise use purchase_price
            grade: card.grade.toString() // Ensure grade is a string
        }
    };
    
    // Remove the 'price' field if it exists
    if (payload.card.price) {
        delete payload.card.price;
    }
    
    if (verbose) console.log('Payload being sent:', JSON.stringify(payload, null, 2));
    
    const response = await fetch('/api/cards/collection', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const responseText = await response.text();
    if (verbose) console.log('Full server response:', responseText);

    if (!response.ok) {
        throw new Error(`Failed to add card to collection: ${responseText}`);
    }

    return JSON.parse(responseText);
};

// You can keep the original addCard function as a wrapper if you want to maintain backwards compatibility
export const addCard = async (card, userId, collectionName) => {
    const response = await addCardWithCollection(card, userId, collectionName);
    return response; // This should be the newly added card
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

export const updateItemQuantity = async (itemId, newQuantity, collectionName, userId) => {
    console.log(`Updating quantity for item with ID: ${itemId} to ${newQuantity} in collection: ${collectionName} for user: ${userId}`);
    const response = await fetch(`${API_BASE_URL}/api/items/quantity`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            user_id: userId,
            collection_name: collectionName,
            item_id: itemId,
            quantity: newQuantity
        }),
    });

    console.log('Response status:', response.status);
    console.log('Response headers:', response.headers);

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to update item quantity: ${errorText}`);
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

export const addItemToCollection = async (userId, name, grade, edition, collectionName, purchasePrice) => {
    const url = `/api/items/${userId}/${encodeURIComponent(collectionName)}`;
    const payload = {
        name,
        grade: grade.toString(),
        edition,
        purchase_price: parseFloat(purchasePrice) || 0, // Changed from purchasePrice to price to match backend expectation
        set: '',
        image: '',
        quantity: 1,
        type: 'Item'
    };
    
    if (verbose) console.log('Payload being sent to backend:', payload);

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Failed to add item: ${response.status} ${response.statusText}. ${errorText}`);
    }
    
    const responseData = await response.json();
    if (verbose) console.log('Item added (response from backend):', responseData);
    return responseData;
};

export const removeItemFromCollection = async (userId, collectionName, itemId) => {
    const encodedCollectionName = encodeURIComponent(collectionName);
    const encodedItemId = encodeURIComponent(itemId);
    if (verbose) console.log(`Removing item from collection: ${userId}, ${collectionName}, ${itemId}`);
    const response = await fetch(`${API_BASE_URL}/api/items/${userId}/${encodedCollectionName}/${encodedItemId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        throw new Error('Failed to remove item from collection');
    }

    return response.json();
};

export const fetchItemMarketPrice = async (itemName, itemEdition, grade) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/item-market-price?item_name=${encodeURIComponent(itemName)}&item_edition=${encodeURIComponent(itemEdition)}&grade=${encodeURIComponent(grade)}`);
        if (!response.ok) {
            throw new Error('Failed to fetch item market price');
        }
        const data = await response.json();
        return data.market_price;
    } catch (error) {
        console.error('Error fetching item market price:', error);
        return null;
    }
};

export const fetchCardMarketData = async (cardId) => {
    try {
        const response = await fetch(`${API_BASE_URL}/api/card-market-data/${cardId}`);
        if (!response.ok) {
            throw new Error('Failed to fetch card market data');
        }
        const data = await response.json();
        if (verbose) console.log('Card market data:', data);
        return data;
    } catch (error) {
        console.error('Error fetching card market data:', error);
        return null;
    }
};









