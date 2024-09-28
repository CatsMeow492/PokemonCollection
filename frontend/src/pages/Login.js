import React, { useState, useContext } from 'react';
import AuthContext from '../context/AuthContext';
import config from '../config';
import { loginUser } from '../utils/apiUtils';

const Login = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const verbose = config;
  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = await loginUser(username, password);
    if (verbose) console.log('Login successful', token);
    login(token);
  };

  return (
    <form onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Login</button>
    </form>
  );
};

export default Login;
