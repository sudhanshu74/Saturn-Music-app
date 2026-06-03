import { Link } from 'react-router-dom';
import React, { useContext, useState } from 'react';
import { AudioContext } from '../context/AudioContext';
import { AuthContext } from '../context/AuthContext';
import UserProfile from './UserProfile';
import { SearchIcon, CloseIcon } from './Icons'; // <-- IMPORTED HERE

const Header = () => {
  const { searchQuery, setSearchQuery, isMobileMenuOpen, setIsMobileMenuOpen } = useContext(AudioContext);
  const { user } = useContext(AuthContext);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 flex justify-between items-center h-[10vh] min-h-[60px] w-full px-2 md:pr-6 bg-header-gradient gap-2 md:gap-3">
      <div className="flex items-center gap-2 md:gap-5 ml-1 md:ml-2 flex-1 min-w-0">
        <a href="/" className="h-[8vh] md:h-[10vh] p-1 md:p-2 shrink-0">
          <img src="/saturnlogo.svg" alt="Logo" className="h-full" />
        </a>
        <a href="/" className="hidden md:block h-[6vh] p-2 hover:scale-105 transition-transform shrink-0">
          <img src="/homelogo.svg" alt="Home" className="h-full" />
        </a>

        <div className="flex items-center bg-[#101010b3] flex-1 max-w-[500px] h-[5.5vh] md:h-[7vh] px-3 md:px-4 rounded-full min-w-0">

          <SearchIcon className="w-[20px] h-[20px] md:w-[30px] md:h-[30px] stroke-[#d58a8a] mr-1.5 md:mr-2 shrink-0" />

          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search..."
            className="bg-transparent border-none outline-none flex-1 font-boogaloo text-[1.1rem] md:text-[1.4rem] text-saturnText min-w-0 w-full"
          />

          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="ml-1 md:ml-2 w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors shrink-0 outline-none"
              title="Clear search"
            >
              <CloseIcon className="w-4 h-4 md:w-5 md:h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 md:gap-5 relative shrink-0">
        {user ? (
          <UserProfile isOpen={isProfileOpen} setIsOpen={setIsProfileOpen} />
        ) : (
          <div className="hidden md:flex items-center gap-3">
            <Link to="/auth" state={{ isSignUp: true }} className="no-underline font-light text-sm md:text-[1.1rem] text-white hover:text-[#31c93b] transition-colors whitespace-nowrap">
              SIGN UP
            </Link>
            <Link to="/auth" state={{ isSignUp: false }}>
              <button className="bg-[wheat] text-[#28013f] px-3 py-1.5 md:px-5 md:py-2 text-sm md:text-[1.2rem] rounded-2xl font-luckiest cursor-pointer hover:bg-white transition-colors whitespace-nowrap">
                Log In
              </button>
            </Link>
          </div>
        )}
        <img
          src="/hamburger.svg"
          alt="menu"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="block md:hidden cursor-pointer w-7 h-7 hover:opacity-80 transition-opacity ml-1 select-none"
        />
      </div>
    </header>
  );
};

export default Header;