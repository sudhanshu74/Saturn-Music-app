import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
// This now perfectly matches your file tree:
import Auth from "./pages/auth"; 

const MainLayout = () => {
  return (
    <div className="flex flex-col h-screen bg-black p-2 gap-2 overflow-hidden font-boogaloo">
      <Header />
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
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/*" element={<MainLayout />} />
    </Routes>
  );
};

export default App;