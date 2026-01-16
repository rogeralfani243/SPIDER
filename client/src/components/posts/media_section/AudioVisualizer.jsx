import React from 'react';

const AudioVisualizer = ({
  waveformData,
  currentTime,
  duration,
  isPlaying,
  isDraggingProgress,
  progressBarRef,
  onProgressMouseDown,
  onProgressChange,
  onProgressMouseUp
}) => {
  const handleProgressMouseDown = (e) => {
    onProgressMouseDown(true);
    handleProgressChange(e);
  };

  const handleProgressChange = (e) => {
    if (!progressBarRef.current || duration === 0) return;
    
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, clickX / rect.width));
    const newTime = percentage * duration;
    
    onProgressChange(newTime);
  };

  return (
    <div className="whatsapp-waveform-container">
      <div 
        className="whatsapp-waveform"
        ref={progressBarRef}
        onMouseDown={handleProgressMouseDown}
        onMouseMove={isDraggingProgress ? handleProgressChange : undefined}
        onMouseUp={onProgressMouseUp}
        onMouseLeave={onProgressMouseUp}
      >
        {waveformData.map((amplitude, index) => {
          const barProgress = (index / waveformData.length) * 100;
          const isPlayed = barProgress < (currentTime / Math.max(duration, 1)) * 100;
          
          return (
            <div
              key={index}
              className={`whatsapp-waveform-bar ${isPlayed ? 'played' : ''} ${isPlaying ? 'pulse' : ''}`}
              style={{
                height: `${Math.max(amplitude * 60 + 10, 15)}%`,
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
      <div className="whatsapp-progress-container">
        <div 
          className="whatsapp-progress-bar"
          style={{ width: `${duration > 0 ? (currentTime / duration) * 100 : 0}%` }}
        />
      </div>
    </div>
  );
};

export default AudioVisualizer;