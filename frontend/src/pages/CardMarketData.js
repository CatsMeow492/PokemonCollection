import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Box, Grid, Paper } from '@mui/material';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from 'chart.js';
import { useLocation } from 'react-router-dom';
import '../styles/CardMarketData.css';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const CardMarketData = () => {
    const { cardId } = useParams();
    const { cardName, cardImage } = useLocation().state || {};
    const [marketData, setMarketData] = useState([]);
    const [summaryData, setSummaryData] = useState({});

    useEffect(() => {
        // Fetch market data for the specific card
        const fetchMarketData = async () => {
            try {
                const response = await fetch(`/api/card-market-data/${cardId}`);
                const data = await response.json();
                setMarketData(data);
                calculateSummaryData(data);
            } catch (error) {
                console.error('Error fetching market data:', error);
            }
        };

        fetchMarketData();
    }, [cardId]);

    const calculateSummaryData = (data) => {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const recentData = data.filter(item => new Date(item.fetched_at) >= sixMonthsAgo);
        const prices = recentData.map(item => item.price);

        setSummaryData({
            sixMonthHigh: Math.max(...prices),
            sixMonthLow: Math.min(...prices),
        });
    };

    const chartData = {
        labels: marketData.map(item => new Date(item.fetched_at).toLocaleDateString()),
        datasets: [
            {
                label: 'Market Price',
                data: marketData.map(item => item.price),
                fill: false,
                borderColor: 'rgb(75, 192, 192)',
                tension: 0.1
            }
        ]
    };

    return (
        <Container>
            <Typography variant="h4" gutterBottom>Card Market Data</Typography>
            <Grid container spacing={3}>
                <Grid item xs={12} md={4}>
                    <Paper elevation={3}>
                        <Box p={3} className="card-info-box">
                            <img src={cardImage} alt={cardName} className="card-image" />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12} md={8}>
                    <Paper elevation={3}>
                        <Box p={3} className="chart-box black-text">
                            <Typography variant="h6" gutterBottom>Price Trend</Typography>
                            <Line data={chartData} />
                        </Box>
                    </Paper>
                </Grid>
                <Grid item xs={12}>
                    <Paper elevation={3}>
                        <Box p={3} className="summary-box black-text">
                            <Typography variant="h6" gutterBottom>Summary Data</Typography>
                            <Typography>6 Month High: ${summaryData.sixMonthHigh?.toFixed(2)}</Typography>
                            <Typography>6 Month Low: ${summaryData.sixMonthLow?.toFixed(2)}</Typography>
                        </Box>
                    </Paper>
                </Grid>
                {/* Add more Grid items for other grades data if available */}
            </Grid>
        </Container>
    );
};

export default CardMarketData;
