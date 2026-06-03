import React, { createContext, useState, useRef, useEffect } from 'react';
import { fetchWithAuth } from '../utils/api'; 

export const AudioContext = createContext();

export const AudioProvider = ({ children }) => {

  const audioRef = useRef(new Audio());

  const [currentSong, setCurrentSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [queue, setQueue] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [activePlaylistId, setActivePlaylistId] = useState(null); 
  const [library, setLibrary] = useState([]);
  const [playlists, setPlaylists] = useState([]);

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchRealMusic = async () => {
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/songs/search?q=${searchQuery}`);
        if (res.ok) {
          const data = await res.json();
          setLibrary(data);
        }
      } catch (err) {
        console.error("Failed to load internet music:", err);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchRealMusic();
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [searchQuery]); 

  const playSong = (song, currentQueue = library) => {
    setQueue(currentQueue);
    setCurrentSong(song);
    audioRef.current.src = song.audioUrl;
    audioRef.current.play();
    setIsPlaying(true);

    if (song && song.artist) {
      fetchWithAuth(`${import.meta.env.VITE_API_URL}/api/songs/log-play`, {
        method: 'POST',
        body: JSON.stringify({ artist: song.artist })
      }).catch(err => console.error("Silently failed to log play")); 
    }
  };

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const playNext = () => {
    if (queue.length === 0) return;
    let currentIndex = queue.findIndex(s => s._id === currentSong?._id);
    let nextIndex;

    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * queue.length);
      if (queue.length > 1 && nextIndex === currentIndex) {
        nextIndex = (nextIndex + 1) % queue.length;
      }
    } else {
      nextIndex = currentIndex + 1 < queue.length ? currentIndex + 1 : 0;
    }

    playSong(queue[nextIndex], queue);
  };

  const playPrevious = () => {
    if (queue.length === 0) return; 
    let currentIndex = queue.findIndex(s => s._id === currentSong?._id);
    let prevIndex = currentIndex - 1 >= 0 ? currentIndex - 1 : queue.length - 1;
    playSong(queue[prevIndex], queue);
  };

  useEffect(() => {
    const audio = audioRef.current;
    const handleEnded = () => playNext();
    audio.addEventListener('ended', handleEnded);
    return () => {
      audio.removeEventListener('ended', handleEnded);
    };
  }, [currentSong, queue, isShuffle]);

  return (
    <AudioContext.Provider value={{
      audioRef, currentSong, isPlaying, isShuffle, queue,
      library, playlists, setPlaylists,
      playSong, togglePlay, playNext, playPrevious, setIsShuffle,
      searchQuery, setSearchQuery,
      activePlaylistId, setActivePlaylistId,
      isMobileMenuOpen, setIsMobileMenuOpen
    }}>
      {children}
    </AudioContext.Provider>
  );
};