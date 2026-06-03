// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    const storedToken = localStorage.getItem('saturn_token');
    const storedUser = localStorage.getItem('saturn_user');
    // Notice: We don't look for the refresh token anymore!

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
  }, []);

  // Update login to no longer expect refreshTok
  const login = (accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('saturn_token', accessToken);
    localStorage.setItem('saturn_user', JSON.stringify(userData));
    navigate('/'); 
  };

  const logout = async () => {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' // <-- THIS TELLS THE BROWSER TO SEND THE COOKIE!
      });
    } catch (err) {
      console.error("Failed to notify server of logout");
    }

    setToken(null);
    setUser(null);
    localStorage.removeItem('saturn_token');
    localStorage.removeItem('saturn_user');
    navigate('/auth'); 
  };

  return (
    <AuthContext.Provider value={{ user, token, setToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};