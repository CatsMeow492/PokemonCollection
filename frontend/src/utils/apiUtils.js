import config from '../config';
const verbose = config;

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
        return data.market_price;
    } catch (error) {
        console.error('Error fetching market price:', error);
        return null;
    }
};

export const fetchCardsByUserID = async (userID) => {
    if (verbose) console.log(`Fetching cards for user ID: ${userID}`);
    const response = await fetch(`/api/cards?user_id=${userID}`);
    if (!response.ok) {
        throw new Error('Failed to fetch cards');
    }
    return response.json();
};

export const fetchCollections = async (userID) => {
    const response = await fetch(`/api/collections/${userID}`);
    if (!response.ok) {
        throw new Error('Failed to fetch collections');
    }
    return response.json();
};

export const processFetchedCards = (data, verbose) => {
    if (verbose) console.log('Fetched data:', data); // Log fetched data

    const totalCostSum = data.reduce((acc, card) => {
        // Ensure card.price is treated as a number
        const price = parseFloat(card.price) || 0;
        if (verbose) console.log(`Card price: ${card.price}, Parsed price: ${price}`); // Log each card's price
        return acc + (isNaN(price) ? 0 : price);
    }, 0);

    if (verbose) console.log('Total Cost Sum:', totalCostSum); // Log total cost sum

    return { totalCostSum, cards: data };
};

export const addCard = async (card) => {
    const response = await fetch('/api/cards', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(card),
    });

    if (!response.ok) {
        throw new Error('Failed to add card');
    }

    return response.json();
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

export const updateCardQuantity = async (cardId, newQuantity) => {
    if (verbose) console.log(`Updating quantity for card with ID: ${cardId} to ${newQuantity}`);
    const response = await fetch(`/api/cards/quantity?id=${cardId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ quantity: newQuantity }),
    });

    if (!response.ok) {
        throw new Error('Failed to update card quantity');
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