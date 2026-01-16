import React, { useCallback, useEffect, useRef, useState } from 'react';
import { 
  FiPlay, FiPause, FiVolume2, FiVolumeX, 
  FiRewind, FiFastForward, FiMaximize2, FiMinimize2,
  FiRotateCw
} from 'react-icons/fi';
import { MdVideocam } from 'react-icons/md';
import { getFileName } from '../../../utils/mediaUtils';

const VideoPlayer = ({
  media,
  isPlaying,
  volume,
  muted,
  currentTime,
  duration,
  playbackRate,
  isRepeating,
  isDraggingVolume,
  isDraggingProgress,
  videoRef,
  volumeSliderRef,
  progressBarRef,
  volumeContainerRef,
  onIsPlayingChange,
  onVolumeChange,
  onMutedChange,
  onCurrentTimeChange,
  onDurationChange,
  onPlaybackRateChange,
  onIsRepeatingChange,
  onIsDraggingVolumeChange,
  onIsDraggingProgressChange,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const url = media?.url || media;
  const fileName = getFileName(media);
  const containerRef = useRef(null);
  const [isHovering, setIsHovering] = useState(false);
  const controlsTimeoutRef = useRef(null);
  const [waveformData, setWaveformData] = useState([]);
  const [showWaveform, setShowWaveform] = useState(false);
  const [isInFullscreen, setIsInFullscreen] = useState(false);
  const videoInstanceRef = useRef(null);

  // Générer des données de waveform fictives
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

  // Mettre à jour le playbackRate sur l'élément vidéo
  useEffect(() => {
    if (videoRef.current && playbackRate) {
      try {
        videoRef.current.playbackRate = playbackRate;
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
  }, [playbackRate, videoRef]);

  // Gestion du plein écran
  const toggleFullscreen = useCallback(async () => {
    try {
      if (!document.fullscreenElement) {
        // Entrer en plein écran
        if (containerRef.current?.requestFullscreen) {
          await containerRef.current.requestFullscreen();
        } else if (containerRef.current?.webkitRequestFullscreen) {
          await containerRef.current.webkitRequestFullscreen();
        } else if (containerRef.current?.mozRequestFullScreen) {
          await containerRef.current.mozRequestFullScreen();
        } else if (containerRef.current?.msRequestFullscreen) {
          await containerRef.current.msRequestFullscreen();
        }
        setIsInFullscreen(true);
      } else {
        // Quitter le plein écran
        if (document.exitFullscreen) {
          await document.exitFullscreen();
        } else if (document.webkitExitFullscreen) {
          await document.webkitExitFullscreen();
        } else if (document.mozCancelFullScreen) {
          await document.mozCancelFullScreen();
        } else if (document.msExitFullscreen) {
          await document.msExitFullscreen();
        }
        setIsInFullscreen(false);
      }
      
      // Appeler le callback parent si fourni
      if (onToggleFullscreen) {
        onToggleFullscreen(!isInFullscreen);
      }
    } catch (error) {
      console.error('Fullscreen error:', error);
    }
  }, [isInFullscreen, onToggleFullscreen]);

  // Écouter les changements de plein écran
  useEffect(() => {
    const handleFullscreenChange = () => {
      const fullscreenElement = document.fullscreenElement || 
                               document.webkitFullscreenElement || 
                               document.mozFullScreenElement || 
                               document.msFullscreenElement;
      setIsInFullscreen(!!fullscreenElement);
      
      // Mettre à jour le callback parent
      if (onToggleFullscreen) {
        onToggleFullscreen(!!fullscreenElement);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
    };
  }, [onToggleFullscreen]);

  // Arrêter toutes les autres vidéos lorsqu'une vidéo commence à jouer
  const stopOtherVideos = useCallback(() => {
    // Trouver toutes les vidéos sur la page sauf celle-ci
    const allVideos = document.querySelectorAll('video');
    allVideos.forEach(video => {
      if (video !== videoRef.current && !video.paused) {
        video.pause();
        video.currentTime = 0;
        
        // Déclencher l'événement pause sur les autres lecteurs vidéo
        const pauseEvent = new Event('pause');
        video.dispatchEvent(pauseEvent);
      }
    });
  }, [videoRef]);

  // Format time
  const formatTime = (seconds) => {
    if (!seconds || isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Toggle play/pause avec arrêt des autres vidéos
  const togglePlayPause = useCallback(() => {
    if (!videoRef.current) return;
    
    if (isPlaying) {
      videoRef.current.pause();
      onIsPlayingChange(false);
    } else {
      // Arrêter toutes les autres vidéos avant de jouer celle-ci
      stopOtherVideos();
      videoRef.current.play().catch(error => {
        console.error('Error playing video:', error);
        onIsPlayingChange(false);
      });
      onIsPlayingChange(true);
    }
  }, [videoRef, isPlaying, onIsPlayingChange, stopOtherVideos]);

  // Seek function
  const seek = useCallback((seconds) => {
    if (videoRef.current && duration) {
      const newTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
      videoRef.current.currentTime = newTime;
      onCurrentTimeChange(newTime);
    }
  }, [videoRef, duration, onCurrentTimeChange]);

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
    if (videoRef.current) {
      videoRef.current.volume = percentage;
    }
  };

  const handleVolumeMouseUp = () => {
    onIsDraggingVolumeChange(false);
  };

  const toggleMute = () => {
    const newMuted = !muted;
    onMutedChange(newMuted);
    
    if (videoRef.current) {
      videoRef.current.muted = newMuted;
      if (!newMuted && volume === 0) {
        const newVolume = 0.5;
        onVolumeChange(newVolume);
        videoRef.current.volume = newVolume;
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
    if (videoRef.current) {
      videoRef.current.currentTime = newTime;
    }
  };

  // Handle time update from video element
  const handleTimeUpdate = useCallback(() => {
    if (videoRef.current && !isDraggingProgress) {
      onCurrentTimeChange(videoRef.current.currentTime);
    }
  }, [videoRef, isDraggingProgress, onCurrentTimeChange]);

  // Handle loaded metadata
  const handleLoadedMetadata = useCallback(() => {
    if (videoRef.current) {
      onDurationChange(videoRef.current.duration || 0);
    }
  }, [videoRef, onDurationChange]);

  // Handle play event avec arrêt des autres vidéos
  const handlePlay = useCallback(() => {
    stopOtherVideos();
    onIsPlayingChange(true);
    setShowWaveform(true);
    startAutoHide();
    
    // Stocker la référence de la vidéo en cours de lecture
    videoInstanceRef.current = videoRef.current;
  }, [onIsPlayingChange, stopOtherVideos, videoRef]);

  // Handle pause event
  const handlePause = useCallback(() => {
    onIsPlayingChange(false);
    setShowWaveform(true);
    startAutoHide();
    
    // Effacer la référence si cette vidéo s'arrête
    if (videoInstanceRef.current === videoRef.current) {
      videoInstanceRef.current = null;
    }
  }, [onIsPlayingChange, videoRef]);

  // Gérer le survol
  const handleMouseEnter = () => {
    setIsHovering(true);
    setShowWaveform(true);
    clearTimeout(controlsTimeoutRef.current);
  };

  const handleMouseLeave = () => {
    setIsHovering(false);
    if (isPlaying) {
      startAutoHide();
    }
  };

  const handleMouseMove = () => {
    setShowWaveform(true);
    clearTimeout(controlsTimeoutRef.current);
    if (isPlaying) {
      startAutoHide();
    }
  };

  // Démarrer le masquage automatique
  const startAutoHide = () => {
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        setShowWaveform(false);
      }, 2000); // Masquer après 2 secondes
    }
  };

  // Handle video click avec double-clic pour plein écran
  const handleVideoClick = useCallback((e) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - (videoRef.current?.lastClickTime || 0);
    
    if (timeDiff < 300 && timeDiff > 0) {
      // Double-clic détecté - basculer plein écran
      e.stopPropagation();
      toggleFullscreen();
    } else {
      // Clic simple - play/pause
      togglePlayPause();
    }
    
    // Stocker le temps du dernier clic
    if (videoRef.current) {
      videoRef.current.lastClickTime = currentTime;
    }
  }, [togglePlayPause, toggleFullscreen, videoRef]);

  // Calculate progress percentage
  const progressPercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle playback rate change
  const handlePlaybackRateChange = useCallback((newRate) => {
    onPlaybackRateChange(newRate);
    
    // Mettre à jour directement sur l'élément vidéo
    if (videoRef.current) {
      try {
        videoRef.current.playbackRate = newRate;
      } catch (error) {
        console.error('Error setting playback rate:', error);
      }
    }
  }, [onPlaybackRateChange, videoRef]);

  // Handle repeat toggle
  const handleRepeatToggle = useCallback(() => {
    const newIsRepeating = !isRepeating;
    onIsRepeatingChange(newIsRepeating);
  }, [isRepeating, onIsRepeatingChange]);

  // Clean up timeouts
  useEffect(() => {
    return () => {
      if (controlsTimeoutRef.current) {
        clearTimeout(controlsTimeoutRef.current);
      }
    };
  }, []);

  // Masquer les barres après le démarrage de la lecture
  useEffect(() => {
    if (isPlaying) {
      const timer = setTimeout(() => {
        if (!isHovering) {
          setShowWaveform(false);
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isPlaying, isHovering]);

  // Toujours montrer les barres quand on interagit avec la vidéo
  useEffect(() => {
    if (!isPlaying) {
      setShowWaveform(true);
    }
  }, [isPlaying]);

  // Écouter les événements de lecture des autres vidéos
  useEffect(() => {
    const handleOtherVideoPlay = (e) => {
      // Si une autre vidéo commence à jouer et que cette vidéo est en cours de lecture
      if (e.target !== videoRef.current && isPlaying) {
        // Arrêter cette vidéo
        videoRef.current?.pause();
        onIsPlayingChange(false);
      }
    };

    // Écouter les événements play sur tous les éléments vidéo
    document.addEventListener('play', handleOtherVideoPlay, true);
    
    return () => {
      document.removeEventListener('play', handleOtherVideoPlay, true);
    };
  }, [isPlaying, videoRef, onIsPlayingChange]);

  // Gestionnaire de touches clavier
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Touche Échap pour quitter le plein écran
      if (e.key === 'Escape' && isInFullscreen) {
        toggleFullscreen();
      }
      
      // Touche Espace pour play/pause
      if (e.key === ' ' && containerRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        togglePlayPause();
      }
      
      // Touche F pour plein écran
      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isInFullscreen, toggleFullscreen, togglePlayPause]);

  if (!url || typeof url !== 'string') {
    return (
      <div className="whatsapp-video-player">
        <div className="whatsapp-video-container">
          <div className="error-message">
            <MdVideocam size={48} color="#dc2626" />
            <h3>Fichier vidéo non disponible</h3>
            <p>L'URL du fichier vidéo est invalide ou manquante</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="whatsapp-video-player"
      ref={containerRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onMouseMove={handleMouseMove}
      tabIndex={0} // Pour le focus clavier
    >
      <div className="whatsapp-video-container">
        {/* Video element */}
        <div 
          className="video-wrapper" 
          onClick={handleVideoClick}
          onDoubleClick={toggleFullscreen}
        >
          <video
            ref={videoRef}
            src={url}
            className="whatsapp-video"
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onPlay={handlePlay}
            onPause={handlePause}
            onEnded={() => {
              if (isRepeating && videoRef.current) {
                videoRef.current.currentTime = 0;
                videoRef.current.play().catch(console.error);
              } else {
                onIsPlayingChange(false);
                setShowWaveform(true);
              }
            }}
            onError={(e) => {
              console.error('Video error:', e);
              console.error('Video source:', url);
            }}
            preload="metadata"
            playsInline
            muted={muted}
          />
          
      
        </div>

        {/* Top bar - Video info (toujours visible) */}
        <div className={`video-controls-top ${showWaveform ? 'visible' : 'hidden'}`}>
          <div className="video-info">
            <span className="video-icon">
              <MdVideocam />
            </span>
            <div className="video-details">
             <span className="video-time">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>
          </div>
          <div className="video-top-controls">
            <button 
              className="control-btn fullscreen-btn"
              onClick={toggleFullscreen}
              title={isInFullscreen ? "Exit Fullscreen (Esc)" : "Enter Fullscreen (F)"}
            >
              {isInFullscreen ? <FiMinimize2 /> : <FiMaximize2 />}
            </button>
          </div>
        </div>

        {/* Middle - Play button (apparaît au survol) */}
        {showWaveform && (
          <div className="video-controls-middle">
            <button 
              className="video-big-play-btn"
              onClick={togglePlayPause}
              style={{borderRadius:'50%'}}
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <FiPause size={32} /> : <FiPlay size={32} />}
            </button>
          </div>
        )}

        {/* Bottom bar - Waveform et contrôles (apparaît au survol) */}
        <div className={`video-controls-bottom ${showWaveform ? 'visible' : 'hidden'}`}>
          {/* WhatsApp-style waveform progress bar */}
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
                      height: `${Math.max(amplitude * 60 + 30, 10)}%`,
                      width: '4px',
                      borderRadius: '2px',
                      margin: '0 1px',
                      backgroundColor: isPlayed ? '#25D366' : 'rgba(255, 255, 255, 0.5)',
                      transition: 'all 0.3s ease',
                      animation: isPlaying && isPlayed ? 'pulse 1s infinite' : 'none'
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Contrôles principaux */}
          <div className="video-main-controls">
            <div className="video-controls-left">
              <button 
                className="control-btn"
                onClick={() => seek(-10)}
                title="Rewind 10s"
              >
                <FiRewind />
              </button>
              
              <button 
                className="play-pause-btn"
                onClick={togglePlayPause}
                title={isPlaying ? "Pause (Space)" : "Play (Space)"}
                style={{borderRadius:'50%'}}
              >
                {isPlaying ? <FiPause /> : <FiPlay />}
              </button>
              
              <button 
                className="control-btn"
                onClick={() => seek(10)}
                title="Forward 10s"
              >
                <FiFastForward />
              </button>
            </div>

            <div className="video-controls-right">
              <div className="volume-control">
                <button 
                  className="volume-btn"
                  onClick={toggleMute}
                  title={muted ? "Unmute" : "Mute"}
                >
                  {muted || volume === 0 ? <FiVolumeX /> : <FiVolume2 />}
                </button>
                
                <div className="volume-slider-container">
                  <div 
                    className="volume-slider-track"
                    ref={volumeContainerRef}
                    onMouseDown={handleVolumeMouseDown}
                    onMouseMove={isDraggingVolume ? handleVolumeChange : undefined}
                    onMouseUp={handleVolumeMouseUp}
                    onMouseLeave={handleVolumeMouseUp}
                  >
                    <div 
                      className="volume-slider-fill"
                      style={{ height: `${muted ? 0 : volume * 100}%` }}
                    />
                  </div>
                </div>
                
                <span className="volume-percentage">
                  {muted ? 'Muet' : `${Math.round(volume * 100)}%`}
                </span>
              </div>
              
              <div className="speed-control">
                <select 
                  value={playbackRate}
                  onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                  className="speed-select"
                  title="Playback speed"
                >
                  <option value="0.5">0.5x</option>
                  <option value="0.75">0.75x</option>
                  <option value="1">1x</option>
                  <option value="1.25">1.25x</option>
                  <option value="1.5">1.5x</option>
                  <option value="2">2x</option>
                </select>
              </div>
              
              <button 
                className={`repeat-btn2 ${isRepeating ? 'active' : ''}`}
                onClick={handleRepeatToggle}
                title={isRepeating ? "Disable repeat" : "Enable repeat"}
              >
                <FiRotateCw />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoPlayer;