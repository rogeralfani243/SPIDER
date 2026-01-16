import React, { useCallback, useEffect } from 'react';
import AudioPlayer from './AudioPlayer';
import { getMediaType, getFileName, getFileIcon } from '../../../utils/mediaUtils';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import VideoPlayer from './VideoPlayer';
const FullscreenMedia = ({
  media,
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
  if (!media) return null;
  
  const mediaType = getMediaType(media);
  
  const renderMedia = () => {
    switch(mediaType) {
      case 'audio':
        return (
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
            isDraggingVolume={isDraggingVolume}
            isDraggingProgress={isDraggingProgress}
            audioInitialized={audioInitialized}
            audioRef={audioRef}
            volumeSliderRef={volumeSliderRef}
            progressBarRef={progressBarRef}
            volumeContainerRef={volumeContainerRef}
            audioContextRef={audioContextRef}
            analyserRef={analyserRef}
            animationFrameRef={animationFrameRef}
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
        );
        
      case 'image':
        const url = media.url || media;
        const fileName = getFileName(media);
        const resetZoom = () => onZoomLevelChange(1);
        const zoomIn = () => onZoomLevelChange(prev => Math.min(prev + 0.25, 3));
        
        return (
          <div className="fullscreen-image-container">
            <img
              src={url}
              alt={fileName}
              className="fullscreen-image"
              style={{
                transform: `scale(${zoomLevel})`,
                cursor: zoomLevel > 1 ? 'zoom-out' : 'zoom-in'
              }}
              onClick={zoomLevel > 1 ? resetZoom : zoomIn}
            />
          </div>
        );
        
case 'video':
  return (
<div className="fullscreen-video-container">
      <VideoPlayer
      media={media}
      isPlaying={isPlaying}
      volume={volume}
      muted={muted}
      currentTime={currentTime}
      duration={duration}
      playbackRate={playbackRate}
      isRepeating={isRepeating}
      isDraggingVolume={isDraggingVolume}
      isDraggingProgress={isDraggingProgress}
      videoRef={videoRef}
      volumeSliderRef={volumeSliderRef}
      progressBarRef={progressBarRef}
      volumeContainerRef={volumeContainerRef}
      onIsPlayingChange={onIsPlayingChange}
      onVolumeChange={onVolumeChange}
      onMutedChange={onMutedChange}
      onCurrentTimeChange={onCurrentTimeChange}
      onDurationChange={onDurationChange}
      onPlaybackRateChange={onPlaybackRateChange}
      onIsRepeatingChange={onIsRepeatingChange}
      onIsDraggingVolumeChange={onIsDraggingVolumeChange}
      onIsDraggingProgressChange={onIsDraggingProgressChange}
    />
    </div>
  );
        
      case 'pdf':
        return (
          <div className="fullscreen-pdf-container">
            <iframe
              src={media.url || media}
              title={getFileName(media)}
              className="fullscreen-pdf"
            />
          </div>
        );
        
      default:
        const downloadFile = () => {
          const url = media.url || media;
          const link = document.createElement('a');
          link.href = url;
          link.download = getFileName(media);
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };

        const openInNewTab = () => {
          const url = media.url || media;
          window.open(url, '_blank');
        };
        
        return (
          <div className="fullscreen-file-container">
            <div className="file-preview">
              <div className="file-icon-large">
                {getFileIcon(media)}
              </div>
              <div className="file-info">
                <h3>{getFileName(media)}</h3>
                <p>Type: {mediaType.toUpperCase()}</p>
              </div>
              <div className="file-actions">
                <button className="download-btn" onClick={downloadFile}>
                  <FiDownload /> Download
                </button>
                <button className="open-btn" onClick={openInNewTab}>
                  <FiExternalLink /> Open
                </button>
              </div>
            </div>
          </div>
        );
    }
  };
  
  return renderMedia();
};

export default FullscreenMedia;