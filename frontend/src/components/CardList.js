import React, { useState, useEffect, useRef } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material';
import '../styles/CardList.css';
import { fetchMarketPrice, fetchCards, processFetchedCards } from '../utils/apiUtils';
import config from '../config';

const CardList = () => {
    const [cards, setCards] = useState([]);
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]);
    const cardImageRefs = useRef([]);
    const { verbose } = config;

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

    const handleMouseMove = (e, index) => {
        const cardImageRef = cardImageRefs.current[index].current;
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

        cardImageRef.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) scale(1.15)`;
        cardImageRef.style.background = `radial-gradient(circle at ${x}px ${y}px, rgba(255, 255, 255, 1), rgba(255, 255, 255, 0.2) 40%, transparent 60%)`;
        cardImageRef.style.boxShadow = `0 0 30px rgba(255, 255, 255, 1), 0 0 60px rgba(255, 255, 255, 0.8), 0 0 90px rgba(255, 255, 255, 0.6)`;
    };

    const handleMouseLeave = (index) => {
        const cardImageRef = cardImageRefs.current[index].current;
        cardImageRef.style.transform = 'rotateX(0) rotateY(0) scale(1)';
        cardImageRef.style.background = 'rgba(255, 255, 255, 0.3)';
    };

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                My Pokémon Card Collection
            </Typography>
            <Grid container spacing={3}>
                {cardsWithMarketPrice.map((card, index) => {
                    cardImageRefs.current[index] = cardImageRefs.current[index] || React.createRef();
                    return (
                        <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>
                            <Card className="card" style={{ overflow: 'visible' }}>
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
                            </Card>
                        </Grid>
                    );
                })}
            </Grid>
        </Container>
    );
};

export default CardList;
