import React, { useState, useRef, useEffect, useCallback } from 'react';
import MediaPreview from './media_section/MediaPreview';
import { FaEye } from 'react-icons/fa';
import MediaThumbnails from './media_section/MediaThumbnails';
import FullscreenView from './media_section/FullscreenView';
import { getMediaType, getFileName, getFileIcon } from '../../utils/mediaUtils';
const MediaSection = ({ mediaFiles = [], activeMediaIndex = 0, onMediaChange }) => {
  const [fullscreenOpen, setFullscreenOpen] = useState(false);
  const [fullscreenIndex, setFullscreenIndex] = useState(activeMediaIndex);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  
  const audioRef = useRef(null);
  const videoRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Navigation functions
  const openFullscreen = (index) => {
    setFullscreenIndex(index);
    setFullscreenOpen(true);
    setZoomLevel(1);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioInitialized(false);
  };

  const closeFullscreen = () => {
    setFullscreenOpen(false);
    setZoomLevel(1);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const goToPrevious = () => {
    if (fullscreenIndex > 0) {
      const newIndex = isShuffling ? 
        Math.floor(Math.random() * mediaFiles.length) : 
        fullscreenIndex - 1;
      
      setFullscreenIndex(newIndex);
      if (onMediaChange) onMediaChange(newIndex);
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioInitialized(false);
    }
  };

  const goToNext = () => {
    if (fullscreenIndex < mediaFiles.length - 1) {
      const newIndex = isShuffling ? 
        Math.floor(Math.random() * mediaFiles.length) : 
        fullscreenIndex + 1;
      
      setFullscreenIndex(newIndex);
      if (onMediaChange) onMediaChange(newIndex);
      setIsPlaying(false);
      setCurrentTime(0);
      setAudioInitialized(false);
    }
  };

  if (!mediaFiles || mediaFiles.length === 0) return null;

  return (
    <>
      <div className="media-section">
                  <div className='media-eye'    onClick={() => openFullscreen(activeMediaIndex)}> 
            <FaEye size={16} />
          </div>
        <div 
          className="media-display"
       
        >

          <MediaPreview 
            media={mediaFiles[activeMediaIndex]}
              fullscreenIndex={fullscreenIndex}
          zoomLevel={zoomLevel}
          isPlaying={isPlaying}
          volume={volume}
          muted={muted}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          isRepeating={isRepeating}
          isShuffling={isShuffling}
          waveformData={waveformData}
          isDraggingVolume={isDraggingVolume}
          isDraggingProgress={isDraggingProgress}
          audioInitialized={audioInitialized}
          audioRef={audioRef}
          videoRef={videoRef}
          volumeSliderRef={volumeSliderRef}
          progressBarRef={progressBarRef}
          volumeContainerRef={volumeContainerRef}
          audioContextRef={audioContextRef}
          analyserRef={analyserRef}
          animationFrameRef={animationFrameRef}
          onClose={closeFullscreen}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onZoomLevelChange={setZoomLevel}
          onIsPlayingChange={setIsPlaying}
          onVolumeChange={setVolume}
          onMutedChange={setMuted}
          onCurrentTimeChange={setCurrentTime}
          onDurationChange={setDuration}
          onPlaybackRateChange={setPlaybackRate}
          onIsRepeatingChange={setIsRepeating}
          onIsShufflingChange={setIsShuffling}
          onWaveformDataChange={setWaveformData}
          onIsDraggingVolumeChange={setIsDraggingVolume}
          onIsDraggingProgressChange={setIsDraggingProgress}
          onAudioInitializedChange={setAudioInitialized}
 
          />
        </div>
        
        {mediaFiles.length > 1 && (
          <MediaThumbnails
            mediaFiles={mediaFiles}
            activeMediaIndex={activeMediaIndex}
            onMediaChange={onMediaChange}
               
          />
        )}
      </div>

      {fullscreenOpen && (
        <FullscreenView
          mediaFiles={mediaFiles}
          fullscreenIndex={fullscreenIndex}
          zoomLevel={zoomLevel}
          isPlaying={isPlaying}
          volume={volume}
          muted={muted}
          currentTime={currentTime}
          duration={duration}
          playbackRate={playbackRate}
          isRepeating={isRepeating}
          isShuffling={isShuffling}
          waveformData={waveformData}
          isDraggingVolume={isDraggingVolume}
          isDraggingProgress={isDraggingProgress}
          audioInitialized={audioInitialized}
          audioRef={audioRef}
          videoRef={videoRef}
          volumeSliderRef={volumeSliderRef}
          progressBarRef={progressBarRef}
          volumeContainerRef={volumeContainerRef}
          audioContextRef={audioContextRef}
          analyserRef={analyserRef}
          animationFrameRef={animationFrameRef}
          onClose={closeFullscreen}
          onPrevious={goToPrevious}
          onNext={goToNext}
          onZoomLevelChange={setZoomLevel}
          onIsPlayingChange={setIsPlaying}
          onVolumeChange={setVolume}
          onMutedChange={setMuted}
          onCurrentTimeChange={setCurrentTime}
          onDurationChange={setDuration}
          onPlaybackRateChange={setPlaybackRate}
          onIsRepeatingChange={setIsRepeating}
          onIsShufflingChange={setIsShuffling}
          onWaveformDataChange={setWaveformData}
          onIsDraggingVolumeChange={setIsDraggingVolume}
          onIsDraggingProgressChange={setIsDraggingProgress}
          onAudioInitializedChange={setAudioInitialized}
        />
      )}
    </>
  );
};

export default MediaSection;