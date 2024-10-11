import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import './App.css';  // Make sure this import is present
import Header from './components/Header';
import CardList from './pages/CardList';
import Reports from './pages/Reports';
import Shop from './pages/Shop';
import ProfilePage from './pages/ProfilePage';
import ProtectedRoute from './components/ProtectedRoute';
import Cart from './pages/Cart';
import Auth from './pages/Auth';
import CardMarketData from './pages/CardMarketData';
import { AuthProvider } from './context/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="App">
          <Header />
          <div className="content">
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute />}>
                <Route path="/" element={<CardList />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/card-market-data/:cardId" element={<CardMarketData />} />
              </Route>
            </Routes>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
