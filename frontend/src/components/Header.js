import React, { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Avatar, Menu, MenuItem } from '@mui/material';
import useRouteLoading from '../hooks/useRouteLoading';
import '../styles/Header.css';
import { ShoppingCart } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';
import { ClipLoader } from 'react-spinners';

const Header = () => {
    const loading = useRouteLoading();
    const { isAuthenticated, username, profilePicture, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const [anchorEl, setAnchorEl] = useState(null);

    const defaultProfilePicture = 'https://i.pinimg.com/originals/45/84/c0/4584c0b11190ed3bd738acf8f1d24fa4.jpg';

    const handleMenuOpen = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
    };

    const handleProfileClick = () => {
        handleMenuClose();
        navigate('/profile');
    };

    const handleLogout = () => {
        handleMenuClose();
        logout();
        navigate('/login');
    };

    return (
        <AppBar position="static" className="header">
            <Toolbar>
                <Typography variant="h6" style={{ flexGrow: 1, textAlign: 'left' }}>
                    Pokédex
                </Typography>
                <Button color="inherit" component={Link} to="/shop">
                    {loading && isAuthenticated ? <ClipLoader size={20} color="#ffffff" /> : 'Shop'}
                </Button>
                <Button color="inherit" component={Link} to="/">
                    {loading && isAuthenticated ? <ClipLoader size={20} color="#ffffff" /> : 'Collection'}
                </Button>
                <Button color="inherit" component={Link} to="/reports">
                    {loading && isAuthenticated ? <ClipLoader size={20} color="#ffffff" /> : 'Reports'}
                </Button>
                {!isAuthenticated && (
                    <Button color="inherit" component={Link} to="/register">
                        Register
                    </Button>
                )}
                {isAuthenticated && (
                    <>
                        <Button
                            color="inherit"
                            style={{ color: 'white' }}
                            onClick={handleMenuOpen}
                        >
                            <Avatar 
                                src={profilePicture || defaultProfilePicture} 
                                alt="Profile" 
                                style={{ width: '30px', height: '30px', marginRight: '10px' }} 
                            />
                            {username}
                        </Button>
                        <Menu
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleMenuClose}
                        >
                            <MenuItem onClick={handleProfileClick}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                        <Button color="inherit" component={Link} to="/cart">
                            {loading ? <ClipLoader size={20} color="#ffffff" /> : <ShoppingCart />}
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;
