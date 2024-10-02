import React, { createContext, useState, useEffect } from 'react';
import config from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const { verbose } = config;
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [username, setUsername] = useState('');
	const [profilePicture, setProfilePicture] = useState('');
	const [id, setId] = useState(null);

	useEffect(() => {
		// Check if user is authenticated (e.g., by checking for a token in localStorage)
		const token = localStorage.getItem('token');
		const storedUsername = localStorage.getItem('username');
		const storedProfilePicture = localStorage.getItem('profilePicture');
		if (token && storedUsername) {
			setIsAuthenticated(true);
			setUsername(storedUsername);
			setProfilePicture(storedProfilePicture || '');
			setId(localStorage.getItem('id'));
			if (verbose) {
				console.log('User is authenticated');
			}
		}
	}, []);

	const login = (token, username, id, profilePicture) => {
		console.log('Login function called with:', token, username, profilePicture);
		localStorage.setItem('token', token);
		localStorage.setItem('username', username);
		localStorage.setItem('profilePicture', profilePicture || '');
		localStorage.setItem('id', id);
		setIsAuthenticated(true);
		setUsername(username);
		setProfilePicture(profilePicture || '');
		setId(id);
		if (verbose) {
			console.log('User is authenticated', username, profilePicture);
		}
	};

	const logout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		localStorage.removeItem('profilePicture');
		localStorage.removeItem('id');
		setIsAuthenticated(false);
		setUsername('');
		setProfilePicture('');
		setId(null);
		if (verbose) {
			console.log('User is logged out');
		}
	};

	const updateProfile = (newUsername, newProfilePicture) => {
		setUsername(newUsername);
		setProfilePicture(newProfilePicture);
		localStorage.setItem('username', newUsername);
		localStorage.setItem('profilePicture', newProfilePicture);
		localStorage.setItem('id', id);
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, username, profilePicture, id, login, logout, updateProfile }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
