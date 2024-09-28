import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material';
import AddCardModal from '../modals/AddCardModal';
import '../styles/CardList.css';
import { fetchMarketPrice, fetchCards, processFetchedCards, addCard, updateCardQuantity } from '../utils/apiUtils';
import { Button } from '@mui/material';
import ArrowCircleUpTwoToneIcon from '@mui/icons-material/ArrowCircleUpTwoTone';
import ArrowCircleDownTwoToneIcon from '@mui/icons-material/ArrowCircleDownTwoTone';
import useRouteLoading from '../hooks/useRouteLoading';
import { ClipLoader } from 'react-spinners';
import config from '../config';

const CardList = () => {
    const routeLoading = useRouteLoading();
    const [cards, setCards] = useState([]);
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]);
    const cardImageRefs = useRef([]);
    const { verbose } = config;
    const [modalOpen, setModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setLoading(true);
        fetchCards()
            .then(data => {
                const { cards } = processFetchedCards(data, verbose);
                setCards(cards);
            })
            .catch(error => {
                console.error('Error fetching cards:', error);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [verbose]);

    useEffect(() => {
        const updateCardsWithMarketPrice = async () => {
            setLoading(true);
            const updatedCards = await Promise.all(cards.map(async (card) => {
                const marketPrice = await fetchMarketPrice(card.name, card.id, card.edition, card.grade);
                return { ...card, marketPrice };
            }));
            setCardsWithMarketPrice(updatedCards);
            setLoading(false);
        };

        if (cards.length > 0) {
            updateCardsWithMarketPrice();
        }
    }, [cards]);

    if (loading || routeLoading) {
        return (
            <div className="spinner-container">
                <ClipLoader color="#ffffff" loading={true} size={150} />
            </div>
        );
    }

    const handleMouseMove = (e, index) => {
        const cardImageRef = cardImageRefs.current[index].current;
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

        cardImageRef.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, ${glowIntensity}), rgba(255, 255, 255, 0.2) 40%, transparent 60%)`;
        cardImageRef.style.background = `radial-gradient(circle at ${x}px ${y - rect.height / 4}px, rgba(255, 255, 255, ${glowIntensity}), rgba(255, 255, 255, 0.2) 40%, transparent 60%)`; // Adjusted for top half sparkle

        cardImageRef.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.15)`;
        cardImageRef.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, ${glowIntensity}), rgba(255, 255, 255, 0.2) 40%, transparent 60%)`;
        cardImageRef.style.boxShadow = `0 0 ${30 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity}), 0 0 ${60 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity * 0.8}), 0 0 ${90 * glowIntensity}px rgba(255, 255, 255, ${glowIntensity * 0.6})`; // Fixed missing parenthesis

        if (quantityBubble) {
            quantityBubble.classList.add('hover');
        }
    };

    const handleMouseLeave = (index) => {
        const cardImageRef = cardImageRefs.current[index].current;
        const quantityBubble = cardImageRef.parentElement.querySelector('.quantity-bubble');
        cardImageRef.style.transform = 'rotateX(0) rotateY(0) scale(1)';
        cardImageRef.style.background = 'rgba(255, 255, 255, 0.3)';

        if (quantityBubble) {
            quantityBubble.classList.remove('hover');
        }
    };

    const handleAddCard = async (newCard) => {
        try {
          const addedCard = await addCard(newCard);
          setCards([...cards, addedCard]);
        } catch (error) {
          console.error('Failed to add card:', error);
        }
    };

    const handleIncrementQuantity = async (index) => {
        if (verbose) {
            console.log("Incrementing quantity for card at index: ", index);
            console.log("Card data: ", cardsWithMarketPrice[index]); // Log the entire card data
            console.log("Card ID: ", cardsWithMarketPrice[index]?.id); // Log the card ID
            console.log("Current quantity: ", cardsWithMarketPrice[index]?.quantity);
            console.log("New quantity: ", cardsWithMarketPrice[index]?.quantity + 1);
        }
        const card = cardsWithMarketPrice[index];
        if (!card || !card.id) {
            console.error('Card ID is undefined or card data is missing:', card);
            return;
        }
        try {
            const updatedCard = await updateCardQuantity(card.id, card.quantity + 1);
            const updatedCards = [...cardsWithMarketPrice];
            updatedCards[index] = { ...card, ...updatedCard }; // Merge the updated card data
            setCardsWithMarketPrice(updatedCards);
        } catch (error) {
            console.error('Failed to increment quantity: ', error);
        }
    };

    const handleDecrementQuantity = async (index) => {
        if (verbose) {
            console.log("Decrementing quantity for card at index: ", index);
            console.log("Card data: ", cardsWithMarketPrice[index]); // Log the entire card data
            console.log("Card ID: ", cardsWithMarketPrice[index]?.id); // Log the card ID
            console.log("Current quantity: ", cardsWithMarketPrice[index]?.quantity);
            console.log("New quantity: ", cardsWithMarketPrice[index]?.quantity - 1);
        }
        const card = cardsWithMarketPrice[index];
        if (!card || !card.id) {
            console.error('Card ID is undefined or card data is missing:', card);
            return;
        }
        try {
            const updatedCard = await updateCardQuantity(card.id, card.quantity - 1);
            const updatedCards = [...cardsWithMarketPrice];
            updatedCards[index] = { ...card, ...updatedCard };
            setCardsWithMarketPrice(updatedCards);
        } catch (error) {
            console.error('Failed to decrement quantity: ', error);
        }
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" className="title" style={{ color: 'aliceblue' }} gutterBottom>
                My Pokémon Card Collection
            </Typography>
            <Button variant="contained" color="primary" style={{ marginBottom: '1rem' }} onClick={() => setModalOpen(true)}>Add Card</Button>
            <AddCardModal open={modalOpen} onClose={() => setModalOpen(false)} onAddCard={handleAddCard} />
            <Grid container spacing={3}>
                {cardsWithMarketPrice.map((card, index) => {
                    cardImageRefs.current[index] = cardImageRefs.current[index] || React.createRef();
                    return (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                            <Card className="card" style={{ overflow: 'visible', backgroundColor: 'rgba(0, 0, 0, 0.3)' }}>
                                <div className="quantity-bubble">{card.quantity}</div> {/* Quantity Bubble */}
                                <CardMedia
                                    component="img"
                                    className="card-image"
                                    image={card.image}
                                    alt={card.name}
                                    ref={cardImageRefs.current[index]}
                                    onMouseMove={(e) => handleMouseMove(e, index)}
                                    onMouseLeave={() => handleMouseLeave(index)}
                                    style={{ overflow: 'visible' }}
                                />
                                <CardContent className="card-content">
                                    <Typography variant="h5" component="h2">
                                        {card.name}
                                    </Typography>
                                    <Typography className="textSecondary">
                                        {card.edition}
                                    </Typography>
                                    <Typography variant="body2" component="p">
                                        Grade: {card.grade}
                                    </Typography>
                                    <Typography variant="body2" component="p">
                                        Cost: {card.price}
                                    </Typography>
                                    {card.marketPrice !== undefined && (
                                        <Typography variant="body2" component="p" className="market-price">
                                            Market Price: ${card.marketPrice ? card.marketPrice.toFixed(2) : 'N/A'}
                                        </Typography>
                                    )}
                                </CardContent>
                                <div className="card-actions">
                                    <IconButton size="small" color="primary" className="add-button" onClick={() => handleIncrementQuantity(index)}>
                                        <ArrowCircleUpTwoToneIcon />
                                    </IconButton>
                                    <IconButton size="small" color="primary" className="remove-button" onClick={() => handleDecrementQuantity(index)}>
                                        <ArrowCircleDownTwoToneIcon />
                                    </IconButton>
                                </div>
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
};

export default CardList;