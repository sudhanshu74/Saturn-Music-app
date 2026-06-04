import React, { useContext } from 'react';
import { AudioContext } from '../context/AudioContext';
import { ShuffleIcon, PrevIcon, PlayIcon, PauseIcon, NextIcon, VolumeIcon } from './Icons';

const Player = () => {
  const { 
    currentSong, isPlaying, isShuffle, 
    togglePlay, playNext, playPrevious, setIsShuffle, audioRef 
  } = useContext(AudioContext);

  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);
  const [isBuffering, setIsBuffering] = React.useState(false);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const updateTime = () => setCurrentTime(audio.currentTime);
    const updateDuration = () => setDuration(audio.duration);
    const handleWaiting = () => setIsBuffering(true);
    const handleCanPlay = () => setIsBuffering(false);

    audio.addEventListener('timeupdate', updateTime);
    audio.addEventListener('loadedmetadata', updateDuration);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('canplay', handleCanPlay);

    setCurrentTime(audio.currentTime);
    setDuration(audio.duration || 0);

    return () => {
      audio.removeEventListener('timeupdate', updateTime);
      audio.removeEventListener('loadedmetadata', updateDuration);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('canplay', handleCanPlay);
    };
  }, [audioRef, currentSong]);

  const formatTime = (seconds) => {
    if (isNaN(seconds)) return "00:00";
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleSeek = (e) => {
    const percent = e.target.value;
    audioRef.current.currentTime = (percent / 100) * duration;
  };

  // FIXED: Replaced h-[8vh] with h-[65px] md:h-[75px] and added shrink-0
  if (!currentSong) return (
    <footer className="flex justify-center items-center h-[65px] md:h-[75px] w-full bg-footer-gradient font-boogaloo text-white text-base md:text-xl text-center px-4 shrink-0">
      Select a song from your library to start listening...
    </footer>
  );

  // FIXED: Replaced h-[9vh] with h-[65px] md:h-[75px] and added shrink-0
  return (
    <footer className="relative flex justify-center items-center h-[65px] md:h-[75px] w-full bg-footer-gradient font-boogaloo select-none shrink-0">
      
      <input
        type="range"
        min="0"
        max="100"
        value={(currentTime / duration) * 100 || 0}
        onChange={handleSeek}
        className="absolute top-0 left-0 w-full h-[4px] cursor-pointer appearance-none bg-white/30 hover:bg-[#31c93b] transition-colors z-10"
      />

      <div className="flex justify-between items-center w-full px-4 md:px-5 gap-4">
        
        <div className="flex items-center gap-2 md:gap-3 flex-1 min-w-0">
          <img 
            src={currentSong.coverUrl} 
            onError={(e) => e.target.src = '/saturnlogo.svg'} 
            className="w-10 h-10 md:w-12 md:h-12 rounded object-cover shadow-lg shrink-0" 
            alt="cover"
          />
          <div className="overflow-hidden leading-tight">
             <p className="text-sm md:text-[1.1rem] font-luckiest truncate text-white">{currentSong.title}</p>
             <p className="text-xs md:text-[0.9rem] text-white/80 truncate">{currentSong.artist}</p>
          </div>
        </div>

        <div className="flex justify-center items-center gap-3 md:gap-8 shrink-0">
          <button 
            onClick={() => setIsShuffle(!isShuffle)} 
            className={`flex items-center justify-center transition-all duration-300 ${isShuffle ? 'text-[#31c93b]' : 'text-white/40 hover:text-white'}`}
          >
            <ShuffleIcon className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          
          <button onClick={playPrevious} className="opacity-70 hover:opacity-100 hover:-translate-x-1 transition-all flex items-center justify-center">
            <PrevIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
          
          <button 
            onClick={togglePlay} 
            className="opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-300 flex items-center justify-center shrink-0"
          >
            {isBuffering ? (
              <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-[#31c93b] border-t-transparent rounded-full animate-spin"></div>
            ) : isPlaying ? (
              <PauseIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
            ) : (
              <PlayIcon className="w-10 h-10 md:w-12 md:h-12 text-white" />
            )}
          </button>
          
          <button onClick={playNext} className="opacity-70 hover:opacity-100 hover:translate-x-1 transition-all flex items-center justify-center">
            <NextIcon className="w-6 h-6 md:w-7 md:h-7 text-white" />
          </button>
        </div>

        <div className="hidden md:flex items-center justify-end gap-4 flex-1 text-[1.1rem] text-white min-w-0">
          <span className="w-24 text-right whitespace-nowrap">{formatTime(currentTime)} / {formatTime(duration)}</span>
          <div className="flex items-center gap-2 ml-2 shrink-0">
            <VolumeIcon className="w-5 h-5 text-white opacity-70" />
            <input 
              type="range" 
              min="0" max="100" defaultValue="100"
              className="w-16 lg:w-20 cursor-pointer"
              onChange={(e) => audioRef.current.volume = e.target.value / 100} 
            />
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Player;