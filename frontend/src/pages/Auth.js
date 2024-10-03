import React, { useState, useContext, useEffect } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box,
  InputAdornment,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom'; // Import useNavigate
import AuthContext from '../context/AuthContext';
import config from '../config';
import { loginUser, registerUser } from '../utils/apiUtils';
import "../styles/Auth.css";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Auth = () => {
  const [tab, setTab] = useState(0);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isAuthenticated } = useContext(AuthContext); // Destructure isAuthenticated
  const verbose = config;
  const navigate = useNavigate(); // Initialize navigate

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/'); // Redirect to /cardlist if already authenticated
    }
  }, [isAuthenticated, navigate]);

  const handleTabChange = (event, newValue) => {
    setTab(newValue);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (tab === 0) {
      // Sign In
      try {
        const { token, username: loggedInUsername, id, profile_picture } = await loginUser(username, password);
        if (verbose) console.log(`Login successful: ${token}, ${loggedInUsername}, ${id}`);
        login(token, loggedInUsername, id, profile_picture); // Ensure id is passed here
        navigate('/'); // Redirect to /collection after login
      } catch (error) {
        console.error('Login failed:', error);
      }
    } else {
      // Register
      try {
        if (verbose) console.log(`Registering user: ${username}, ${password}, ${email}`);
        await registerUser(username, password, email);
        console.log('Registration successful');
      } catch (error) {
        console.error('Registration failed:', error);
      }
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container component="main" maxWidth="xs" className="auth-container">
        <Paper elevation={3} className="auth-paper">
          <Tabs value={tab} onChange={handleTabChange} centered>
            <Tab label="Sign In" />
            <Tab label="Register" />
          </Tabs>
          <Typography component="h1" variant="h5" className="auth-title">
            {tab === 0 ? 'Sign In' : 'Register'}
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate sx={{ mt: 1 }}>
            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
              label="Username"
              name="username"
              autoComplete="username"
              autoFocus
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            {tab === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                id="email"
                label="Email"
                name="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleClickShowPassword}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              className="auth-button"
            >
              {tab === 0 ? 'Sign In' : 'Register'}
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Auth;
