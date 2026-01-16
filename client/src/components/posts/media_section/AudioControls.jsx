import React from 'react';
import { 
  FiPlay, FiPause, FiVolume2, FiVolumeX, 
  FiRewind, FiFastForward, FiRepeat, FiShuffle
} from 'react-icons/fi';

const AudioControls = ({
  isPlaying,
  isShuffling,
  isRepeating,
  volume,
  muted,
  playbackRate,
  onTogglePlayPause,
  onSeek,
  onToggleShuffle,
  onToggleRepeat,
  onToggleMute,
  onChangeVolume,
  onChangePlaybackRate,
  isDraggingVolume,
  onIsDraggingVolumeChange,
  volumeContainerRef,
  audioInitialized
}) => {
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
    
    onChangeVolume(percentage);
  };

  const handleVolumeMouseUp = () => {
    onIsDraggingVolumeChange(false);
  };

  return (
    <>
      {/* Main controls */}
      <div className="whatsapp-controls">
        <button 
          className="whatsapp-control-btn"
          onClick={onToggleShuffle}
          title="Shuffle"
        >
          <FiShuffle className={isShuffling ? 'active' : ''} />
        </button>
        
        <button 
          className="whatsapp-control-btn"
          onClick={() => onSeek(-10)}
          title="Rewind 10s"
        >
          <FiRewind />
        </button>
        
        <button 
          className="whatsapp-play-btn"
          onClick={onTogglePlayPause}
          disabled={!audioInitialized && process.env.NODE_ENV === 'production'}
        >
          {isPlaying ? <FiPause size={20} /> : <FiPlay size={20} />}
        </button>
        
        <button 
          className="whatsapp-control-btn"
          onClick={() => onSeek(10)}
          title="Forward 10s"
        >
          <FiFastForward />
        </button>
        
        <button 
          className="whatsapp-control-btn"
          onClick={onToggleRepeat}
          title={isRepeating ? "Repeat On" : "Repeat Off"}
        >
          <FiRepeat className={isRepeating ? 'active' : ''} />
        </button>
      </div>
      
      {/* Volume and speed controls */}
      <div className="whatsapp-secondary-controls">
        <div className="whatsapp-volume-control">
          <button 
            className="whatsapp-volume-btn"
            onClick={onToggleMute}
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
            {muted ? 'Muted' : `${Math.round(volume * 100)}%`}
          </span>
        </div>
        
        <div className="whatsapp-speed-control">
          <select 
            value={playbackRate}
            onChange={(e) => onChangePlaybackRate(parseFloat(e.target.value))}
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
    </>
  );
};

export default AudioControls;