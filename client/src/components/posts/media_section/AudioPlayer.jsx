import React, { useEffect, useCallback, useState } from 'react';
import { 
  FiPlay, FiPause, FiVolume2, FiVolumeX, 
  FiRewind, FiFastForward, FiRepeat, FiShuffle
} from 'react-icons/fi';
import { MdAudioFile } from 'react-icons/md';
import { getFileName } from '../../../utils/mediaUtils';

const AudioPlayer = ({
  media,
  isPlaying,
  volume,
  muted,
  currentTime,
  duration,
  playbackRate,
  isRepeating,
  isShuffling,
  waveformData,
  isDraggingVolume,
  isDraggingProgress,
  audioInitialized,
  audioRef,
  volumeSliderRef,
  progressBarRef,
  volumeContainerRef,
  audioContextRef,
  analyserRef,
  animationFrameRef,
  onIsPlayingChange,
  onVolumeChange,
  onMutedChange,
  onCurrentTimeChange,
  onDurationChange,
  onPlaybackRateChange,
  onIsRepeatingChange,
  onIsShufflingChange,
  onWaveformDataChange,
  onIsDraggingVolumeChange,
  onIsDraggingProgressChange,
  onAudioInitializedChange
}) => {
  const url = media?.url || media;
  const fileName = getFileName(media);

  // Generate fake waveform data
  useEffect(() => {
    const fakeWaveform = Array.from({ length: 50 }, () => 
      Math.random() * 0.5 + 0.3
    );
    onWaveformDataChange(fakeWaveform);
  }, [onWaveformDataChange]);

  // Initialize audio with user interaction
  const initializeAudio = useCallback(async () => {
    if (!audioRef.current || audioInitialized) return;
    
    try {
      if (!audioContextRef.current) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        
        if (audioRef.current) {
          audioRef.current.volume = volume;
          audioRef.current.muted = muted;
        }
      }
      
      if (audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      onAudioInitializedChange(true);
    } catch (error) {
      console.error("Audio initialization failed:", error);
    }
  }, [audioRef, audioInitialized, audioContextRef, volume, muted, onAudioInitializedChange]);

  // Audio analyzer initialization - ADDED MISSING FUNCTION
  const initAudioAnalyzer = useCallback(() => {
    if (!audioRef.current || !audioContextRef.current) return;
    
    try {
      const source = audioContextRef.current.createMediaElementSource(audioRef.current);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 128;
      analyserRef.current.smoothingTimeConstant = 0.8;
      
      source.connect(analyserRef.current);
      analyserRef.current.connect(audioContextRef.current.destination);
    } catch (error) {
      console.warn('Audio analyzer setup failed:', error);
    }
  }, [audioRef, audioContextRef, analyserRef]);

  const updateWaveform = useCallback(() => {
    if (!analyserRef.current || !isPlaying) return;
    
    try {
      const bufferLength = analyserRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const reducedData = [];
      const step = Math.floor(bufferLength / 40);
      
      for (let i = 0; i < 40; i++) {
        let sum = 0;
        for (let j = 0; j < step; j++) {
          sum += dataArray[i * step + j] || 0;
        }
        reducedData.push((sum / step) / 255);
      }
      
      onWaveformDataChange(reducedData);
      
      if (isPlaying) {
        animationFrameRef.current = requestAnimationFrame(updateWaveform);
      }
    } catch (error) {
      console.warn('Waveform update failed:', error);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    }
  }, [analyserRef, isPlaying, animationFrameRef, onWaveformDataChange]);

  // Handle audio play with Web Audio API
  const handleAudioPlay = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      if (!audioInitialized) {
        await initializeAudio();
      }
      
      if (audioContextRef.current && audioContextRef.current.state === 'suspended') {
        await audioContextRef.current.resume();
      }
      
      if (!analyserRef.current) {
        initAudioAnalyzer();
      }
      
      await audioRef.current.play();
      onIsPlayingChange(true);
      updateWaveform();
    } catch (error) {
      console.error('Error playing audio:', error);
      onIsPlayingChange(false);
      
      if (error.name === 'NotAllowedError') {
        audioRef.current.play().then(() => {
          onIsPlayingChange(true);
        }).catch(fallbackError => {
          console.error("Fallback also failed:", fallbackError);
        });
      }
    }
  }, [audioRef, audioInitialized, initializeAudio, audioContextRef, analyserRef, initAudioAnalyzer, onIsPlayingChange, updateWaveform]);

  // Toggle play/pause
  const togglePlayPause = useCallback(async () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
      onIsPlayingChange(false);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    } else {
      await handleAudioPlay();
    }
  }, [audioRef, isPlaying, onIsPlayingChange, animationFrameRef, handleAudioPlay]);

  // Seek function
  const seek = useCallback((seconds) => {
    if (audioRef.current) {
      const newTime = Math.max(0, Math.min(audioRef.current.currentTime + seconds, duration || 0));
      audioRef.current.currentTime = newTime;
      onCurrentTimeChange(newTime);
    }
  }, [audioRef, duration, onCurrentTimeChange]);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Fix for volume: Sync volume state with audio element
  useEffect(() => {
    if (audioRef.current) {
      // Apply volume to audio element (but respect mute state)
      audioRef.current.volume = muted ? 0 : volume;
    }
  }, [volume, muted, audioRef]);

  // Fix for playback speed: Apply playbackRate to audio element
  useEffect(() => {
    if (audioRef.current && playbackRate) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioRef]);

  // Volume control
  const handleVolumeMouseDown = (e) => {
    onIsDraggingVolumeChange(true);
    handleVolumeChange(e);
  };

  const handleVolumeChange = (e) => {
    if (!volumeContainerRef.current) return;
    
    const rect = volumeContainerRef.current.getBoundingClientRect();
    const clickY = e.clientY;
    const relativeY = rect.bottom - clickY;
    const percentage = Math.max(0, Math.min(1, relativeY / rect.height));
    
    onVolumeChange(percentage);
    
    // CRITICAL: Also update audio element immediately
    if (audioRef.current) {
      audioRef.current.volume = percentage;
      
      // If volume is set above 0, ensure mute is false
      if (percentage > 0 && muted) {
        audioRef.current.muted = false;
        // Don't update state here to avoid race conditions
      }
    }
  };

  const handleVolumeMouseUp = () => {
    onIsDraggingVolumeChange(false);
  };

  const toggleMute = () => {
    const newMuted = !muted;
    onMutedChange(newMuted);
    
    if (audioRef.current) {
      // Apply mute state to audio element
      audioRef.current.muted = newMuted;
      
      // If unmuting and volume is 0, set to default 0.5
      if (!newMuted && volume === 0) {
        onVolumeChange(0.5);
        // Also update audio element volume immediately
        audioRef.current.volume = 0.5;
      }
    }
  };

  // Progress bar control
  const handleProgressMouseDown = (e) => {
    onIsDraggingProgressChange(true);
    handleProgressChange(e);
  };

  const handleProgressMouseUp = () => {
    onIsDraggingProgressChange(false);
  };

  const handleProgressChange = (e) => {
    if (!progressBarRef.current || duration === 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    onCurrentTimeChange(newTime);
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  // Handle time update from audio element
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current && !isDraggingProgress) {
      onCurrentTimeChange(audioRef.current.currentTime);
      if (!duration || isNaN(duration)) {
        onDurationChange(audioRef.current.duration || 0);
      }
    }
  }, [audioRef, isDraggingProgress, duration, onCurrentTimeChange, onDurationChange]);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current) {
      onDurationChange(audioRef.current.duration || 0);
      if (audioRef.current.readyState >= 2) {
        setTimeout(() => {
          if (!analyserRef.current && audioContextRef.current) {
            initAudioAnalyzer();
          }
        }, 100);
      }
    }
  }, [audioRef, onDurationChange, analyserRef, audioContextRef, initAudioAnalyzer]);

  // Handle play event
  const handlePlay = useCallback(() => {
    onIsPlayingChange(true);
    updateWaveform();
  }, [onIsPlayingChange, updateWaveform]);

  // Handle pause event
  const handlePause = useCallback(() => {
    onIsPlayingChange(false);
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
  }, [onIsPlayingChange, animationFrameRef]);

  if (!url || typeof url !== 'string') {
    return (
      <div className="whatsapp-audio-player">
        <div className="whatsapp-player-container">
          <div className="error-message">
            <MdAudioFile size={48} color="#dc2626" />
            <h3>Fichier audio non disponible</h3>
            <p>L'URL du fichier audio est invalide ou manquante</p>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="whatsapp-audio-player">
      <div className="whatsapp-player-container">
        {/* Audio info */}
       
        
        {/* WhatsApp-style audio waveform */}
        <div className="whatsapp-waveform-container">
          <div 
            className="whatsapp-waveform"
            ref={progressBarRef}
            onMouseDown={handleProgressMouseDown}
            onMouseMove={isDraggingProgress ? handleProgressChange : undefined}
            onMouseUp={handleProgressMouseUp}
            onMouseLeave={handleProgressMouseUp}
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
          
          {/* Progress line */}
         
        </div>
        
        {/* Debug info */}
      
  
         
          <div className="whatsapp-audio-details" style={{display:'flex', justifyContent:'center'}}>

            <div className="whatsapp-audio-time">
              <span>{formatTime(currentTime)}</span>
              <span> / </span>
              <span>{formatTime(duration)}</span>
              
            </div>
          </div>
     
        {/* Main controls */}
        <div className="whatsapp-controls">
   
          
          <button 
            className="whatsapp-control-btn"
            onClick={() => seek(-10)}
            title="Rewind 10s"
          >
            <FiRewind />
          </button>
          
          <button 
            className="whatsapp-play-btn"
            onClick={togglePlayPause}
            disabled={!audioInitialized && process.env.NODE_ENV === 'production'}
           style={{borderRadius:'50%'}}
         >
            {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
          </button>
          
          <button 
            className="whatsapp-control-btn"
            onClick={() => seek(10)}
            title="Forward 10s"
          >
            <FiFastForward />
          </button>
          
     
        </div>
        
        {/* Volume and speed controls */}
        <div className="whatsapp-secondary-controls">
          <div className="whatsapp-volume-control">
            <button 
              className="whatsapp-volume-btn"
              onClick={toggleMute}
              title={muted ? "Unmute" : "Mute"}
            >
              {muted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
            </button>
            
            <div className="whatsapp-volume-slider-container">
              <div 
                className="whatsapp-volume-slider-track"
                ref={volumeContainerRef}
                onMouseDown={handleVolumeMouseDown}
                onMouseMove={isDraggingVolume ? handleVolumeChange : undefined}
                onMouseUp={handleVolumeMouseUp}
                onMouseLeave={handleVolumeMouseUp}
              >
                <div 
                  className="whatsapp-volume-slider-fill"
                  style={{ height: `${muted ? 0 : volume * 100}%` }}
                />
              </div>
            </div>
            
            <span className="whatsapp-volume-percentage">
              {muted ? 'Muet' : `${Math.round(volume * 100)}%`}
            </span>
          </div>
          
          <div className="whatsapp-speed-control">
            <select 
              value={playbackRate}
              onChange={(e) => onPlaybackRateChange(parseFloat(e.target.value))}
              className="whatsapp-speed-select"
            >
              <option value="0.5">0.5x</option>
              <option value="0.75">0.75x</option>
              <option value="1">1x</option>
              <option value="1.25">1.25x</option>
              <option value="1.5">1.5x</option>
              <option value="2">2x</option>
            </select>
          </div>
        </div>
      </div>
      
      {/* Audio element - CRITICAL CORRECTION */}
      <audio
        ref={audioRef}
        src={url}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onPlay={handlePlay}
        onPause={handlePause}
        onEnded={() => {
          if (isRepeating && audioRef.current) {
            audioRef.current.currentTime = 0;
            audioRef.current.play().catch(console.error);
          } else {
            handlePause();
          }
        }}
        onError={(e) => {
          console.error('Audio error:', e);
          console.error('Audio source:', url);
          console.error('Audio element error:', audioRef.current?.error);
        }}
        preload="metadata"
        crossOrigin="anonymous"
      />
    </div>
  );
};

export default AudioPlayer;