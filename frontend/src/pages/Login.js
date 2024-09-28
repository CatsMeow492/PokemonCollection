import React, { useState, useContext } from 'react';
import { 
  Container, 
  Paper, 
  Typography, 
  TextField, 
  Button, 
  Box,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import AuthContext from '../context/AuthContext';
import config from '../config';
import { loginUser } from '../utils/apiUtils';
import "../styles/Login.css";

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
  },
});

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [profilePicture, setProfilePicture] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useContext(AuthContext);
  const verbose = config;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { token, username: loggedInUsername } = await loginUser(username, password);
      if (verbose) console.log(`Login successful: ${token}, ${loggedInUsername}`);
      login(token, loggedInUsername, profilePicture);
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword);
  };

  return (
    <ThemeProvider theme={darkTheme}>
      <Container component="main" maxWidth="xs" className="login-container">
        <Paper elevation={3} className="login-paper">
          <Typography component="h1" variant="h5" className="login-title">
            Sign in
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
              className="login-button"
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
};

export default Login;
