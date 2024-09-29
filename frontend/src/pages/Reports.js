import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, CircularProgress, Card, CardContent, Divider } from '@mui/material';
import { fetchCards, processFetchedCards, fetchMarketPrice } from '../utils/apiUtils';
import config from '../config';
import '../styles/Reports.css';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';

const Reports = () => {
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { verbose } = config;

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                setLoading(true);
                const cardsData = await fetchCards();
                const { totalCostSum, cards } = processFetchedCards(cardsData, verbose);

                const cardsWithMarketPrice = await Promise.all(cards.map(async (card) => {
                    const marketPrice = await fetchMarketPrice(card.name, card.id, card.edition, card.grade);
                    return { ...card, marketPrice: parseFloat(marketPrice) || 0 };
                }));

                const totalMarketPrice = cardsWithMarketPrice.reduce((sum, card) => sum + card.marketPrice, 0);
                const totalProfit = totalMarketPrice - totalCostSum;

                setReportData({
                    totalCost: totalCostSum,
                    cardsCount: cards.length,
                    averageCardPrice: cards.length > 0 ? (totalCostSum / cards.length) : 0,
                    top5ExpensiveCards: cardsWithMarketPrice.sort((a, b) => b.marketPrice - a.marketPrice).slice(0, 5),
                    totalMarketPrice: totalMarketPrice,
                    totalProfit: totalProfit,
                    cardsWithMarketPrice: cardsWithMarketPrice
                });
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError('Failed to load report data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [verbose]);

    if (loading) {
        return (
            <div className="loading-container">
                <CircularProgress />
            </div>
        );
    }

    if (error) {
        return (
            <div className="error-container">
                <Typography color="error">{error}</Typography>
            </div>
        );
    }

    if (!reportData) {
        return null;
    }

    const { totalCost, cardsCount, averageCardPrice, top5ExpensiveCards, totalMarketPrice, totalProfit } = reportData;

    return (
        <div className="main-container">
            <Container className="reports-container reports-text">
                <Typography variant="h4" component="h1" className="title" gutterBottom>
                    Collection Insights
                </Typography>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={4}>
                        <Card className="summary-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Total Cards</Typography>
                                <Typography variant="h3">{cardsCount}</Typography>
                                <CreditCardIcon className="card-icon" />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card className="summary-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Total Cost</Typography>
                                <Typography variant="h3">${totalCost.toFixed(2)}</Typography>
                                <AttachMoneyIcon className="card-icon" />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={4}>
                        <Card className="summary-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Total Profit</Typography>
                                <Typography variant="h3" className={totalProfit >= 0 ? "profit-positive" : "profit-negative"}>
                                    ${totalProfit.toFixed(2)}
                                </Typography>
                                <TrendingUpIcon className="card-icon" />
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card className="detail-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Collection Details</Typography>
                                <Divider className="card-divider" />
                                <Typography>Average Card Price: ${averageCardPrice.toFixed(2)}</Typography>
                                <Typography>Total Market Price: ${totalMarketPrice.toFixed(2)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card className="detail-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Top 5 Most Valuable Cards</Typography>
                                <Divider className="card-divider" />
                                {top5ExpensiveCards.map((card, index) => (
                                    <Typography key={index} className="top-card-item">
                                        {card.name} - ${card.marketPrice.toFixed(2)}
                                    </Typography>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
        </div>
    );
};

export default Reports;