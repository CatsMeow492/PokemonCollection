import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { ClipLoader } from 'react-spinners';
import useRouteLoading from '../hooks/useRouteLoading';
import '../styles/Header.css';
import { ShoppingCart } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';
const Header = () => {
    const loading = useRouteLoading();
    const { isAuthenticated } = useContext(AuthContext);

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
                {/* If the user is authenticated, show the username 
                if not, show the register button */}
                {!isAuthenticated && (
                    <Button color="inherit" component={Link} to="/register">
                        Register
                    </Button>
                )}
                {isAuthenticated && (
                    <Button color="inherit" component={Link} to="/cart">
                        <ShoppingCart />
                    </Button>
                )}
                <Button color="inherit" component={Link} to="/cart">
                    <ShoppingCart />
                </Button>
            </Toolbar>
        </AppBar>
    );
};

export default Header;
