import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material';
import '../styles/CardList.css';

const CardList = () => {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        fetch('/api/cards')
            .then(response => response.json())
            .then(data => setCards(data));
    }, []);

    const fetchMarketPrice = async (cardName, edition, grade) => {
        const response = await fetch(`/api/market-price?card_name=${encodeURIComponent(cardName)}&edition=${encodeURIComponent(edition)}&grade=${encodeURIComponent(grade)}`);
        if (response.ok) {
            const data = await response.json();
            return data.market_price;
        } else {
            return null;
        }
    };

    useEffect(() => {
        const updateCardsWithMarketPrice = async () => {
            const updatedCards = await Promise.all(cards.map(async (card) => {
                const marketPrice = await fetchMarketPrice(card.name, card.edition, card.grade);
                return { ...card, marketPrice };
            }));
            setCards(updatedCards);
        };

        if (cards.length > 0) {
            updateCardsWithMarketPrice();
        }
    }, [cards.length]); // Only run when cards are initially loaded

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                My Pokémon Card Collection
            </Typography>
            <Grid container spacing={3}>
                {cards.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} key={index}>
                        <Card>
                            <CardMedia
                                component="img"
                                className="card-image"
                                image={card.image}
                                alt={card.name}
                            />
                            <CardContent>
                                <Typography variant="h5" component="h2">
                                    {card.name}
                                </Typography>
                                <Typography color="textSecondary">
                                    {card.edition}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    Grade: {card.grade}
                                </Typography>
                                <Typography variant="body2" component="p">
                                    Cost: {card.price}
                                </Typography>
                                {card.marketPrice !== undefined && (
                                    <Typography variant="body2" component="p">
                                        Market Price: ${card.marketPrice ? card.marketPrice.toFixed(2) : 'N/A'}
                                    </Typography>
                                )}
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default CardList;
