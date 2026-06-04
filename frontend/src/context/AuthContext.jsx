// src/context/AuthContext.jsx
import React, { createContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null); 
  const navigate = useNavigate();

  useEffect(() => {
    // 1. Initial Load: Check for existing session when a tab opens
    const storedToken = localStorage.getItem('saturn_token');
    const storedUser = localStorage.getItem('saturn_user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    // 2. CROSS-TAB SYNCHRONIZATION
    // This function only fires in *other* background tabs when localStorage changes
    const handleStorageChange = (e) => {
      // If Tab A removes the token, Tab B sees 'newValue' as null
      if (e.key === 'saturn_token' && e.newValue === null) {
        setToken(null);
        setUser(null);
        window.location.replace('/'); // Instantly redirect background tabs to home
      }
      
      // BONUS: If Tab A logs in, Tab B instantly logs in too!
      if (e.key === 'saturn_token' && e.newValue !== null) {
        const updatedUser = localStorage.getItem('saturn_user');
        if (updatedUser) {
          setToken(e.newValue);
          setUser(JSON.parse(updatedUser));
        }
      }
    };

    // Attach the listener to the browser window
    window.addEventListener('storage', handleStorageChange);

    // Cleanup listener when component unmounts (best practice)
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const login = (accessToken, userData) => {
    setToken(accessToken);
    setUser(userData);
    localStorage.setItem('saturn_token', accessToken);
    localStorage.setItem('saturn_user', JSON.stringify(userData));
    navigate('/'); 
  };

  const logout = async () => {
    try {
      // Notify backend to securely invalidate the refresh token cookie
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include' 
      });
    } catch (err) {
      console.error("Failed to notify server of logout");
    }

    // 1. Clear local React Context state
    setToken(null);
    setUser(null);
    
    // 2. Erase all persistent storage data
    // THIS is what triggers the 'storage' event in all other background tabs!
    localStorage.removeItem('saturn_token');
    localStorage.removeItem('saturn_user');
    
    // 3. Hard redirect to the public home page for the current tab
    window.location.replace('/'); 
  };

  return (
    <AuthContext.Provider value={{ user, token, setToken, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};