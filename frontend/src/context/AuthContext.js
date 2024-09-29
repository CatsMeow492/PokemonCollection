import React, { createContext, useState, useEffect } from 'react';
import config from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const { verbose } = config;
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [username, setUsername] = useState('');
	const [profilePicture, setProfilePicture] = useState('');

	useEffect(() => {
		// Check if user is authenticated (e.g., by checking for a token in localStorage)
		const token = localStorage.getItem('token');
		const storedUsername = localStorage.getItem('username');
		const storedProfilePicture = localStorage.getItem('profilePicture');
		if (token && storedUsername) {
			setIsAuthenticated(true);
			setUsername(storedUsername);
			setProfilePicture(storedProfilePicture || '');
			if (verbose) {
				console.log('User is authenticated');
			}
		}
	}, []);

	const login = (token, username, profilePicture) => {
		console.log('Login function called with:', token, username, profilePicture);
		localStorage.setItem('token', token);
		localStorage.setItem('username', username);
		localStorage.setItem('profilePicture', profilePicture || '');
		setIsAuthenticated(true);
		setUsername(username);
		setProfilePicture(profilePicture || '');
		if (verbose) {
			console.log('User is authenticated', username, profilePicture);
		}
	};

	const logout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		localStorage.removeItem('profilePicture');
		setIsAuthenticated(false);
		setUsername('');
		setProfilePicture('');
		if (verbose) {
			console.log('User is logged out');
		}
	};

	const updateProfile = (newUsername, newProfilePicture) => {
		setUsername(newUsername);
		setProfilePicture(newProfilePicture);
		localStorage.setItem('username', newUsername);
		localStorage.setItem('profilePicture', newProfilePicture);
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, username, profilePicture, login, logout, updateProfile }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
