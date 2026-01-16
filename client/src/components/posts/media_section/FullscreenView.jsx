import React, { useEffect } from 'react';
import { 
  FiX, FiChevronLeft, FiChevronRight, FiDownload, 
  FiExternalLink, FiMinimize2, FiMaximize2
} from 'react-icons/fi';
import FullscreenMedia from './FullscreenMedia';
import VideoPlayer from './VideoPlayer';
import { getFileName, getFileIcon } from '../../../utils/mediaUtils';
import { getMediaType } from '../../../utils/mediaUtils';
const FullscreenView = ({
  mediaFiles,
  fullscreenIndex,
  zoomLevel,
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
  videoRef,
  volumeSliderRef,
  progressBarRef,
  volumeContainerRef,
  audioContextRef,
  analyserRef,
  animationFrameRef,
  onClose,
  onPrevious,
  onNext,
  onZoomLevelChange,
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
  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch(e.key) {
        case 'Escape':
          onClose();
          break;
        case 'ArrowLeft':
          if (e.ctrlKey) {
            // Seek logic here
          } else {
            onPrevious();
          }
          break;
        case 'ArrowRight':
          if (e.ctrlKey) {
            // Seek logic here
          } else {
            onNext();
          }
          break;
        case ' ':
          e.preventDefault();
          // Toggle play/pause logic here
          break;
        default:
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, onPrevious, onNext]);

  // Prevent body scroll when fullscreen is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const getCurrentMedia = () => mediaFiles[fullscreenIndex];
  const currentMedia = getCurrentMedia();
  const mediaType = getMediaType(currentMedia);

  const downloadFile = () => {
    if (currentMedia) {
      const url = currentMedia.url || currentMedia;
      const link = document.createElement('a');
      link.href = url;
      link.download = getFileName(currentMedia);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

const openInNewTab = () => {
  if (currentMedia) {
    const mediaType = getMediaType(currentMedia);
    
    if (mediaType === 'audio') {
      // Pour les fichiers audio, ouvrir la page dédiée
      const mediaData = encodeURIComponent(JSON.stringify({
        url: currentMedia.url || currentMedia,
        name: getFileName(currentMedia),
        type: 'audio'
      }));
      
      // Ouvrir dans un nouvel onglet avec les données
      const newWindow = window.open('', '_blank');
      
      // Créer une page temporaire avec redirection
      const html = `
        <!DOCTYPE html>
        <html>
          <head>
            <title>Lecteur Audio - ${getFileName(currentMedia)}</title>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script>
              // Stocker les données dans localStorage pour la page de lecteur
              localStorage.setItem('audio_player_media', '${mediaData}');
              // Rediriger vers la page du lecteur audio
              window.location.href = '/audio-player?media=${mediaData}';
            </script>
          </head>
          <body>
            <p>Redirection vers le lecteur audio...</p>
          </body>
        </html>
      `;
      
      newWindow.document.write(html);
      newWindow.document.close();
      
    } else {
      // Pour les autres types de médias, ouvrir l'URL directement
      const url = currentMedia.url || currentMedia;
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }
};

  const zoomIn = () => {
    if (mediaType === 'image') {
      onZoomLevelChange(prev => Math.min(prev + 0.25, 3));
    }
  };

  const zoomOut = () => {
    if (mediaType === 'image') {
      onZoomLevelChange(prev => Math.max(prev - 0.25, 0.5));
    }
  };

  const resetZoom = () => {
    onZoomLevelChange(1);
  };

  return (
    <div className="fullscreen-overlay" onClick={onClose}>
      <div className="fullscreen-container" onClick={e => e.stopPropagation()}>
        <div className="fullscreen-header">
          <div className="file-info-header">
          
          </div>
          
          <div className="fullscreen-controls">
            {mediaType === 'image' && (
              <>
                <button 
                  className="control-btn"
                  onClick={zoomOut} 
                  disabled={zoomLevel <= 0.5}
                  title="Zoom Out (-)"
                >
                  <FiMinimize2 />
                </button>
                <button 
                  className="control-btn percent"
                  onClick={resetZoom} 
                  disabled={zoomLevel === 1}
                  title="Reset Zoom"
                style={{width:'80px', fontSize:'0.9em'}}
                >
                  100%
                </button>
                <button 
                  className="control-btn"
                  onClick={zoomIn} 
                  disabled={zoomLevel >= 3}
                  title="Zoom In (+)"
                >
                  <FiMaximize2 />
                </button>
              </>
            )}
       
     
            <button 
              onClick={onClose} 
              className="control-btn close-btn"
              title="Close (Esc)"
            >
              <FiX />
            </button>
          </div>
        </div>

        <div className="fullscreen-content">
          {fullscreenIndex > 0 && (
            <button className="nav-btn prev-btn" onClick={onPrevious}>
              <FiChevronLeft />
            </button>
          )}

          <div className="media-content-container">
            <FullscreenMedia
              media={currentMedia}
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
              onZoomLevelChange={onZoomLevelChange}
              onIsPlayingChange={onIsPlayingChange}
              onVolumeChange={onVolumeChange}
              onMutedChange={onMutedChange}
              onCurrentTimeChange={onCurrentTimeChange}
              onDurationChange={onDurationChange}
              onPlaybackRateChange={onPlaybackRateChange}
              onIsRepeatingChange={onIsRepeatingChange}
              onIsShufflingChange={onIsShufflingChange}
              onWaveformDataChange={onWaveformDataChange}
              onIsDraggingVolumeChange={onIsDraggingVolumeChange}
              onIsDraggingProgressChange={onIsDraggingProgressChange}
              onAudioInitializedChange={onAudioInitializedChange}
            />
          </div>

          {fullscreenIndex < mediaFiles.length - 1 && (
            <button className="nav-btn next-btn" onClick={onNext}>
              <FiChevronRight />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default FullscreenView;