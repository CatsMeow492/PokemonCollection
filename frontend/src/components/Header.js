import React from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import '../styles/Header.css';

const Header = () => {
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
            </Toolbar>
        </AppBar>
    );
};

export default Header;
