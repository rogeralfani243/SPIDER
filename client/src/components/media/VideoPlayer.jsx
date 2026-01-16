import React, { useRef } from 'react';
import '../../styles/profile_details/media_player.css'

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);

  return (
    <div className="video-player">
      <video 
      preload="auto"
      loop
           muted
       playsInline
      autoPlay
        ref={videoRef}
        className="video-element"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video element.
      </video>
    </div>
  );
};

export default VideoPlayer;