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
import { handleMouseMove, handleMouseLeave } from '../handlers/CardLiftEffect';
import { 
    handleIncrementQuantity, 
    handleDecrementQuantity, 
    handleRemoveItemFromCollection,
    updateCardsWithMarketPrice
} from '../handlers/CardHandlers';

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
        if (displayedCards.length > 0) {
            updateCardsWithMarketPrice(displayedCards, setCardsWithMarketPrice, setLoading, verbose);
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
                newItem.name,
                newItem.grade,
                newItem.edition,
                newItem.collectionName,
                newItem.purchasePrice,
                newItem.type
            );
            if (verbose) console.log('Item added successfully in CardList.js:', addedItem);
            const marketPrice = await fetchMarketPrice(addedItem.name, addedItem.id, addedItem.edition, addedItem.grade);
            const updatedItem = { ...addedItem, marketPrice, type: 'item' };
            setCardsWithMarketPrice(prevCards => [...prevCards, updatedItem]);
            setAddItemModalOpen(false);
        } catch (error) {
            console.error('Failed to add item:', error.message);
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

    // Use the imported handlers
    const onIncrementQuantity = (item) => handleIncrementQuantity(item, id, setCardsWithMarketPrice, verbose);
    const onDecrementQuantity = (item) => handleDecrementQuantity(item, id, setCardsWithMarketPrice, verbose);
    const onRemoveItemFromCollection = (collectionName, itemId) => handleRemoveItemFromCollection(id, collectionName, itemId, setCardsWithMarketPrice);

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
                                onMouseMove={(e) => handleMouseMove(e, index, cardImageRefs.current[index])}
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
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => onRemoveItemFromCollection(card.collectionName, card.id)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </div>
                                    <div className="right-group">
                                        <IconButton size="small" color="primary" className="add-button" onClick={() => onIncrementQuantity(card)}>
                                            <ArrowCircleUpTwoToneIcon />
                                        </IconButton>
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => onDecrementQuantity(card)}>
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
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => onRemoveItemFromCollection(item.collectionName, item.id)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </div>
                                    <div className="right-group">
                                        <IconButton size="small" color="primary" className="add-button" onClick={() => onIncrementQuantity(item)}>
                                            <ArrowCircleUpTwoToneIcon />
                                        </IconButton>
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => onDecrementQuantity(item)}>
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
