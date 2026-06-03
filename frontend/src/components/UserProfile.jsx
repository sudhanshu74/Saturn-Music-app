import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

const UserProfile = ({ isOpen, setIsOpen }) => {
  const { user, setToken, setUser } = useContext(AuthContext);

  const handleLogout = () => {
    localStorage.removeItem('saturn_token');
    localStorage.removeItem('saturn_refreshToken');
    localStorage.removeItem('saturn_user');
    
    if (setToken) setToken(null);
    if (setUser) setUser(null);
    
    window.location.href = '/auth'; 
  };

  if (!user) return null;

  const togglePanel = (e) => {
    e.stopPropagation(); 
    setIsOpen(!isOpen);
  };

  return (
    <div className="relative font-luckiest flex items-center justify-center">
      
      <div 
        onClick={togglePanel}
        className={`w-10 h-10 md:w-12 md:h-12 rounded-full cursor-pointer flex items-center justify-center transition-all duration-300 border-2 select-none group pt-1
          ${isOpen 
            ? 'bg-cardHover border-[#31c93b] scale-110 shadow-lg' 
            : 'bg-[#1a1a1a] border-[#333] hover:border-[#31c93b] hover:scale-105'
          }
        `}
      >
        <span className={`text-2xl md:text-3xl transition-colors duration-300 
          ${isOpen ? 'text-[#31c93b]' : 'text-[wheat] group-hover:text-[#31c93b]'}
        `}>
          {user.username.charAt(0).toUpperCase()}
        </span> 
      </div>

      {isOpen && (
        <>
          <div 
            onClick={() => setIsOpen(false)} 
            className="fixed inset-0 z-40 cursor-default" 
          />

          <div 
            onClick={(e) => e.stopPropagation()} 
            className="absolute top-14 right-0 w-[260px] md:w-[300px] z-50 bg-[#1a1a1a] p-5 md:p-6 rounded-[10px] border border-[#333] shadow-xl flex flex-col gap-4 animate-slideDown"
          >
            <div className="flex flex-col gap-2">
              <span className="text-[#b3b3b3] text-xs md:text-sm uppercase tracking-widest font-bold font-sans">
                Logged in as
              </span>
              
              <div className="bg-[#101010] p-3 md:p-4 rounded-lg flex flex-col gap-2.5">
                <span className="text-xl md:text-2xl text-[wheat] tracking-wider truncate">
                  {user.username.charAt(0).toUpperCase() + user.username.slice(1)}
                </span>
                
                <div className="flex">
                  <span className="bg-[#31c93b]/10 text-[#31c93b] text-sm md:text-base px-2 py-1 rounded-md tracking-tight font-sans truncate">
                    {user.email || 'user@saturn.co'}
                  </span>
                </div>

                <span className="text-lg md:text-xl text-[#31c93b] underline tracking-tight truncate">
                  {user.username}
                </span>
              </div>
            </div>

            <button 
              onClick={handleLogout}
              className="bg-red-500 text-white font-luckiest px-6 py-2 md:py-2.5 rounded-lg text-base md:text-lg tracking-wider hover:bg-red-600 transition-colors duration-300 shadow-md"
            >
              LOGOUT
            </button>
            
          </div>
        </>
      )}
      
    </div>
  );
};

export default UserProfile;