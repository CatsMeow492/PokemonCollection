import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { ClipLoader } from 'react-spinners';
import useRouteLoading from '../hooks/useRouteLoading';
import '../styles/Header.css';
import { ShoppingCart } from '@mui/icons-material';

const Header = () => {
    const loading = useRouteLoading();

    return (
        <AppBar position="static" className="header">
            <Toolbar>
                <Typography variant="h6" style={{ flexGrow: 1, textAlign: 'left' }}>
                    Pokédex
                </Typography>
                <Button color="inherit" component={Link} to="/shop">
                    Shop
                </Button>
                <Button color="inherit" component={Link} to="/">
                    Collection
                </Button>
                <Button color="inherit" component={Link} to="/reports">
                    Reports
                </Button>
                <Button color="inherit" component={Link} to="/cart">
                    <ShoppingCart />
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
