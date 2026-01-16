import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import AudioPlayer from './AudioPlayer';
import { FiX, FiHome } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import DashboardMain from '../../dashboard_main';

const AudioPlayerPage = () => {
  const { mediaId } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  
  // États pour le lecteur audio
  const [media, setMedia] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  // Réfs
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Fonction pour mettre à jour le volume de l'élément audio réel
  const handleVolumeChange = useCallback((newVolume) => {
    setVolume(newVolume);
    
    // Mettre à jour l'élément audio réel
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
      audioRef.current.muted = newVolume === 0 || muted;
    }
  }, [muted]);
  
  // Fonction pour mettre à jour la vitesse de lecture
  const handlePlaybackRateChange = useCallback((newRate) => {
    setPlaybackRate(newRate);
    
    // Mettre à jour l'élément audio réel
    if (audioRef.current) {
      audioRef.current.playbackRate = newRate;
    }
  }, []);
  
  // Fonction pour basculer le mute
  const handleMuteChange = useCallback((newMuted) => {
    setMuted(newMuted);
    
    // Mettre à jour l'élément audio réel
    if (audioRef.current) {
      audioRef.current.muted = newMuted;
      // Si on désactive le mute et que le volume est à 0, le mettre à 0.5
      if (!newMuted && volume === 0) {
        handleVolumeChange(0.5);
      }
    }
  }, [volume, handleVolumeChange]);
  
  // Fonction pour jouer/mettre en pause
  const handlePlayPause = useCallback(async () => {
    if (!audioRef.current) return;
    
    try {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        await audioRef.current.play();
        setIsPlaying(true);
      }
    } catch (error) {
      console.error('Error toggling play/pause:', error);
    }
  }, [isPlaying]);
  
  // Initialiser le lecteur audio
  useEffect(() => {
    if (audioRef.current && media?.url) {
      // Configurer l'élément audio
      audioRef.current.volume = volume;
      audioRef.current.muted = muted;
      audioRef.current.playbackRate = playbackRate;
      
      // Gérer les événements audio
      const handleTimeUpdate = () => {
        if (audioRef.current) {
          setCurrentTime(audioRef.current.currentTime);
        }
      };
      
      const handleLoadedMetadata = () => {
        if (audioRef.current) {
          setDuration(audioRef.current.duration || 0);
          setAudioInitialized(true);
        }
      };
      
      const handlePlay = () => setIsPlaying(true);
      const handlePause = () => setIsPlaying(false);
      const handleEnded = () => {
        setIsPlaying(false);
        if (isRepeating && audioRef.current) {
          audioRef.current.currentTime = 0;
          audioRef.current.play().catch(console.error);
        }
      };
      
      audioRef.current.addEventListener('timeupdate', handleTimeUpdate);
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      audioRef.current.addEventListener('play', handlePlay);
      audioRef.current.addEventListener('pause', handlePause);
      audioRef.current.addEventListener('ended', handleEnded);
      
      // Nettoyage
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('timeupdate', handleTimeUpdate);
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
          audioRef.current.removeEventListener('play', handlePlay);
          audioRef.current.removeEventListener('pause', handlePause);
          audioRef.current.removeEventListener('ended', handleEnded);
        }
      };
    }
  }, [media?.url, isRepeating]);
  
  // Charger les données du média
  useEffect(() => {
    const loadMedia = () => {
      try {
        // Méthode 1: Depuis les query params
        const searchParams = new URLSearchParams(location.search);
        const mediaData = searchParams.get('media');
        
        if (mediaData) {
          const decodedMedia = JSON.parse(decodeURIComponent(mediaData));
          setMedia(decodedMedia);
        } 
        // Méthode 2: Depuis localStorage
        else if (mediaId) {
          const savedMedia = localStorage.getItem(`media_${mediaId}`);
          if (savedMedia) {
            setMedia(JSON.parse(savedMedia));
          }
        }
        // Méthode 3: Depuis l'URL directe
        else {
          const url = window.location.pathname.split('/').pop();
          if (url) {
            setMedia({
              url: decodeURIComponent(url),
              name: decodeURIComponent(url.split('/').pop())
            });
          }
        }
      } catch (error) {
        console.error('Error loading media:', error);
      }
    };
    
    loadMedia();
  }, [mediaId, location.search]);
  
  // Fermer la page avec Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        window.close();
      }
    };
    
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);
  
  // Générer des données d'onde
  useEffect(() => {
    if (media?.url && audioInitialized) {
      const generateWaveform = () => {
        const fakeWaveform = Array.from({ length: 50 }, () => 
          Math.random() * 0.5 + 0.3
        );
        setWaveformData(fakeWaveform);
      };
      
      generateWaveform();
    }
  }, [media?.url, audioInitialized]);
  
  if (!media) {
    return (
      <div className="audio-player-page loading">
        <div className="loading-container">
          <h2>Chargement du lecteur audio...</h2>
          <p>Veuillez patienter</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="audio-player-page">
      <DashboardMain />
      <div className="audio-player-header" style={{marginTop:'10em'}}>
        <h1 className="audio-player-title">
          Audio Player
        </h1>
        
        <button 
          className="close-btn"
          onClick={() => window.close()}
          title="Fermer (Esc)"
        >
          <FiX />
        </button>
      </div>
      
      <div className="audio-player-content">
        <AudioPlayer
          media={media}
          isPlaying={isPlaying}
          volume={volume}
          muted={muted}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          isRepeating={isRepeating}
          isShuffling={isShuffling}
          waveformData={waveformData}
          isDraggingVolume={false}
          isDraggingProgress={false}
          audioInitialized={audioInitialized}
          audioRef={audioRef}
          progressBarRef={progressBarRef}
          volumeContainerRef={volumeContainerRef}
          audioContextRef={audioContextRef}
          analyserRef={analyserRef}
          animationFrameRef={animationFrameRef}
          onIsPlayingChange={handlePlayPause}
          onVolumeChange={handleVolumeChange}
          onMutedChange={handleMuteChange}
          onCurrentTimeChange={setCurrentTime}
          onDurationChange={setDuration}
          onPlaybackRateChange={handlePlaybackRateChange}
          onIsRepeatingChange={setIsRepeating}
          onIsShufflingChange={setIsShuffling}
          onWaveformDataChange={setWaveformData}
          onIsDraggingVolumeChange={() => {}}
          onIsDraggingProgressChange={() => {}}
          onAudioInitializedChange={setAudioInitialized}
        />
      </div>
      
      {/* Élément audio caché mais fonctionnel */}
      {media?.url && (
        <audio
          ref={audioRef}
          src={media.url}
          style={{ display: 'none' }}
          preload="metadata"
          crossOrigin="anonymous"
        />
      )}
    </div>
  );
};

export default AudioPlayerPage;