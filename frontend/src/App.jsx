import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
import Auth from "./pages/auth"; // Adjust the path if you put this in a 'pages' folder

// This is your standard music player view
const MainLayout = () => {
  return (
    // 1. FIXED: Added bg-black, p-3 (padding around edges), and gap-3 (vertical spacing)
    <div className="flex flex-col h-screen bg-black p-2 gap-2 overflow-hidden font-boogaloo">
      
      <Header />
      
      {/* 2. FIXED: Added gap-3 (horizontal spacing between Sidebar and MainContent) */}
      <div className="flex flex-1 gap-2 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      
      <Player />
      
    </div>
  );
};

const App = () => {
  return (
    // React Router automatically switches between these two screens based on the URL!
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

export default App;