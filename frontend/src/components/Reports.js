import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Divider, Grid2 } from '@mui/material';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import { fetchMarketPrice, fetchCards, processFetchedCards } from '../utils/apiUtils'; // Import fetchCards and processFetchedCards
import config from '../config';
import '../styles/Reports.css'; // Import the new CSS file
import useRouteLoading from '../hooks/useRouteLoading';
import { ClipLoader } from 'react-spinners';
import Clefairy from '../assets/images/clefairy.png';
import Snorlax from '../assets/images/snorlax.webp';
import ChatBubble from './ChatBubble';

const Reports = () => {
    const [totalCost, setTotalCost] = useState(null);
    const [marketPrice, setMarketPrice] = useState(null);
    const [cards, setCards] = useState([]); // Define cards state
    const [cardsWithMarketPrice, setCardsWithMarketPrice] = useState([]); // Define cardsWithMarketPrice state
    const { verbose } = config;
    const loading = useRouteLoading();
    
    useEffect(() => {
        fetchCards()
            .then(data => {
                const { totalCostSum, cards } = processFetchedCards(data, verbose);
                setTotalCost(totalCostSum);
                setCards(cards);
            })
            .catch(error => {
                console.error('Error fetching cards:', error);
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
    }, [cards]);

    useEffect(() => {
        if (cardsWithMarketPrice.length > 0) {
            const marketPriceSum = cardsWithMarketPrice.reduce((acc, card) => {
                const price = typeof card.marketPrice === 'string' 
                    ? parseFloat(card.marketPrice.replace(/[^0-9.-]+/g, "")) 
                    : card.marketPrice;
                if (verbose) {
                    console.log(`Card market price: ${card.marketPrice}, Parsed market price: ${price}`);
                    if (isNaN(price)) {
                        console.error(`Failed to parse market price: ${card.marketPrice}`);
                    }
                }
                return acc + (isNaN(price) ? 0 : price);
            }, 0);
            setMarketPrice(marketPriceSum);
            if (verbose) console.log('Total Market Price Sum:', marketPriceSum);
        }
    }, [verbose, cardsWithMarketPrice]);

    if (loading) {
        return (
            <div className="spinner-container">
                <ClipLoader color="#ffffff" loading={loading} size={150} />
            </div>
        );
    }
    const totalProfit = marketPrice - totalCost;

    // Calculate average card price
    const averageCardPrice = cards.length > 0 ? (totalCost / cards.length) : 0;

    // Get top 5 most expensive cards
    const top5ExpensiveCards = [...cardsWithMarketPrice]
        .sort((a, b) => b.marketPrice - a.marketPrice)
        .slice(0, 5);

    // Get top 5 most profitable cards
    const top5ProfitableCards = [...cardsWithMarketPrice]
        .sort((a, b) => b.price - a.marketPrice)
        .slice(0, 5);

    const otherMarketValue = marketPrice - top5ExpensiveCards.reduce((acc, card) => acc + card.marketPrice, 0);

    const pieData = [
        ...top5ExpensiveCards.map(card => ({ name: card.name, value: card.marketPrice })),
        { name: 'Other', value: otherMarketValue }
    ];

    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF6384', '#36A2EB'];

    const cardCounts = cards.reduce((acc, card) => {
        acc[card.name] = (acc[card.name] || 0) + 1;
        return acc;
    }, {});

    const barData = Object.keys(cardCounts).map(name => ({
        name,
        count: cardCounts[name]
    }));

    return (
        <Container margin-top="15px" style={{ overflow: 'hidden' }}>
            <Typography variant="h4" component="h1" className="title" style={{ color: 'aliceblue' }} gutterBottom>
                Collection Insights
            </Typography>
            <Typography variant="body1" gutterBottom>
                This is the reports page. Here you can add various reports and analytics about your Pokémon card collection.
            </Typography>
            <Divider />
            <Grid2 container spacing={2} justifyContent="center">
                <Grid2 item xs={12} md={6}>
                    <Box my={2}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Summary
                        </Typography>
                        <Typography variant="body1">
                            Total Number of Cards: {cards.length}
                        </Typography>
                        <Typography variant="body1">
                            Total Cost of All Cards: {totalCost !== null ? `$${totalCost.toFixed(2)}` : 'Loading...'}
                        </Typography>
                        <Typography variant="body1">
                            Total Market Price of All Cards: {marketPrice !== null ? `$${marketPrice.toFixed(2)}` : 'Loading...'}
                        </Typography>
                        <Typography variant="body1">
                            Total Profit of All Cards: {totalProfit !== null ? `$${totalProfit.toFixed(2)}` : 'Loading...'}
                        </Typography>
                        <Typography variant="body1">
                            Average Card Price: {averageCardPrice !== null ? `$${averageCardPrice.toFixed(2)}` : 'Loading...'}
                        </Typography>
                    </Box>
                </Grid2>
                <Grid2 item xs={12} md={6}>
                    <Box my={2}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Top 5 Most Expensive Cards
                        </Typography>
                        {top5ExpensiveCards.map((card, index) => (
                            <Typography key={index} variant="body1">
                                {card.name} - ${card.marketPrice.toFixed(2)}
                            </Typography>
                        ))}
                    </Box>
                </Grid2>
                <Grid2>
                <Box my={2}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Top 5 Most Profitable Cards
                        </Typography>
                        {top5ProfitableCards.map((card, index) => (
                            <Typography key={index} variant="body1">
                                {card.name} - ${card.marketPrice.toFixed(2)}
                            </Typography>
                        ))}
                    </Box>
                </Grid2>
                <Grid2 item xs={12} md={6}>
                    <Box my={2}>
                        <PieChart width={400} height={400} style={{ marginTop: "-45px" }}>
                            <Pie
                                data={pieData}
                                cx={200}
                                cy={200}
                                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                labelLine={false}
                                outerRadius={75}
                                fill="#8884d8"
                                dataKey="value"
                            >
                                {pieData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </Box>
                </Grid2>
                <Grid2 item xs={12}>
                    <Box my={2}>
                        <Typography variant="h6" component="h2" gutterBottom>
                            Card Quantities
                        </Typography>
                        <BarChart width={600} height={300} data={barData} margin={{ bottom: 65 }}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" tick={{ fontSize: 9.5 }} angle={-45} textAnchor="end" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="count" fill="#8884d8" />
                        </BarChart>
                    </Box>
                </Grid2>
            </Grid2>
            <div className="clefairy-chat">
                <img src={Clefairy} alt="Clefairy" className="clefairy-image" />
                <ChatBubble />
            </div>
            <div className="snorlax-container">
                <img src={Snorlax} alt="Snorlax" className="snorlax-image" />
            </div>
        </Container>
    );
};

export default Reports;
