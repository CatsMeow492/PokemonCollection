import React, { useEffect, useState } from 'react';
import { Container, Grid, Card, CardContent, Typography, CardMedia } from '@mui/material';

const CardList = () => {
    const [cards, setCards] = useState([]);

    useEffect(() => {
        fetch('/api/cards')
            .then(response => response.json())
            .then(data => setCards(data));
    }, []);

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
                                height="140"
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
                                    Price: {card.price}
                                </Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                ))}
            </Grid>
        </Container>
    );
};

export default CardList;
