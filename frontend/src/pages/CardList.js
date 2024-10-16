import React, { useState, useEffect, useContext, useRef } from 'react';
import {
    Container,
    Typography,
    Grid,
    Card,
    CardMedia,
    CardContent,
    IconButton,
    Button,
    TextField,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Badge
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ClearIcon from '@mui/icons-material/Clear';
import AddCardModal from '../modals/AddCardModal';
import ManageCollectionsModal from '../modals/ManageCollectionsModal';
import '../styles/CardList.css';
import {
    fetchMarketPrice,
    fetchCardsByUserID,
    processFetchedCards,
    addCard,
    updateCardQuantity,
    fetchCollectionsByUserID,
    createCollection,
    deleteCollection,
    removeCardFromCollection,
    addItemToCollection,
    removeItemFromCollection,
    fetchItemMarketPrice,
    updateItemQuantity
} from '../utils/apiUtils';
import ArrowCircleUpTwoToneIcon from '@mui/icons-material/ArrowCircleUpTwoTone';
import ArrowCircleDownTwoToneIcon from '@mui/icons-material/ArrowCircleDownTwoTone';
import useRouteLoading from '../hooks/useRouteLoading';
import { ClipLoader } from 'react-spinners';
import config from '../config';
import { AuthContext } from '../context/AuthContext';
import AddIcon from '@mui/icons-material/Add';
import SettingsIcon from '@mui/icons-material/Settings';
import AddItemModal from '../modals/AddItemModal';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import CardMarketData from './CardMarketData';

const CardList = () => {
    const routeLoading = useRouteLoading();
    const { id } = useContext(AuthContext); // Access id from AuthContext
    const [cards, setCards] = useState([]);
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]);
    const cardImageRefs = useRef([]);
    const { verbose } = config;
    const [addCardModalOpen, setAddCardModalOpen] = useState(false);
    const [manageCollectionsModalOpen, setManageCollectionsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [collections, setCollections] = useState([]);
    const [selectedCollection, setSelectedCollection] = useState('all');
    const [displayedCards, setDisplayedCards] = useState([]);
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);
    const navigate = useNavigate();

    const handleCollectionChange = (e) => {
        const collectionName = e.target.value;
        setSelectedCollection(collectionName);

        if (collectionName === 'all') {
            const allCards = collections.flatMap(collection =>
                (collection.cards || []).map(card => ({
                    ...card,
                    collectionName: collection.collection_name,
                    type: 'card'
                }))
            );
            const allItems = collections.flatMap(collection =>
                (collection.items || []).map(item => ({
                    ...item,
                    collectionName: collection.collection_name,
                    type: 'item'
                }))
            );
            setDisplayedCards([...allCards, ...allItems]);
        } else {
            const selectedCollectionData = collections.find(c => c.collection_name === collectionName);
            if (selectedCollectionData) {
                const collectionCards = (selectedCollectionData.cards || []).map(card => ({
                    ...card,
                    collectionName,
                    type: 'card'
                }));
                const collectionItems = (selectedCollectionData.items || []).map(item => ({
                    ...item,
                    collectionName,
                    type: 'item'
                }));
                setDisplayedCards([...collectionCards, ...collectionItems]);
            }
        }
    };

    useEffect(() => {
        if (!id) {
            console.error('User ID is undefined');
            return;
        }

        setLoading(true);
        fetchCollectionsByUserID(id)
            .then(data => {
                setCollections(data || []);
                if (verbose) {
                    console.log('Set Collections to: ', data);
                    // Log the price of each card in each collection
                    data.forEach((collection, index) => {
                        console.log(`Collection ${index + 1}:`);
                        collection.cards.forEach(card => {
                            console.log(`Card: ${card.name}, Price: ${card.purchase_price}`);
                        });
                    });
                }
            })
            .catch(error => {
                console.error('Error fetching collections:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [id, verbose]);

    useEffect(() => {
        if (collections.length > 0) {
            handleCollectionChange({ target: { value: selectedCollection } });
        }
    }, [collections]);

    useEffect(() => {
        const updateCardsWithMarketPrice = async () => {
            setLoading(true);
            if (verbose) {
                console.log('Cards before fetching market price:');
                displayedCards.forEach(card => {
                    console.log(`Card: ${card.name}, Price: ${card.purchase_price}`);
                });
            }
            const updatedCards = await Promise.all(displayedCards.map(async (item) => {
                const marketPrice = await fetchMarketPrice(item.name, item.id, item.edition, item.grade, item.type);
                return { ...item, marketPrice: marketPrice || item.purchase_price };
            }));
            setCardsWithMarketPrice(updatedCards);
            if (verbose) {
                console.log('Cards after fetching market price:');
                updatedCards.forEach(card => {
                    console.log(`Card: ${card.name}, Price: ${card.purchase_price}, Market Price: ${card.marketPrice}`);
                });
            }
            setLoading(false);
        };

        if (displayedCards.length > 0) {
            updateCardsWithMarketPrice();
        }
    }, [displayedCards]);

    useEffect(() => {
        // Update displayedCards when cards change
        let newDisplayedCards;
        if (selectedCollection === 'all') {
            newDisplayedCards = cards;
        } else {
            newDisplayedCards = cards.filter(card => card.collectionName === selectedCollection);
        }
        setDisplayedCards(newDisplayedCards);
        
        if (verbose) {
            console.log('Updated displayedCards:');
            newDisplayedCards.forEach(card => {
                console.log(`Card: ${card.name}, Price: ${card.purchase_price}`);
            });
        }
    }, [cards, selectedCollection]);

    if (loading || routeLoading) {
        return (
            <div className="spinner-container">
                <ClipLoader color="#ffffff" loading={true} size={150} />
            </div>
        );
    }

    const handleMouseMove = (e, index) => {
        const cardImageRef = cardImageRefs.current[index];
        if (!cardImageRef) return; // Guard clause in case the ref is not set

        const quantityBubble = cardImageRef.parentElement.querySelector('.quantity-bubble');
        const rect = cardImageRef.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const deltaX = x - centerX;
        const deltaY = y - centerY;
        const percentX = deltaX / centerX;
        const percentY = deltaY / centerY;
        const angleX = percentY * 35; // Adjust the tilt angle
        const angleY = -percentX * 35; // Adjust the tilt angle

        // Calculate distance from cursor to center
        const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
        const maxDistance = Math.sqrt(centerX * centerX + centerY * centerY);
        const glowIntensity = Math.max(0, 1 - distance / maxDistance); // Normalize to [0, 1]

        cardImageRef.style.background = `radial-gradient(circle at ${x}px ${y - rect.height / 4}px, rgba(255, 255, 255, ${glowIntensity}), rgba(255, 255, 255, 0.2) 40%, transparent 60%)`; // Adjusted for top half sparkle
        cardImageRef.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.15)`;
        cardImageRef.style.boxShadow = `0 0 ${30 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity}), 0 0 ${60 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity * 0.8}), 0 0 ${90 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity * 0.6})`;

        if (quantityBubble) {
            quantityBubble.classList.add('hover');
        }
    };

    const handleMouseLeave = (index) => {
        const cardImageRef = cardImageRefs.current[index];
        if (!cardImageRef) return; // Guard clause in case the ref is not set

        const quantityBubble = cardImageRef.parentElement.querySelector('.quantity-bubble');
        cardImageRef.style.transform = 'rotateX(0) rotateY(0) scale(1)';
        cardImageRef.style.background = 'rgba(255, 255, 255, 0.3)';
        cardImageRef.style.boxShadow = 'none';

        if (quantityBubble) {
            quantityBubble.classList.remove('hover');
        }
    };

    const handleAddCard = async (newCard, selectedCollection = null) => {
        if (!id) {
            console.error('User ID is not available');
            return;
        }
        try {
            const addedCard = await addCard(newCard, id, selectedCollection);
            setCards(prevCards => [...prevCards, addedCard]);
            setAddCardModalOpen(false); // Close the modal after adding the card
        } catch (error) {
            console.error('Failed to add card:', error);
            // Optionally, you can set an error state here to display to the user
        }
    };

    const handleIncrementQuantity = async (item) => {
        if (verbose) {
            console.log("Incrementing quantity for item: ", item);
            console.log("Item ID: ", item?.id);
            console.log("Current quantity: ", item?.quantity);
            console.log("New quantity: ", item?.quantity + 1);
        }
        if (!item || !item.id) {
            console.error('Item ID is undefined or item data is missing:', item);
            return;
        }
        try {
            let updatedItem;
            if (item.type === 'card') {
                updatedItem = await updateCardQuantity(item.id, item.quantity + 1, item.collectionName, id);
            } else if (item.type === 'item') {
                updatedItem = await updateItemQuantity(item.id, item.quantity + 1, item.collectionName, id);
            }
            const updatedCards = cardsWithMarketPrice.map(c =>
                c.id === item.id ? { ...item, ...updatedItem } : c
            );
            setCardsWithMarketPrice(updatedCards);
        } catch (error) {
            console.error('Failed to increment quantity: ', error);
        }
    };

    const handleDecrementQuantity = async (item) => {
        if (verbose) {
            console.log("Decrementing quantity for item: ", item);
            console.log("Item ID: ", item?.id);
            console.log("Current quantity: ", item?.quantity);
            console.log("New quantity: ", item?.quantity - 1);
        }
        if (!item || !item.id) {
            console.error('Item ID is undefined or item data is missing:', item);
            return;
        }
        try {
            let updatedItem;
            if (item.type === 'card') {
                updatedItem = await updateCardQuantity(item.id, item.quantity - 1, item.collectionName, id);
            } else if (item.type === 'item') {
                updatedItem = await updateItemQuantity(item.id, item.quantity - 1, item.collectionName, id);
            }
            const updatedCards = cardsWithMarketPrice.map(c =>
                c.id === item.id ? { ...item, ...updatedItem } : c
            );
            setCardsWithMarketPrice(updatedCards);
        } catch (error) {
            console.error('Failed to decrement quantity: ', error);
        }
    };

    const handleAddCollection = async (userId, collectionName) => {
        try {
            await createCollection(userId, collectionName);
            // Handle successful creation (e.g., update state, show message)
            setManageCollectionsModalOpen(false);
            // Refresh collections list
            fetchCollectionsByUserID(id)
                .then(data => {
                    setCollections(data || []);
                })
                .catch(error => {
                    console.error('Error fetching collections:', error);
                });
        } catch (error) {
            console.error('Failed to create collection:', error);
            // Handle error (e.g., show error message)
        }
    };

    const handleRemoveCardFromCollection = async (userId, collectionName, cardId) => {
        try {
            await removeCardFromCollection(userId, collectionName, cardId);

            // Update the collections state
            setCollections(prevCollections =>
                prevCollections.map(collection => {
                    if (collection.collectionName === collectionName) {
                        return {
                            ...collection,
                            cards: collection.cards.filter(card => card.id !== cardId)
                        };
                    }
                    return collection;
                })
            );

            // Update the cards state
            setCards(prevCards => prevCards.filter(card => card.id !== cardId));

            // Update the cardsWithMarketPrice state
            setCardsWithMarketPrice(prevCards => prevCards.filter(card => card.id !== cardId));

        } catch (error) {
            console.error('Failed to remove card from collection:', error);
            // Handle error (e.g., show error message)
        }
    };


    const handleDeleteCollection = async (userId, collectionName) => {
        try {
            await deleteCollection(userId, collectionName);
            // Handle successful deletion (e.g., update state, show message)
            setManageCollectionsModalOpen(false);
            // Refresh collections list
            fetchCollectionsByUserID(id)
                .then(data => {
                    setCollections(data || []);
                })
                .catch(error => {
                    console.error('Error fetching collections:', error);
                });
        } catch (error) {
            console.error('Failed to delete collection:', error);
            // Handle error (e.g., show error message)
        }
    };

    const handleAddItem = async (newItem) => {
        if (!id) {
            console.error('User ID is not available');
            return;
        }
        try {
            if (verbose) console.log('Attempting to add item in CardList.js:', newItem);
            const addedItem = await addItemToCollection(
                id,
                newItem.name,  // Changed from item_name
                newItem.grade, // Changed from item_grade
                newItem.edition,
                newItem.collectionName,
                newItem.purchasePrice,
                newItem.type
            );
            if (verbose) console.log('Item added successfully in CardList.js:', addedItem);
            const marketPrice = await fetchMarketPrice(addedItem.name, addedItem.id, addedItem.edition, addedItem.grade);
            const updatedItem = { ...addedItem, marketPrice };
            setCards(prevCards => [...prevCards, updatedItem]);
            setAddItemModalOpen(false);
            setAddCardModalOpen(false);
        } catch (error) {
            console.error('Failed to add item:', error.message);
            // Optionally, you can set an error state here to display to the user
        }
    };

    const handleRemoveItemFromCollection = async (userId, collectionName, itemId) => {
        try {
            await removeItemFromCollection(userId, collectionName, itemId);
            setCards(prevCards => prevCards.filter(item => item.id !== itemId));
            setCardsWithMarketPrice(prevCards => prevCards.filter(item => item.id !== itemId));
        } catch (error) {
            console.error('Failed to remove item from collection:', error);
        }
    };

    const handleCardClick = (cardId, cardName, cardImage) => {
        navigate(`/card-market-data/${cardId}`, { state: { cardName, cardImage } });
    };

    // Extract collection names
    const collectionNames = collections.map(collection => collection.collection_name);

    const handleCardAdded = (newCard) => {
        console.log('handleCardAdded called with:', newCard);
        setCards(prevCards => {
            const updatedCards = [...prevCards, newCard];
            console.log('Updated cards:', updatedCards);
            return updatedCards;
        });
        setAddCardModalOpen(false);
    };

    return (
        <Container className="card-list-container">
            <Typography variant="h4" component="h1" className="title" gutterBottom>
                My Pokémon Card Collection
            </Typography>

            <div className="card-list-toolbar">
                <div className="toolbar-group">
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setAddCardModalOpen(true)}
                    >
                        Add Card
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        startIcon={<AddIcon />}
                        onClick={() => setAddItemModalOpen(true)}
                    >
                        Add Item
                    </Button>
                    <Button
                        variant="contained"
                        color="secondary"
                        startIcon={<SettingsIcon />}
                        onClick={() => setManageCollectionsModalOpen(true)}
                    >
                        Manage Collections
                    </Button>
                </div>
                <FormControl variant="outlined" className="collection-select">
                    <InputLabel id="collection-select-label">Select Collection</InputLabel>
                    <Select
                        labelId="collection-select-label"
                        id="collection-select"
                        value={selectedCollection}
                        onChange={handleCollectionChange}
                        label="Select Collection"
                    >
                        <MenuItem value="all">All Cards</MenuItem>
                        {collections.map((collection) => (
                            <MenuItem key={collection.collection_id} value={collection.collection_name}>
                                {collection.collection_name}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </div>

            <AddCardModal
                open={addCardModalOpen}
                onClose={() => setAddCardModalOpen(false)}
                onCardAdded={handleCardAdded}
                collections={collectionNames}
            />
            <AddItemModal
                open={addItemModalOpen}
                onClose={() => setAddItemModalOpen(false)}
                onAddItem={handleAddItem}
                collections={collectionNames}
            />
            <ManageCollectionsModal
                open={manageCollectionsModalOpen}
                onClose={() => setManageCollectionsModalOpen(false)}
                onAddCollection={handleAddCollection}
                onDeleteCollection={handleDeleteCollection}
                userId={id}
                collections={collectionNames}
            />

            <Typography variant="h5" component="h2" className="section-title">
                Cards
            </Typography>
            <Grid container spacing={3}>
                {cardsWithMarketPrice.filter(item => item.type === 'card').map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={card.id || index}>
                        <Card className="card" style={{ overflow: 'visible', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                            <div className="quantity-bubble">{card.quantity}</div>
                            <CardMedia
                                component="img"
                                className="card-image"
                                image={card.image || 'https://i.pinimg.com/originals/45/84/c0/4584c0b11190ed3bd738acf8f1d24fa4.jpg'}
                                alt={card.name || 'Unknown Card'}
                                ref={el => cardImageRefs.current[index] = el}
                                onError={(e) => {
                                    console.error('Error loading image:', e.target.src);
                                    e.target.src = 'https://i.pinimg.com/originals/45/84/c0/4584c0b11190ed3bd738acf8f1d24fa4.jpg';
                                }}
                                onMouseMove={(e) => handleMouseMove(e, index)}
                                onMouseLeave={() => handleMouseLeave(index)}
                                onClick={() => handleCardClick(card.id, card.name, card.image)}
                                style={{ overflow: 'visible' }}
                            />
                            <CardContent className="card-content">
                                <Typography variant="h5" component="h2">
                                    {card.name || 'Unknown Card'}
                                </Typography>
                                <Typography className="textSecondary">
                                    {card.edition}
                                </Typography>
                                <Typography variant="caption" component="p" style={{ fontSize: '0.7rem', color: '#999' }}>
                                    Collection: {card.collectionName || 'N/A'}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    Grade: {card.grade}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    Cost: {card.purchase_price}
                                </Typography>
                                <Typography variant="body2" component="p" className="market-price">
                                    Market Price: ${card.marketPrice ? card.marketPrice.toFixed(2) : 'N/A'}
                                </Typography>
                                <div className="card-actions">
                                    <div className="left-group">
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleRemoveItemFromCollection(id, card.collectionName, card.id)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </div>
                                    <div className="right-group">
                                        <IconButton size="small" color="primary" className="add-button" onClick={() => handleIncrementQuantity(card)}>
                                            <ArrowCircleUpTwoToneIcon />
                                        </IconButton>
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleDecrementQuantity(card)}>
                                            <ArrowCircleDownTwoToneIcon />
                                        </IconButton>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>

            <Typography variant="h5" component="h2" className="section-title">
                Items
            </Typography>
            <Grid container spacing={3}>
                {cardsWithMarketPrice.filter(item => item.type === 'item').map((item, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={item.id || index}>
                        <Card className="item" style={{ overflow: 'visible', backgroundColor: 'rgba(0, 0, 0, 0.2)', position: 'relative' }}>
                            <div style={{
                                position: 'absolute',
                                top: '5px',
                                right: '5px',
                                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                                color: 'white',
                                borderRadius: '50%',
                                width: '24px',
                                height: '24px',
                                display: 'flex',
                                justifyContent: 'center',
                                alignItems: 'center',
                                zIndex: 1,
                            }}>
                                {item.quantity}
                            </div>
                            <div className="item-placeholder">
                                <ShoppingBagIcon style={{ fontSize: 80, color: 'rgba(255, 255, 255, 0.7)' }} />
                            </div>
                            <CardContent className="card-content">
                                <Typography variant="h5" component="h2">
                                    {item.name}
                                </Typography>
                                <Typography className="textSecondary">
                                    {item.edition}
                                </Typography>
                                <Typography variant="caption" component="p" style={{ fontSize: '0.7rem', color: '#999' }}>
                                    Collection: {item.collectionName || 'N/A'}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    Grade: {item.grade}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    Cost: {item.purchase_price}
                                </Typography>
                                <Typography variant="body2" component="p" className="market-price">
                                    Market Price: ${item.marketPrice ? item.marketPrice.toFixed(2) : 'N/A'}
                                </Typography>
                                <div className="card-actions">
                                    <div className="left-group">
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleRemoveItemFromCollection(id, item.collectionName, item.id)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </div>
                                    <div className="right-group">
                                        <IconButton size="small" color="primary" className="add-button" onClick={() => handleIncrementQuantity(item)}>
                                            <ArrowCircleUpTwoToneIcon />
                                        </IconButton>
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleDecrementQuantity(item)}>
                                            <ArrowCircleDownTwoToneIcon />
                                        </IconButton>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default CardList;
