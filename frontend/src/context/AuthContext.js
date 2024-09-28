import React, { createContext, useState, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
const verbose = config;
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check if the user is authenticated (e.g., by checking a token in localStorage)
    if (verbose) {
      console.log('Checking if the user is authenticated');
    }
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      if (verbose) {
        console.log('User is authenticated');
      }
    }
  }, []);

  const login = (token) => {
    localStorage.setItem('token', token);
    setIsAuthenticated(true);
    if (verbose) {
      console.log('User is authenticated');
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setIsAuthenticated(false);
    if (verbose) {
      console.log('User is logged out');
    }
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
