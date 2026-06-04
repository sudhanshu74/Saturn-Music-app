import React, { useContext } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MainContent from './components/MainContent';
import Player from './components/Player';
import Auth from "./pages/auth"; 
import { AudioContext } from './context/AudioContext'; // <-- IMPORT CONTEXT

const MainLayout = () => {
  const { showAuthModal, setShowAuthModal } = useContext(AudioContext);
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 w-full flex flex-col bg-black p-2 gap-2 overflow-hidden font-boogaloo">
      <Header />
      <div className="flex flex-1 gap-2 overflow-hidden">
        <Sidebar />
        <MainContent />
      </div>
      <Player />

      {/* --- THE CUSTOM AUTH PROMPT MODAL --- */}
      {showAuthModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-[100] p-4 animate-fade-in">
          <div className="bg-[#1a1a1a] border border-[#333] p-8 rounded-2xl max-w-md w-full text-center shadow-2xl">
            <img src="/saturnlogo.svg" alt="Saturn Logo" className="h-12 mx-auto mb-4" />
            <h2 className="text-2xl font-luckiest text-white mb-2 tracking-wide">
              Start building your library
            </h2>
            <p className="text-[#b3b3b3] mb-6 font-sans text-sm">
              Log in to your account to save songs and create playlists, or sign up for free to get started.
            </p>
            
            <div className="flex flex-col gap-3 font-luckiest tracking-wider">
              <button 
                onClick={() => { setShowAuthModal(false); navigate('/auth', { state: { isSignUp: true } }); }}
                className="w-full bg-[wheat] hover:bg-white text-[#28013f] text-xl py-3 rounded-full transition-colors"
              >
                SIGN UP FOR FREE
              </button>
              
              <button 
                onClick={() => { setShowAuthModal(false); navigate('/auth', { state: { isSignUp: false } }); }}
                className="w-full bg-transparent border-2 border-[#333] hover:border-[#31c93b] text-white text-xl py-3 rounded-full transition-colors"
              >
                LOG IN TO ACCOUNT
              </button>
            </div>

            <button 
              onClick={() => setShowAuthModal(false)}
              className="mt-6 text-sm text-gray-500 hover:text-white transition-colors font-sans"
            >
              Not now, keep listening
            </button>
          </div>
        </div>
      )}
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