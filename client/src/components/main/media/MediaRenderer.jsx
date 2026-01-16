import React from 'react';
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
  FaPlay
} from 'react-icons/fa';
import AudioPlayer from './AudioPlayer';
import VideoPlayer from './VideoPlayer';

const MediaRenderer = ({ fileUrl, baseUrl, getFileIcon, renderFileThumbnail, isThumbnail = false }) => {
  if (!fileUrl) return null;

  const extension = fileUrl.split('.').pop().toLowerCase();
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${baseUrl}${fileUrl}`;

  // For thumbnail view
  if (isThumbnail) {
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
      return (
        <img src={fullUrl} alt="thumbnail" className="file-thumbnail-img" />
      );
    }

    if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
      return (
        <div className="video-thumbnail">
          <FaFileVideo size={24} color="#03a9f4" />
          <div className="play-icon">
            <FaPlay size={12} color="white" />
          </div>
        </div>
      );
    }

    return (
      <div className="file-thumbnail-icon">
        {getFileIcon(fileUrl)}
      </div>
    );
  }

  // For full view
  if (['mp3', 'wav', 'ogg'].includes(extension)) {
    return (
      <div className="media-container">
        <div className="media-header">
          {getFileIcon(fileUrl)}
          <span className="file-name">{fileUrl.split('/').pop()}</span>
        </div>
        <AudioPlayer src={fullUrl} />
      </div>
    );
  }

  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
    return (
      <div className="media-container">
        <div className="media-header">
          {getFileIcon(fileUrl)}
          <span className="file-name">{fileUrl.split('/').pop()}</span>
        </div>
        <VideoPlayer src={fullUrl} />
      </div>
    );
  }

  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return (
      <div className="media-container">
        <img src={fullUrl} alt="post" className="post-image" />
      </div>
    );
  }

  return (
    <div className="file-item">
      {getFileIcon(fileUrl)}
      <a
        href={fullUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="file-link"
      >
        {fileUrl.split('/').pop()}
      </a>
    </div>
  );
};

export default MediaRenderer;