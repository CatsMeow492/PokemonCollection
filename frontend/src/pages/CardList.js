import React, { useState, useEffect, useContext, useRef, useMemo } from 'react';
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
const verbose = config;


const CardList = () => {
    const { id } = useContext(AuthContext);  // Get user ID from AuthContext
    const [cards, setCards] = useState([]);  // State for holding all cards
    const [collections, setCollections] = useState([]);  // State for holding collections
    const [selectedCollection, setSelectedCollection] = useState('all');  // Selected collection state
    const [loading, setLoading] = useState(true);  // Loading state
    const [addCardModalOpen, setAddCardModalOpen] = useState(false);  // Modal open state for adding cards
    const [manageCollectionsModalOpen, setManageCollectionsModalOpen] = useState(false);  // Modal open state for managing collections
    const [addItemModalOpen, setAddItemModalOpen] = useState(false);  // Modal open state for adding items
    const navigate = useNavigate();  // React Router's navigate function
    const cardImageRefs = useRef([]);
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                const data = await fetchCollectionsByUserID(id);
                setCollections(data || []);
                
                // Process the cards from all collections and set them in state
                const allCards = data.flatMap(collection => 
                    collection.cards.map(card => ({
                        ...card,
                        collectionName: collection.collection_name
                    }))
                );
                setCards(allCards);  // Set all cards from all collections
                
                const allItems = data.flatMap(collection => [
                    ...(collection.cards || []).map(card => ({ ...card, type: 'card', collectionName: collection.collection_name })),
                    ...(collection.items || []).map(item => ({ ...item, type: 'item', collectionName: collection.collection_name }))
                ]);
                
                const itemsWithMarketPrice = await Promise.all(allItems.map(async (item) => {
                    const marketPrice = await fetchMarketPrice(item.name, item.id, item.edition, item.grade, item.type);
                    return { ...item, marketPrice: marketPrice || item.purchase_price };
                }));
                
                setCards(itemsWithMarketPrice);
                console.log("Cards with market price set:", itemsWithMarketPrice); // Add this line
            } catch (error) {
                console.error('Error fetching collections:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    // Handler for collection change
    const handleCollectionChange = (e) => {
        setSelectedCollection(e.target.value);
    };

    // Add Item handler
    const handleAddItem = async (newItem) => {
        try {
            const addedItem = await addItemToCollection(
                id,
                newItem.name,
                newItem.grade,
                newItem.edition,
                newItem.collectionName,
                newItem.purchasePrice,
                newItem.type
            );
            setCards((prevCards) => [...prevCards, { ...addedItem, type: 'item' }]);
            setAddItemModalOpen(false);
        } catch (error) {
            console.error('Failed to add item:', error);
        }
    };

    // Filter cards based on the selected collection
    const filteredCards = selectedCollection === 'all'
        ? cards  // Show all cards if 'all' is selected
        : cards.filter(card => card.collectionName === selectedCollection);  // Filter by collection name

    // Handler for card click to navigate to the card's market data
    const handleCardClick = (cardId, cardName, cardImage) => {
        navigate(`/card-market-data/${cardId}`, { state: { cardName, cardImage } });
    };

    // Loading state display
    if (loading) {
        return (
            <div className="spinner-container">
                <ClipLoader color="#ffffff" loading={true} size={150} />
            </div>
        );
    }

    const updateMarketPrices = async () => {
        setCardsWithMarketPrice(prevCards => {
            return Promise.all(prevCards.map(async (item) => {
                const marketPrice = await fetchMarketPrice(item.name, item.id, item.edition, item.grade, item.type);
                return { ...item, marketPrice: marketPrice || item.purchase_price };
            }));
        });
    };

    const handleQuantityChange = async (card, increment) => {
        const newQuantity = Math.max(0, card.quantity + (increment ? 1 : -1));
        try {
            await updateCardQuantity(card.id, newQuantity, card.collectionName, id);
            console.log("Cards before update:", cards);
            setCards(prevCards => {
                const updatedCards = prevCards.map(c => c.id === card.id ? { ...c, quantity: newQuantity } : c);
                console.log("Cards after update:", updatedCards);
                return updatedCards;
            });
        } catch (error) {
            console.error('Failed to update quantity:', error);
        }
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
                onCardAdded={handleAddItem}
                collections={collections.map(c => c.collection_name)}
            />
            <AddItemModal
                open={addItemModalOpen}
                onClose={() => setAddItemModalOpen(false)}
                onAddItem={handleAddItem}
                collections={collections.map(c => c.collection_name)}
            />
            <ManageCollectionsModal
                open={manageCollectionsModalOpen}
                onClose={() => setManageCollectionsModalOpen(false)}
                userId={id}
                collections={collections.map(c => c.collection_name)}
            />

            <Typography variant="h5" component="h2" className="section-title">
                Cards
            </Typography>
            <Grid container spacing={3}>
                {filteredCards.filter(item => item.type === 'card').map((card, index) => (
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
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleRemoveItemFromCollection(card.collectionName, card.id)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </div>
                                    <div className="right-group">
                                        <IconButton 
                                            size="small" 
                                            color="primary" 
                                            className="add-button" 
                                            onClick={() => handleQuantityChange(card, true)}
                                        >
                                            <ArrowCircleUpTwoToneIcon />
                                        </IconButton>
                                        <IconButton 
                                            size="small" 
                                            color="primary" 
                                            className="remove-button" 
                                            onClick={() => handleQuantityChange(card, false)}
                                        >
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
                {filteredCards.filter(item => item.type === 'item').map((item, index) => (
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
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleRemoveItemFromCollection(item.collectionName, item.id)}>
                                            <ClearIcon />
                                        </IconButton>
                                    </div>
                                    <div className="right-group">
                                        <IconButton size="small" color="primary" className="add-button" onClick={() => handleQuantityChange(item, true)}>
                                            <ArrowCircleUpTwoToneIcon />
                                        </IconButton>
                                        <IconButton size="small" color="primary" className="remove-button" onClick={() => handleQuantityChange(item, false)}>
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
