import React, { useContext, useState, useEffect } from 'react';
import { AudioContext } from '../context/AudioContext';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';
import { PlayCircleIcon, PlusIcon, CheckIcon } from './Icons'; 

const SongCard = ({ song, library, playSong, playlists, activePlaylistId, onAddToPlaylist }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const activePlaylist = playlists.find(p => p._id === activePlaylistId);
  const isAlreadyAdded = activePlaylist?.songs.some(s => s._id === song._id);

  return (
    <div
      onClick={() => playSong(song, library)}
      className="group w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] transition-colors duration-300 rounded-[10px] p-2.5 md:p-3 flex flex-col relative cursor-pointer"
    >
      <div className="relative w-full h-[140px] md:h-[180px] mb-2 md:mb-3 overflow-hidden rounded-[10px]">
        <div className={`absolute inset-0 bg-[#333] animate-pulse ${isLoaded ? 'opacity-0' : 'opacity-100'} transition-opacity duration-300`} />

        <img
          src={song.coverUrl}
          onError={(e) => { e.target.src = '/saturnlogo.svg'; }}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
          alt="cover"
          onLoad={() => setIsLoaded(true)}
        />
        <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            playSong(song, library);
          }}
          className="absolute bottom-2 right-2 w-10 h-10 md:w-11 md:h-11 bg-[wheat] text-[#28013f] rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-xl translate-y-2 group-hover:translate-y-0 z-20 hover:scale-110 hover:bg-white"
        >
          <PlayCircleIcon className="w-4 h-4 md:w-5 md:h-5 ml-0.5" />
        </button>

        {playlists.length > 0 && (
          <div className="absolute top-2 right-2 z-20">
            {activePlaylistId ? (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isAlreadyAdded) onAddToPlaylist(activePlaylistId, song);
                }}
                className={`w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center transition-all shadow-md 
                  ${isAlreadyAdded
                    ? 'bg-[#31c93b] text-black opacity-100 cursor-default'
                    : 'bg-black/60 hover:bg-[#31c93b] text-white hover:text-black opacity-0 group-hover:opacity-100'
                  }`}
              >
                {isAlreadyAdded ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5" /> : <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="w-7 h-7 md:w-8 md:h-8 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-md"
                >
                  <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                {showMenu && (
                  <div className="absolute top-10 right-0 w-32 md:w-36 bg-[#282828] border border-[#444] rounded-md shadow-xl py-2 z-30">
                    <p className="px-2 md:px-3 pb-1 text-[10px] md:text-xs text-gray-400 font-sans border-b border-[#444] mb-1">Add to Playlist</p>
                    {playlists.map(p => (
                      <button
                        key={p._id}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToPlaylist(p._id, song);
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-2 md:px-3 py-1.5 text-xs md:text-sm text-white hover:bg-[#3e3e3e] truncate transition-colors"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <h2 className="text-white font-luckiest text-sm md:text-lg truncate">{song.title}</h2>
      <p className="text-[0.75rem] md:text-[0.9rem] text-[#b3b3b3] truncate">{song.artist}</p>
    </div>
  );
};

const MainContent = () => {
  const { playlists, setPlaylists, library, playSong, searchQuery, activePlaylistId } = useContext(AudioContext);
  const { token } = useContext(AuthContext);

  const [dailyMix, setDailyMix] = useState([]);
  const [isLoadingMix, setIsLoadingMix] = useState(true);
  const [mixError, setMixError] = useState("");

  // --- NEW: UI Pagination State ---
  const [visibleCount, setVisibleCount] = useState(50);

  // Reset pagination when the user clicks a new playlist or searches something new
  useEffect(() => {
    setVisibleCount(50);
  }, [activePlaylistId, searchQuery]);

  useEffect(() => {
    const fetchDailyMix = async () => {
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/songs/daily-mix`);
        if (response.ok) {
          const data = await response.json();
          setDailyMix(data);
        } else {
          setMixError("Failed to sync with server. Please try logging in again.");
        }
      } catch (error) {
        console.error("Failed to load daily mix", error);
        setMixError("Network error. Is the backend running?");
      } finally {
        setIsLoadingMix(false);
      }
    };

    if (token) fetchDailyMix();
    else setIsLoadingMix(false);
  }, [token]);

  const activePlaylist = playlists.find(p => p._id === activePlaylistId);

  const addSongToPlaylist = async (playlistId, song) => {
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}/add-song`, {
        method: 'POST',
        body: JSON.stringify({ song })
      });

      if (response.ok) {
        const updatedPlaylist = await response.json();
        setPlaylists(playlists.map(p => p._id === playlistId ? updatedPlaylist : p));
      } else {
        const data = await response.json();
        alert(data.message);
      }
    } catch (error) {
      console.error("Failed to add song", error);
    }
  };

  if (activePlaylistId) {
    const displayedSongs = activePlaylist.songs.slice(0, visibleCount);

    return (
      <div className="flex-[7.5] w-full p-4 md:p-6 flex flex-col font-boogaloo overflow-y-auto no-scrollbar bg-[#121212] rounded-[10px]">
        <h1 className="text-xl md:text-[2rem] text-white font-luckiest uppercase tracking-wide mb-4 md:mb-6">
          Find Songs for "{activePlaylist.name}"
        </h1>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 md:gap-5 pb-6">
          {displayedSongs.map(song => (
            <SongCard key={song._id} song={song} library={activePlaylist.songs} playSong={playSong} playlists={playlists} activePlaylistId={activePlaylistId} onAddToPlaylist={addSongToPlaylist} />
          ))}
        </div>
        
        {/* The "Load More" UI Pagination Button */}
        {activePlaylist.songs.length > visibleCount && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 50)} 
            className="mx-auto block text-[#31c93b] border-2 border-[#31c93b] rounded-full px-8 py-2.5 mb-10 hover:bg-[#31c93b] hover:text-black transition-colors font-luckiest tracking-wider"
          >
            LOAD MORE SONGS
          </button>
        )}
      </div>
    );
  }

  if (searchQuery) {
    const searchResults = library.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()) || s.artist.toLowerCase().includes(searchQuery.toLowerCase()));
    const displayedSearch = searchResults.slice(0, visibleCount);

    return (
      <div className="flex-[7.5] w-full p-4 md:p-6 flex flex-col font-boogaloo overflow-y-auto no-scrollbar bg-[#121212] rounded-[10px]">
        <h1 className="text-xl md:text-[2rem] text-white font-luckiest uppercase tracking-wide mb-4 md:mb-6">
          Search Results for "{searchQuery}"
        </h1>
        <div className="grid grid-cols-[repeat(auto-fill,minmax(140px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4 md:gap-5 pb-6">
          {displayedSearch.length === 0 ? (
            <div className="w-full text-center py-20 text-gray-400 text-base md:text-xl col-span-full">No music found.</div>
          ) : (
            displayedSearch.map(song => (
              <SongCard key={song._id} song={song} library={searchResults} playSong={playSong} playlists={playlists} onAddToPlaylist={addSongToPlaylist} />
            ))
          )}
        </div>

        {/* The "Load More" UI Pagination Button */}
        {searchResults.length > visibleCount && (
          <button 
            onClick={() => setVisibleCount(prev => prev + 50)} 
            className="mx-auto block text-[#31c93b] border-2 border-[#31c93b] rounded-full px-8 py-2.5 mb-10 hover:bg-[#31c93b] hover:text-black transition-colors font-luckiest tracking-wider"
          >
            LOAD MORE RESULTS
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex-[7.5] w-full p-4 md:p-6 flex flex-col font-boogaloo overflow-y-auto no-scrollbar bg-[#121212] rounded-[10px]">
      <div className="mb-8 md:mb-10">
        <h1 className="text-xl md:text-[2rem] text-white font-luckiest uppercase tracking-wide mb-4 md:mb-6">Your Daily Mix</h1>
        {!token ? (
          <div className="w-full py-6 text-[#31c93b] text-base md:text-xl">Log in to unlock your personalized Daily Mix!</div>
        ) : isLoadingMix ? (
          <div className="w-full py-6 text-[#31c93b] text-base md:text-xl animate-pulse">Curating your taste...</div>
        ) : mixError ? (
          <div className="w-full py-6 text-red-400 text-base md:text-xl">{mixError}</div>
        ) : dailyMix.length === 0 ? (
          <div className="w-full py-6 text-gray-400 text-base md:text-xl">No mix available yet.</div>
        ) : (
          <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 no-scrollbar scroll-smooth snap-x">
            {dailyMix.map(song => (
              <div key={song._id} className="w-[140px] md:w-[180px] flex-none snap-start">
                <SongCard song={song} library={dailyMix} playSong={playSong} playlists={playlists} onAddToPlaylist={addSongToPlaylist} />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mb-8 md:mb-10">
        <h1 className="text-xl md:text-[2rem] text-white font-luckiest uppercase tracking-wide mb-4 md:mb-6 text-gray-400">Trending Hits</h1>
        {library.length === 0 ? (
          <div className="w-full py-6 text-gray-400 text-base md:text-xl animate-pulse">Loading charts...</div>
        ) : (
          <div className="flex overflow-x-auto gap-4 md:gap-5 pb-4 no-scrollbar scroll-smooth snap-x">
            {library.slice(0, 15).map(song => (
              <div key={song._id} className="w-[140px] md:w-[180px] flex-none snap-start">
                <SongCard song={song} library={library} playSong={playSong} playlists={playlists} onAddToPlaylist={addSongToPlaylist} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MainContent;