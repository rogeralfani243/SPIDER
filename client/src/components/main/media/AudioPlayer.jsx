import React, { useRef, useState } from 'react';
import { FaPlay, FaPause, FaVolumeUp } from 'react-icons/fa';

const AudioPlayer = ({ src }) => {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const togglePlayPause = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => setCurrentTime(audioRef.current.currentTime);
  const handleLoadedMetadata = () => setDuration(audioRef.current.duration);

  const handleProgressClick = (e) => {
    const rect = e.target.getBoundingClientRect();
    const percent = (e.clientX - rect.left) / rect.width;
    audioRef.current.currentTime = percent * duration;
  };

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="audio-player">
      <audio
        ref={audioRef}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => setIsPlaying(false)}
      >
        <source src={src} type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>

      <div className="audio-controls">
        <button onClick={togglePlayPause} className="play-pause-btn">
          {isPlaying ? <FaPause /> : <FaPlay />}
        </button>

        <div className="audio-info">
          <div className="progress-bar" onClick={handleProgressClick}>
            <div
              className="progress"
              style={{ width: `${(currentTime / duration) * 100}%` }}
            ></div>
          </div>

          <div className="time-display">
            <span>{formatTime(currentTime)}</span>
            <span> / </span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        <div className="volume-icon">
          <FaVolumeUp />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;