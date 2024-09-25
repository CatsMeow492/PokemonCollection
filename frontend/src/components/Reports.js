import React, { useState, useEffect } from 'react';
import { Container, Typography } from '@mui/material';
import { fetchMarketPrice } from '../utils/apiUtils';

const Reports = () => {
    const [totalCost, setTotalCost] = useState(null);
    const [marketPrice, setMarketPrice] = useState(null);
    const [cards, setCards] = useState([]); // Define cards state
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]); // Define cardsWithMarketPrice state
    const verbose = true; // Set this to false to turn off logging

    useEffect(() => {
        fetch('/api/cards')
            .then(response => response.json())
            .then(data => {
                if (verbose) console.log('Fetched data:', data); // Log fetched data

                const totalCostSum = data.reduce((acc, card) => {
                    const price = parseFloat(card.price.replace(/[^0-9.-]+/g, ""));
                    if (verbose) console.log(`Card price: ${card.price}, Parsed price: ${price}`); // Log each card's price
                    return acc + (isNaN(price) ? 0 : price);
                }, 0);
                setTotalCost(totalCostSum);
                if (verbose) console.log('Total Cost Sum:', totalCostSum); // Log total cost sum
                setCards(data); // Set the fetched cards data
            });
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

        const marketPriceSum = cardsWithMarketPrice.reduce((acc, card) => {
            const price = typeof card.marketPrice === 'string' 
                ? parseFloat(card.marketPrice.replace(/[^0-9.-]+/g, "")) 
                : card.marketPrice;
            if (verbose) {
                console.log(`Card market price: ${card.marketPrice}, Parsed market price: ${price}`); // Log each card's market price before parsing
                if (isNaN(price)) {
                    console.error(`Failed to parse market price: ${card.marketPrice}`);
                }
            }
            return acc + (isNaN(price) ? 0 : price);
        }, 0);
        setMarketPrice(marketPriceSum);
        if (verbose) console.log('Total Market Price Sum:', marketPriceSum); // Log total market price sum
    }, [verbose, cards, cardsWithMarketPrice]);

    const totalProfit = marketPrice - totalCost;

    return (
        <Container>
            <Typography variant="h4" component="h1" gutterBottom>
                Reports
            </Typography>
            <Typography variant="body1">
                This is the reports page. Here you can add various reports and analytics about your Pokémon card collection.
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
                Total Number of Cards: {cards.length}
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
                Total Cost of All Cards: {totalCost !== null ? `$${totalCost.toFixed(2)}` : 'Loading...'}
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
                Total Market Price of All Cards: {marketPrice !== null ? `$${marketPrice.toFixed(2)}` : 'Loading...'}
            </Typography>
            <Typography variant="h6" component="h2" gutterBottom>
                Total Profit of All Cards: {totalProfit !== null ? `$${totalProfit.toFixed(2)}` : 'Loading...'}
            </Typography>
        </Container>
    );
};

export default Reports;
