import { 
    updateCardQuantity, 
    updateItemQuantity, 
    removeItemFromCollection,
    fetchMarketPrice
} from '../utils/apiUtils';  // Adjust the import path as needed
import config from '../config';
const verbose = config;

export const handleIncrementQuantity = async (item, userId, cardsWithMarketPrice, setCardsWithMarketPrice) => {
    if (verbose) {
        console.log("Incrementing quantity for item: ", item);
    }
    if (!item || !item.id || !userId) {
        console.error('Invalid data for increment:', { item, userId });
        return;
    }
    const newQuantity = (parseInt(item.quantity) || 0) + 1;
    try {
        let updatedItem;
        if (item.type === 'card') {
            updatedItem = await updateCardQuantity(item.id, newQuantity, item.collectionName, userId);
        } else if (item.type === 'item') {
            updatedItem = await updateItemQuantity(item.id, newQuantity, item.collectionName, userId);
        }
        const updatedCards = cardsWithMarketPrice.map(c => 
            c.id === item.id ? { ...c, ...updatedItem, quantity: newQuantity } : c
        );
        setCardsWithMarketPrice(updatedCards);
    } catch (error) {
        console.error('Failed to increment quantity: ', error);
    }
};

export const handleDecrementQuantity = async (item, userId, cardsWithMarketPrice, setCardsWithMarketPrice) => {
    if (verbose) {
        console.log("Decrementing quantity for item: ", item);
    }
    if (!item || !item.id || !userId) {
        console.error('Invalid data for decrement:', { item, userId });
        return;
    }
    const newQuantity = Math.max(1, (parseInt(item.quantity) || 1) - 1);
    try {
        let updatedItem;
        if (item.type === 'card') {
            updatedItem = await updateCardQuantity(item.id, newQuantity, item.collectionName, userId);
        } else if (item.type === 'item') {
            updatedItem = await updateItemQuantity(item.id, newQuantity, item.collectionName, userId);
        }
        const updatedCards = cardsWithMarketPrice.map(c => 
            c.id === item.id ? { ...c, ...updatedItem, quantity: newQuantity } : c
        );
        setCardsWithMarketPrice(updatedCards);
    } catch (error) {
        console.error('Failed to decrement quantity: ', error);
    }
};

export const handleRemoveItemFromCollection = async (userId, collectionName, itemId, setCards) => {
    try {
        await removeItemFromCollection(userId, collectionName, itemId);
        if (typeof setCards === 'function') {
            setCards(prevCards => prevCards.filter(item => item.id !== itemId));
            console.log(`Item ${itemId} removed successfully from ${collectionName}`);
        } else {
            console.error('setCards is not a function:', setCards);
        }
    } catch (error) {
        console.error('Failed to remove item from collection:', error);
    }
};

export const updateCardsWithMarketPrice = async (cardsWithMarketPrice = [], setCardsWithMarketPrice) => {
    if (verbose) {
        console.log('Cards before fetching market price:', cardsWithMarketPrice);
    }

    // Ensure cardsWithMarketPrice is an array before mapping over it
    if (!Array.isArray(cardsWithMarketPrice)) {
        console.error('cardsWithMarketPrice is not an array:', cardsWithMarketPrice);
        return;
    }

    const updatedCards = await Promise.all(cardsWithMarketPrice.map(async (item) => {
        try {
            const marketPrice = await fetchMarketPrice(item.name, item.id, item.edition, item.grade, item.type);
            return { ...item, marketPrice: marketPrice };
        } catch (error) {
            console.error('Failed to fetch market price for item:', item);
            return { ...item, marketPrice: null };  // Handle error by keeping the item with no marketPrice
        }
    }));

    setCardsWithMarketPrice(updatedCards);

    if (verbose) {
        console.log('Cards after fetching market price:', updatedCards);
    }
};
