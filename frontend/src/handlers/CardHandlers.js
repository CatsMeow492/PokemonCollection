import { 
    updateCardQuantity, 
    updateItemQuantity, 
    removeItemFromCollection,
    fetchMarketPrice
} from '../utils/apiUtils';  // Adjust the import path as needed

export const handleIncrementQuantity = async (item, userId, setCardsWithMarketPrice, verbose = false) => {
    if (verbose) {
        console.log("Incrementing quantity for item: ", item);
    }
    if (!item || !item.id) {
        console.error('Item ID is undefined or item data is missing:', item);
        return;
    }
    try {
        let updatedItem;
        if (item.type === 'card') {
            updatedItem = await updateCardQuantity(item.id, item.quantity + 1, item.collectionName, userId);
        } else if (item.type === 'item') {
            updatedItem = await updateItemQuantity(item.id, item.quantity + 1, item.collectionName, userId);
        }
        setCardsWithMarketPrice(prevCards => 
            prevCards.map(c => c.id === item.id ? { ...c, ...updatedItem, quantity: c.quantity + 1 } : c)
        );
    } catch (error) {
        console.error('Failed to increment quantity: ', error);
    }
};

export const handleDecrementQuantity = async (item, userId, setCardsWithMarketPrice, verbose = false) => {
    if (verbose) {
        console.log("Decrementing quantity for item: ", item);
    }
    if (!item || !item.id) {
        console.error('Item ID is undefined or item data is missing:', item);
        return;
    }
    try {
        let updatedItem;
        if (item.type === 'card') {
            updatedItem = await updateCardQuantity(item.id, item.quantity - 1, item.collectionName, userId);
        } else if (item.type === 'item') {
            updatedItem = await updateItemQuantity(item.id, item.quantity - 1, item.collectionName, userId);
        }
        setCardsWithMarketPrice(prevCards => 
            prevCards.map(c => c.id === item.id ? { ...c, ...updatedItem, quantity: c.quantity - 1 } : c)
        );
    } catch (error) {
        console.error('Failed to decrement quantity: ', error);
    }
};

export const handleRemoveItemFromCollection = async (userId, collectionName, itemId, setCardsWithMarketPrice) => {
    try {
        await removeItemFromCollection(userId, collectionName, itemId);
        setCardsWithMarketPrice(prevCards => prevCards.filter(item => item.id !== itemId));
    } catch (error) {
        console.error('Failed to remove item from collection:', error);
    }
};

export const updateCardsWithMarketPrice = async (displayedCards, setCardsWithMarketPrice, setLoading, verbose = false) => {
    setLoading(true);
    if (verbose) {
        console.log('Cards before fetching market price:', displayedCards);
    }
    const updatedCards = await Promise.all(displayedCards.map(async (item) => {
        const marketPrice = await fetchMarketPrice(item.name, item.id, item.edition, item.grade, item.type);
        return { ...item, marketPrice: marketPrice || item.purchase_price };
    }));
    setCardsWithMarketPrice(updatedCards);
    if (verbose) {
        console.log('Cards after fetching market price:', updatedCards);
    }
    setLoading(false);
};

