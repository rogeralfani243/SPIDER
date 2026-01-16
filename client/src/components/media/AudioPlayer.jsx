import React, { useRef, useState, useEffect, useCallback } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute } from 'react-icons/fa';

const AudioPlayer = ({ src, autoPlay = false, loop = false }) => {
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [waveformData, setWaveformData] = useState([]);

  // Générer des données de waveform
  useEffect(() => {
    const generateWaveform = () => {
      const bars = 50;
      const fakeWaveform = Array.from({ length: bars }, () => 
        Math.random() * 0.5 + 0.3
      );
      setWaveformData(fakeWaveform);
    };
    
    generateWaveform();
  }, []);

  // Formater le temps
  const formatTime = (time) => {
    if (!time || isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const handleProgressMouseDown = (e) => {
    setIsDraggingProgress(true);
    handleProgressChange(e);
  };

  const handleProgressMouseUp = () => {
    setIsDraggingProgress(false);
  };

  const handleProgressChange = (e) => {
    if (!progressBarRef.current || duration === 0 || !isDraggingProgress) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    setCurrentTime(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    audioRef.current.muted = newMuted;
    
    if (!newMuted && volume === 0) {
      const newVolume = 0.5;
      setVolume(newVolume);
      audioRef.current.volume = newVolume;
    }
  };

  const handleVolumeChange = (e) => {
    if (!audioRef.current) return;
    
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    audioRef.current.volume = newVolume;
    
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const handleMouseMove = useCallback((e) => {
    if (isDraggingProgress) {
      handleProgressChange(e);
    }
  }, [isDraggingProgress, handleProgressChange]);

  const handleMouseUp = useCallback(() => {
    if (isDraggingProgress) {
      setIsDraggingProgress(false);
    }
  }, [isDraggingProgress]);

  // Écouter les événements de souris globaux
  useEffect(() => {
    if (isDraggingProgress) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingProgress, handleMouseMove, handleMouseUp]);

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        src={src}
        autoPlay={autoPlay}
        loop={loop}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
      >
        Your browser does not support the audio element.
      </audio>

      <div className="audio-controls2" style={{backgroundColor:'none'}}>
   
        <div className="audio-info " >
          <div className="whatsapp-audio-player  " style={{boxShadow:'none'}}>
            <div className="whatsapp-player-container audio-form">
              {/* WhatsApp-style audio waveform */}
              <div className="whatsapp-waveform-container ">
                <div 
                  className="whatsapp-waveform "
                  ref={progressBarRef}
                  onMouseDown={handleProgressMouseDown}
                >
                  {waveformData.map((amplitude, index) => {
                    const barProgress = (index / waveformData.length) * 100;
                    const isPlayed = barProgress < (currentTime / Math.max(duration, 1)) * 100;
                    
                    return (
                      <div
                        key={index}
                        className={`whatsapp-waveform-bar ${isPlayed ? 'played' : ''} ${isPlaying ? 'pulse' : ''}`}
                        style={{
                        
                          height: `${Math.max(amplitude * 60 + 50, 15)}%`,
                          width: '4px',
                          borderRadius: '2px',
                          margin: '0 1px',
                          backgroundColor: isPlayed ? '#25D366' : '#ddd',
                          transition: 'background-color 0.2s ease, height 0.3s ease',
                          animation: isPlaying && isPlayed ? 'pulse 1s infinite' : 'none'
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
          
  
        </div>

      </div>
    </div>
  );
};

export default AudioPlayer;