import React, { useRef } from 'react';

const VideoPlayer = ({ src }) => {
  const videoRef = useRef(null);

  return (
    <div className="video-player">
      <video
        ref={videoRef}
        controls
        className="video-element"
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video element.
      </video>
    </div>
  );
};

export default VideoPlayer;