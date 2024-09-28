import React, { createContext, useState, useEffect } from 'react';
import config from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
	const verbose = config;
	const [isAuthenticated, setIsAuthenticated] = useState(false);
	const [username, setUsername] = useState('');
	const [profilePicture, setProfilePicture] = useState('');

	useEffect(() => {
		// Check if the user is authenticated (e.g., by checking a token in localStorage)
		if (verbose) {
			console.log('Checking if the user is authenticated');
		}
		const token = localStorage.getItem('token');
		const storedUsername = localStorage.getItem('username');
		const storedProfilePicture = localStorage.getItem('profile_picture');
		if (token && storedUsername) {
			setIsAuthenticated(true);
			setUsername(storedUsername);
			setProfilePicture(storedProfilePicture);
			if (verbose) {
				console.log('User is authenticated');
			}
		}
	}, []);

	const login = (token, username, profilePicture) => {
		localStorage.setItem('token', token);
		localStorage.setItem('username', username);
		localStorage.setItem('profile_picture', profilePicture);
		setIsAuthenticated(true);
		setUsername(username);
		setProfilePicture(profilePicture);
		if (verbose) {
			console.log('User is authenticated', username);
		}
	};

	const logout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('username');
		setIsAuthenticated(false);
		setUsername('');
		setProfilePicture('');
		if (verbose) {
			console.log('User is logged out');
		}
	};

	return (
		<AuthContext.Provider value={{ isAuthenticated, username, profilePicture, login, logout }}>
			{children}
		</AuthContext.Provider>
	);
};

export default AuthContext;
