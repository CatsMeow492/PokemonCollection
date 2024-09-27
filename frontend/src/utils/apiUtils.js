import config from '../config';
const verbose = config;

export const fetchMarketPrice = async (cardName, edition, grade) => {
    const response = await fetch(`/api/market-price?card_name=${encodeURIComponent(cardName)}&edition=${encodeURIComponent(edition)}&grade=${encodeURIComponent(grade)}`);
    if (response.ok) {
        const data = await response.json();
        return data.market_price;
    } else {
        return null;
    }
};

export const fetchCards = async () => {
    const response = await fetch('/api/cards');
    if (!response.ok) {
        throw new Error('Failed to fetch cards');
    }
    return response.json();
};

export const processFetchedCards = (data, verbose) => {
    if (verbose) console.log('Fetched data:', data); // Log fetched data

    const totalCostSum = data.reduce((acc, card) => {
        const price = parseFloat(card.price.replace(/[^0-9.-]+/g, ""));
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