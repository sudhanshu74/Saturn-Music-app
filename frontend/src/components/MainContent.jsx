import React, { useContext, useState, useEffect } from 'react';
import { AudioContext } from '../context/AudioContext';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api';
import SongCard from './SongCard'; // <-- IMPORT NEW COMPONENT

const MainContent = () => {
  const { playlists, setPlaylists, library, playSong, searchQuery, activePlaylistId } = useContext(AudioContext);
  const { token } = useContext(AuthContext);

  const [dailyMix, setDailyMix] = useState([]);
  const [isLoadingMix, setIsLoadingMix] = useState(true);
  const [mixError, setMixError] = useState("");
  const [visibleCount, setVisibleCount] = useState(50);

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