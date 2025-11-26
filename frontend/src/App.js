import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { connectSocket, disconnectSocket } from './services/socket';
import Login from './pages/Login';
import Signup from './pages/Signup';
import AdminDashboard from './pages/admin/AdminDashboard';
import SupplierDashboard from './pages/supplier/SupplierDashboard';
import NotFound from './pages/NotFound';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (token && storedUser) {
      setUser(JSON.parse(storedUser));
      connectSocket();
    }

    setLoading(false);

    return () => {
      disconnectSocket();
    };
  }, []);

  const handleLogin = (userData, token) => {
    setUser(userData);
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    connectSocket();
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    disconnectSocket();
  };

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login onLogin={handleLogin} />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        {user ? (
          <>
            {user.role === 'admin' ? (
              <Route path="/admin/*" element={<AdminDashboard user={user} onLogout={handleLogout} />} />
            ) : (
              <Route path="/supplier/*" element={<SupplierDashboard user={user} onLogout={handleLogout} />} />
            )}
            <Route path="/" element={<Navigate to={user.role === 'admin' ? '/admin' : '/supplier'} />} />
          </>
        ) : (
          <>
            <Route path="/" element={<Navigate to="/login" />} />
            <Route path="/admin/*" element={<Navigate to="/login" />} />
            <Route path="/supplier/*" element={<Navigate to="/login" />} />
          </>
        )}

        {/* 404 */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </Router>
  );
}

export default App;
