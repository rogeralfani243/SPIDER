import React from 'react';
import {
  FaFileVideo,
  FaFileImage,
  FaFileAlt,
  FaMusic
} from 'react-icons/fa';
import URL from '../../hooks/useUrl.js';

const MediaRenderer = ({ fileUrl, isThumbnail = false }) => {
  if (!fileUrl) return null;

  const extension = fileUrl.split('.').pop().toLowerCase();
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${URL}${fileUrl}`;

  // Get appropriate icon for file type
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return <FaFileAlt />;
    const ext = fileUrl.split('.').pop().toLowerCase();
    
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) {
      return <FaFileImage className="file-icon image-icon" />;
    }
    
    if (['mp4', 'mov', 'avi', 'mkv'].includes(ext)) {
      return <FaFileVideo className="file-icon video-icon" />;
    }
    
    if (['mp3', 'wav', 'ogg', 'm4a'].includes(ext)) {
      return <FaMusic className="file-icon audio-icon" />;
    }
    
    return <FaFileAlt className="file-icon document-icon" />;
  };

  // Render image files
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return (
      <img 
        src={fullUrl} 
        alt="Post media" 
        className={isThumbnail ? "media-thumbnail" : "media-full"}
      />
    );
  }

  // Render audio files
  if (['mp3', 'wav', 'ogg', 'm4a'].includes(extension)) {
    return (
      <div className="audio-container">
        <audio controls className="audio-player">
          <source src={fullUrl} type={`audio/${extension}`} />
          Your browser does not support the audio element.
        </audio>
      </div>
    );
  }

  // Render video files
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
    return (
      <div className="video-container">
        <video controls className="media-full">
          <source src={fullUrl} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
      </div>
    );
  }

  // Render other file types as download links
  return (
    <div className="file-item">
      {getFileIcon(fileUrl)}
      <a href={fullUrl} target="_blank" rel="noopener noreferrer" className="file-link">
        {fileUrl.split('/').pop()}
      </a>
    </div>
  );
};

export default MediaRenderer;