import React, { useState, useEffect } from 'react';
import { Container, Typography, Grid, Card, CardMedia, CardContent } from '@mui/material';
import '../styles/CardList.css';
import { fetchMarketPrice, fetchCards, processFetchedCards } from '../utils/apiUtils';
import config from '../config';

const CardList = () => {
    const [cards, setCards] = useState([]);
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]);
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

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                My Pokémon Card Collection
            </Typography>
            <Grid container spacing={3}>
                {cardsWithMarketPrice.map((card, index) => (
                    <Grid item xs={12} sm={6} md={4} lg={2.4} key={index}>  
                        <Card className="card">
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
