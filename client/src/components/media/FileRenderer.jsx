// components/FileRenderer.jsx
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
import { 
  getSafeUrl, 
  getSafeFileName, 
  getFileExtension,
  getFileType 
} from '../../utils/fileUtils.js';

export const getFileIcon = (fileInput) => {
  const fileUrl = getSafeUrl(fileInput);
  const extension = getFileExtension(fileUrl);
  
  if (!extension) return <FaFileAlt color="#6c757d" />;
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension))
    return <FaFileImage color="#ff9800" />;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension))
    return <FaFileVideo color="#03a9f4" />;
  if (['mp3', 'wav', 'ogg'].includes(extension))
    return <FaFileAudio color="#8bc34a" />;
  if (['pdf'].includes(extension)) return <FaFilePdf color="#e53935" />;
  if (['doc', 'docx'].includes(extension))
    return <FaFileWord color="#2196f3" />;
  if (['xls', 'xlsx'].includes(extension))
    return <FaFileExcel color="#4caf50" />;
  if (['zip', 'rar', '7z'].includes(extension))
    return <FaFileArchive color="#ffb300" />;
  return <FaFileAlt color="#6c757d" />;
};

export const renderFileThumbnail = (fileInput, URL) => {
  const fileUrl = getSafeUrl(fileInput);
  const extension = getFileExtension(fileUrl);
  
  if (!fileUrl) return null;
  
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${URL}${fileUrl}`;

  if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return (
      <img 
        src={fullUrl} 
        alt="thumbnail" 
        className="file-thumbnail-img"
        onError={(e) => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `
            <div class="file-thumbnail-icon">
              <FaFileAlt color="#6c757d" />
            </div>
          `;
        }}
      />
    );
  }

  if (extension && ['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
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
};

const FileRenderer = ({ fileUrl: fileInput, URL }) => {
  const fileUrl = getSafeUrl(fileInput);
  if (!fileUrl) return null;
  
  const extension = getFileExtension(fileUrl);
  const fileName = getSafeFileName(fileInput);
  const fullUrl = fileUrl.startsWith('http') ? fileUrl : `${URL}${fileUrl}`;

  if (extension && ['mp3', 'wav', 'ogg'].includes(extension)) {
    return (
      <div className="media-container2" style={{backgroundColor:'none'}}>
      
        <AudioPlayer src={fullUrl} />
      </div>
    );
  }

  if (extension && ['mp4', 'mov', 'avi', 'mkv'].includes(extension)) {
    return (
      <div className="media-container">
       
        <VideoPlayer src={fullUrl} />
      </div>
    );
  }

  if (extension && ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) {
    return (
      <div className="media-container">
        <img 
          src={fullUrl} 
          alt="post" 
          className="post-image"
          onError={(e) => {
            e.target.style.display = 'none';
            e.target.parentElement.innerHTML = `
              <div class="file-item">
                ${getFileIcon(fileUrl)}
                <a href="${fullUrl}" target="_blank" rel="noopener noreferrer" class="file-link">
                  ${fileName}
                </a>
              </div>
            `;
          }}
        />
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
        {fileName}
      </a>
    </div>
  );
};

export default FileRenderer;