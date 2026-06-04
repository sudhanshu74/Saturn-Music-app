import React, { useState } from 'react';
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
        <div className="absolute inset-0 bg-black/30 opacity-0 md:group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

        <button
          onClick={(e) => {
            e.stopPropagation();
            playSong(song, library);
          }}
          // FIXED: Visible on mobile by default, hidden on desktop until hover
          className="absolute bottom-2 right-2 w-10 h-10 md:w-11 md:h-11 bg-[wheat] text-[#28013f] rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-all duration-300 shadow-xl md:translate-y-2 md:group-hover:translate-y-0 z-20 hover:scale-110 hover:bg-white"
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
                    : 'bg-black/60 hover:bg-[#31c93b] text-white hover:text-black opacity-100 md:opacity-0 md:group-hover:opacity-100'
                  }`}
              >
                {isAlreadyAdded ? <CheckIcon className="w-4 h-4 md:w-5 md:h-5" /> : <PlusIcon className="w-4 h-4 md:w-5 md:h-5" />}
              </button>
            ) : (
              <>
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="w-7 h-7 md:w-8 md:h-8 bg-black/60 hover:bg-black text-white rounded-full flex items-center justify-center opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity shadow-md"
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

export default SongCard;