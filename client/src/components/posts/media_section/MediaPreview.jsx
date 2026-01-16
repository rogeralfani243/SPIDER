import React from 'react';
import { MdAudioFile } from 'react-icons/md';
import { getMediaType, getFileName, getFileIcon } from '../../../utils/mediaUtils';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';
const MediaPreview = ({ media,
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
  onAudioInitializedChange }) => {
  if (!media) return null;
  
  const mediaType = getMediaType(media);
  const url = media.url || media;
  
  const renderContent = () => {
    switch(mediaType) {
      case 'image':
        return <img src={url} alt="Preview" className="main-media-image-post" />
      case 'video':
        return (
          <div className="main-media-videos">
            <video src={url} controls className="preview-video" controlsList="nodownload" />
          </div>
        );
      case 'audio':
        return (
          <div className="m">
            <div className="audio-prv">
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
            </div>
          </div>
        );
      default:
        return (
          <div className="main-media-file">
            <div className="file-preview-main">
              {getFileIcon(media)}
              <span>{getFileName(media)}</span>
            </div>
          </div>
        );
    }
  };
  
  return renderContent();
};

export default MediaPreview;