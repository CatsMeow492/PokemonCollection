import React, { useContext } from 'react';
import { Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Button, Avatar } from '@mui/material';
import { ClipLoader } from 'react-spinners';
import useRouteLoading from '../hooks/useRouteLoading';
import '../styles/Header.css';
import { ShoppingCart } from '@mui/icons-material';
import AuthContext from '../context/AuthContext';

const Header = () => {
    const loading = useRouteLoading();
    const { isAuthenticated, username, profilePicture } = useContext(AuthContext);

    const defaultProfilePicture = 'https://i.pinimg.com/originals/45/84/c0/4584c0b11190ed3bd738acf8f1d24fa4.jpg';

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
                {!isAuthenticated && (
                    <Button color="inherit" component={Link} to="/register">
                        Register
                    </Button>
                )}
                {isAuthenticated && (
                    <>
                        <Button color="inherit" style={{ color: 'white' }}>
                            <Avatar 
                                src={profilePicture || defaultProfilePicture} 
                                alt="Profile" 
                                style={{ width: '30px', height: '30px', marginRight: '10px' }} 
                            />
                            {username}
                        </Button>
                        <Button color="inherit" component={Link} to="/cart">
                            <ShoppingCart />
                        </Button>
                    </>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default Header;
