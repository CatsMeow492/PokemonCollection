import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent, IconButton } from '@mui/material';
import AddCardModal from './AddCardModal';
import '../styles/CardList.css';
import { fetchMarketPrice, fetchCards, processFetchedCards, addCard } from '../utils/apiUtils';
import { Button } from '@mui/material';
import ArrowCircleUpTwoToneIcon from '@mui/icons-material/ArrowCircleUpTwoTone';
import ArrowCircleDownTwoToneIcon from '@mui/icons-material/ArrowCircleDownTwoTone';
import useRouteLoading from '../hooks/useRouteLoading';
import { ClipLoader } from 'react-spinners';
import config from '../config';

const CardList = () => {
    const loading = useRouteLoading();
    const [cards, setCards] = useState([]);
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]);
    const cardImageRefs = useRef([]);
    const { verbose } = config;
    const [modalOpen, setModalOpen] = useState(false);

    useEffect(() => {
        fetchCards()
            .then(data => {
                const { cards } = processFetchedCards(data, verbose);
                setCards(cards);
            })
    }, [verbose]);

    useEffect(() => {
        const updateCardsWithMarketPrice = async () => {
            const updatedCards = await Promise.all(cards.map(async (card) => {
                const marketPrice = await fetchMarketPrice(card.name, card.edition, card.grade);
                return { ...card, marketPrice };
            }));
            setCardsWithMarketPrice(updatedCards);
        };

        if (cards.length > 0) {
            updateCardsWithMarketPrice();
        }
    }, [cards]);

    if (loading) {
        return (
            <div className="spinner-container">
                <ClipLoader color="#ffffff" loading={loading} size={150} />
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

    handleIncrementQuantity = async (index) => {
        const card = cardsWithMarketPrice[index];
        try {
            const updatedCard = await updateCardQuantity(card.id, card.quantity + 1);
            const updatedCards = [...cardsWithMarketPrice];
            updatedCards[index] = updatedCard;
            setCardsWithMarketPrice(updatedCards);
        } catch (error) {
            console.error('Failed to increment quantity: ', error)
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
                                    <IconButton size="small" color="primary" className="remove-button">
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
