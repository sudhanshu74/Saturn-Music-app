import React, { useContext, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AudioContext } from '../context/AudioContext';
import { AuthContext } from '../context/AuthContext';
import { fetchWithAuth } from '../utils/api'; 
import { HomeIcon, CloseIcon, BackIcon, PlusIcon, TrashIcon } from './Icons'; // <-- IMPORTED HERE

const Sidebar = () => {
  const { playlists, setPlaylists, activePlaylistId, setActivePlaylistId, playSong, isMobileMenuOpen, setIsMobileMenuOpen } = useContext(AudioContext);
  const { token, user } = useContext(AuthContext);

  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreatingPlaylist, setIsCreatingPlaylist] = useState(false);
  
  const [isPlaylistsLoading, setIsPlaylistsLoading] = useState(false);
  const [playlistsError, setPlaylistsError] = useState("");

  useEffect(() => {
    const fetchUserPlaylists = async () => {
      if (!token) return;
      setIsPlaylistsLoading(true);
      setPlaylistsError("");
      try {
        const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/playlists`);
        if (response.ok) {
          const data = await response.json();
          setPlaylists(data);
        } else {
          setPlaylistsError("Failed to load library.");
        }
      } catch (err) {
        console.error("Failed to load playlists", err);
        setPlaylistsError("Network error.");
      } finally {
        setIsPlaylistsLoading(false);
      }
    };
    fetchUserPlaylists();
  }, [token, setPlaylists]);

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return; 
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/playlists`, {
        method: 'POST',
        body: JSON.stringify({ name: newPlaylistName })
      });
      if (response.ok) {
        const newPlaylist = await response.json();
        setPlaylists([...playlists, newPlaylist]);
        setNewPlaylistName("");
        setIsCreatingPlaylist(false);
      } else {
        const errorData = await response.json();
        alert(`Could not create playlist: ${errorData.message}`); 
      }
    } catch (error) {
      console.error("Failed to create playlist", error);
      alert("Server error.");
    }
  };

  const handleDeletePlaylist = async (e, playlistId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this playlist?")) return;
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setPlaylists(playlists.filter(p => p._id !== playlistId));
        if (activePlaylistId === playlistId) setActivePlaylistId(null);
      }
    } catch (error) {
      console.error("Failed to delete playlist", error);
    }
  };

  const handleRemoveSong = async (e, playlistId, songId) => {
    e.stopPropagation(); 
    try {
      const response = await fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/playlists/${playlistId}/remove-song/${songId}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        const updatedPlaylist = await response.json();
        setPlaylists(playlists.map(p => p._id === playlistId ? updatedPlaylist : p));
      }
    } catch (error) {
      console.error("Failed to remove song", error);
    }
  };

  const activePlaylist = playlists.find(p => p._id === activePlaylistId);
  const selectPlaylistOnMobile = (id) => {
    setActivePlaylistId(id);
    setIsMobileMenuOpen(false); 
  };

  return (
    <>
      {isMobileMenuOpen && (
        <div 
          onClick={() => setIsMobileMenuOpen(false)}
          className="fixed inset-0 bg-black/70 z-40 md:hidden animate-fade-in"
        />
      )}

      <div className={`
        fixed inset-y-0 left-0 z-50 w-[75vw] sm:w-[50vw] bg-[#121212] p-4 gap-6 font-boogaloo h-full flex flex-col overflow-hidden transition-transform duration-300 rounded-r-[10px] md:rounded-r-none
        md:static md:w-[25vw] md:flex md:translate-x-0 md:rounded-[10px]
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>

        <div className="flex justify-between items-center shrink-0">
          <button
            onClick={() => selectPlaylistOnMobile(null)}
            className={`flex items-center gap-3 hover:text-white transition-colors text-lg font-luckiest ${activePlaylistId === null ? 'text-[#31c93b]' : 'text-white/70'}`}
          >
            <HomeIcon className="w-5 h-5" />
            Home / Search
          </button>
          <button 
            onClick={() => setIsMobileMenuOpen(false)}
            className="md:hidden w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20"
          >
            <CloseIcon className="w-4 h-4" />
          </button>
        </div>

        <hr className="border-[#2a2a2a] shrink-0" />

        <div className="flex flex-col flex-1 overflow-y-auto no-scrollbar">

          {activePlaylist ? (
            <div className="flex flex-col animate-fade-in pb-20">
              <button
                onClick={() => setActivePlaylistId(null)}
                className="flex items-center gap-2 text-left text-sm text-gray-400 hover:text-white mb-4 transition-colors"
              >
                <BackIcon className="w-4 h-4" />
                Back to Library
              </button>

              <h2 className="text-2xl text-white font-luckiest mb-1 leading-tight">{activePlaylist.name}</h2>
              <p className="text-xs text-[#31c93b] mb-4">{activePlaylist.songs.length} Tracks</p>

              <div className="flex flex-col gap-2">
                {activePlaylist.songs.length === 0 ? (
                  <p className="text-sm text-gray-500 mt-4 text-center">No songs yet.</p>
                ) : (
                  activePlaylist.songs.map((song) => (
                    <div
                      key={song._id}
                      onClick={() => { playSong(song, activePlaylist.songs); setIsMobileMenuOpen(false); }}
                      className="flex items-center justify-between p-2 hover:bg-[#2a2a2a] rounded cursor-pointer group transition-colors"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <img 
                          src={song.coverUrl} 
                          onError={(e) => e.target.src = '/saturnlogo.svg'} 
                          className="w-10 h-10 rounded object-cover shadow-md shrink-0" 
                          alt="cover" 
                        />
                        <div className="flex flex-col overflow-hidden w-full">
                          <span className="text-sm text-white truncate group-hover:text-[#31c93b] transition-colors">{song.title}</span>
                          <span className="text-xs text-gray-400 truncate">{song.artist}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => handleRemoveSong(e, activePlaylist._id, song._id)}
                        className="hidden group-hover:flex shrink-0 items-center justify-center w-7 h-7 rounded-full text-gray-500 hover:text-red-400 hover:bg-[#31c93b]/30 transition-all"
                      >
                        <CloseIcon className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            <div className="flex flex-col animate-fade-in pb-20">

              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white/70 font-luckiest tracking-wide text-sm">YOUR LIBRARY</h2>
                <button
                  onClick={() => setIsCreatingPlaylist(!isCreatingPlaylist)}
                  className="w-8 h-8 rounded-full text-white flex items-center justify-center transition-all duration-300 hover:bg-[#31c93b]/30"
                >
                  <PlusIcon className="w-5 h-5" />
                </button>
              </div>

              {isCreatingPlaylist && (
                <div className="flex flex-col gap-2 mb-4 animate-fade-in bg-[#1a1a1a] p-3 rounded-lg border border-[#2a2a2a]">
                  <input
                    type="text"
                    value={newPlaylistName}
                    onChange={(e) => setNewPlaylistName(e.target.value)}
                    placeholder="Playlist Name..."
                    autoFocus
                    className="w-full px-3 py-1.5 rounded bg-[#2a2a2a] text-white text-sm outline-none focus:ring-1 focus:ring-[#31c93b]"
                  />
                  <div className="flex justify-end gap-2 mt-1">
                    <button
                      onClick={() => { setIsCreatingPlaylist(false); setNewPlaylistName(""); }}
                      className="text-xs text-gray-400 hover:text-white px-2 py-1"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreatePlaylist}
                      className="bg-[#31c93b] text-black px-4 py-1 rounded-full text-xs font-bold hover:scale-105 transition-transform"
                    >
                      Save
                    </button>
                  </div>
                </div>
              )}

              {isPlaylistsLoading ? (
                <div className="p-2 text-sm text-[#31c93b] animate-pulse">Loading library...</div>
              ) : playlistsError ? (
                <div className="p-2 text-sm text-red-400">{playlistsError}</div>
              ) : playlists.length === 0 ? (
                <div className="p-2 text-sm text-gray-500">No playlists yet.</div>
              ) : (
                <ul className="flex flex-col gap-1">
                  {playlists.map(p => (
                    <li
                      key={p._id}
                      onClick={() => selectPlaylistOnMobile(p._id)}
                      className="p-2.5 rounded flex justify-between items-center cursor-pointer transition-colors text-white hover:bg-[#1a1a1a] group"
                    >
                      <span className="truncate w-3/4 group-hover:text-[#31c93b] transition-colors">{p.name}</span>
                      <div className="flex items-center">
                        <span className="text-xs text-gray-500 group-hover:hidden">{p.songs.length}</span>
                        <button
                          onClick={(e) => handleDeletePlaylist(e, p._id)}
                          className="hidden group-hover:flex items-center justify-center w-7 h-7 rounded-full text-gray-500 hover:text-red-500 hover:bg-white/10 transition-colors"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {!user && (
          <div className="md:hidden shrink-0 pt-4 border-t border-[#2a2a2a] flex flex-col gap-3 mt-auto">
            <Link to="/auth" state={{ isSignUp: false }} onClick={() => setIsMobileMenuOpen(false)}>
              <button className="w-full bg-[wheat] text-[#28013f] px-5 py-2.5 text-[1.2rem] rounded-2xl font-luckiest hover:bg-white transition-colors">
                Log In
              </button>
            </Link>
            <Link to="/auth" state={{ isSignUp: true }} onClick={() => setIsMobileMenuOpen(false)} className="text-center">
              <span className="font-light text-[1.1rem] text-white hover:text-[#31c93b] transition-colors">
                Sign up
              </span>
            </Link>
          </div>
        )}

      </div>
    </>
  );
};

export default Sidebar;