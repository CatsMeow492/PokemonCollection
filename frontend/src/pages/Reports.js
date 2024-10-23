import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Grid, CircularProgress, Card, CardContent, Divider } from '@mui/material';
import { fetchCollectionsByUserID, fetchMarketPrice } from '../utils/apiUtils';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import config from '../config';
import '../styles/Reports.css';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import Clefairy from '../assets/images/clefairy.png';
import Snorlax from '../assets/images/snorlax.webp';
import ChatBubble from '../components/ChatBubble';
import { AuthContext } from '../context/AuthContext';

const Reports = () => {
    const { id } = React.useContext(AuthContext);
    const [reportData, setReportData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { verbose } = config;

    const handleSendMessage = (message) => {
        if (verbose) {
            console.log('Message received in Reports component:', message);
        }
        // You can add any additional logic here to process the message
    };

    useEffect(() => {
        if (!id) return;

        const fetchReportData = async () => {
            try {
                setLoading(true);
                const data = await fetchCollectionsByUserID(id);
                
                // Combine cards and items without overriding 'type'
                const allItems = data.flatMap(collection => [
                    ...(collection.cards || []).map(card => ({ ...card, collectionName: collection.collection_name })),
                    ...(collection.items || []).map(item => ({ ...item, collectionName: collection.collection_name }))
                ]);

                // Fetch market prices
                const itemsWithMarketPrice = await Promise.all(allItems.map(async (item) => {
                    const marketPrice = await fetchMarketPrice(item.name, item.id, item.edition, item.grade, item.type);
                    return { ...item, marketPrice: marketPrice || item.purchase_price };
                }));

                if (verbose) console.log("Items with market price:", itemsWithMarketPrice);

                // Process the data for reports
                const totalCost = itemsWithMarketPrice.reduce((sum, item) => sum + (parseFloat(item.purchase_price) * item.quantity), 0);
                const totalMarketPrice = itemsWithMarketPrice.reduce((sum, item) => sum + (parseFloat(item.marketPrice) * item.quantity), 0);
                const totalProfit = totalMarketPrice - totalCost;
                const sets = [...new Set(itemsWithMarketPrice.map(item => item.edition))];
                const gradeTenCount = itemsWithMarketPrice.filter(item => item.grade == 10).length;

                setReportData({
                    totalCost: totalCost,
                    itemsCount: itemsWithMarketPrice.length,
                    averageItemPrice: itemsWithMarketPrice.length > 0 ? (totalCost / itemsWithMarketPrice.length) : 0,
                    top5ExpensiveItems: itemsWithMarketPrice.sort((a, b) => b.marketPrice - a.marketPrice).slice(0, 5),
                    totalMarketPrice: totalMarketPrice,
                    totalProfit: totalProfit,
                    itemsWithMarketPrice: itemsWithMarketPrice,
                    sets: sets,
                    gradeTenCount: gradeTenCount,
                    itemsProfit: itemsWithMarketPrice.map(item => ({ 
                        ...item, 
                        profit: (parseFloat(item.marketPrice) - parseFloat(item.purchase_price)) * item.quantity 
                    }))
                });
            } catch (err) {
                console.error('Error fetching report data:', err);
                setError('Failed to load report data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchReportData();
    }, [id, verbose]);

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

    const { totalCost, itemsCount, averageItemPrice, top5ExpensiveItems, totalMarketPrice, totalProfit, sets, gradeTenCount, itemsProfit } = reportData;

    const pieChartData = [
        { name: 'Investment', value: totalCost },
        { name: 'Profit', value: totalProfit > 0 ? totalProfit : 0 },
    ];

    const COLORS = ['#0088FE', '#00C49F'];

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
                                <Typography variant="h6" gutterBottom>Total Items</Typography>
                                <Typography variant="h3">{itemsCount}</Typography>
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
                                <Typography>Average Item Price: ${averageItemPrice.toFixed(2)}</Typography>
                                <Typography>Total Market Price: ${totalMarketPrice.toFixed(2)}</Typography>
                                <Typography>Number of Sets: {sets.length}</Typography>
                                <Typography>Number of Grade Tens: {gradeTenCount}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card className="detail-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>5 Most Valuable Items</Typography>
                                <Divider className="card-divider" />
                                {top5ExpensiveItems.map((item, index) => (
                                    <Typography key={index} className="top-item-item">
                                        {item.name} - ${item.marketPrice.toFixed(2)}
                                    </Typography>
                                ))}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card className="detail-card">
                            <CardContent className="scrollable-container">
                                <Typography variant="h6" gutterBottom>Most Profitable Items</Typography>
                                <Divider className="card-divider" />
                                {itemsProfit
                                    .filter(item => item.profit > 0)
                                    .sort((a, b) => b.profit - a.profit)
                                    .map((item, index) => (
                                        <Typography key={index} className="top-item-item">
                                            {item.name} - ${item.profit.toFixed(2)}
                                        </Typography>
                                    ))}
                            </CardContent>
                        </Card>
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Card className="detail-card">
                            <CardContent>
                                <Typography variant="h6" gutterBottom>Profit and Investment</Typography>
                                <Divider className="card-divider" />
                                <Box height={300}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={pieChartData}
                                                cx="50%"
                                                cy="50%"
                                                labelLine={false}
                                                outerRadius={80}
                                                fill="#8884d8"
                                                dataKey="value"
                                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                            >
                                                {pieChartData.map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </Box>
                                <Typography>Total Investment: ${totalCost.toFixed(2)}</Typography>
                                <Typography>Total Profit: ${totalProfit.toFixed(2)}</Typography>
                            </CardContent>
                        </Card>
                    </Grid>
                </Grid>
            </Container>
            <div className="pokemon-characters">
                <img src={Clefairy} alt="Clefairy" className="clefairy-image" />
                <ChatBubble onSendMessage={handleSendMessage} collectionData={reportData} />
                <div className="snorlax-container">
                    <img src={Snorlax} alt="Snorlax" className="snorlax-image" />
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                    <div className="bubble"></div>
                </div>
            </div>
        </div>
    );
};

export default Reports;
