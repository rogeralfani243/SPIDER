// src/components/post/components/NewMediaUploader.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FaImage, FaVideo, FaMusic, FaFile, FaTimes } from 'react-icons/fa';
import VideoPreview from './VideoPreview';
import AudioPreview from './AudioPreview';

const NewMediaUploader = ({ 
  newFiles, 
  newPreviews, 
  existingMedia, 
  onFileSelect, 
  onRemoveFile, 
  formatFileSize, 
  getFileIcon, 
  disabled 
}) => {
  
  const fileInputRefs = {
    images: useRef(null),
    videos: useRef(null),
    audio: useRef(null),
    documents: useRef(null)
  };

  const uploadSections = [
    {
      type: 'images',
      title: 'Additional Images',
      icon: <FaImage />,
      maxCount: 10,
      accept: 'image/*',
      getHint: () => 'You can add up to 10 images (JPG, PNG, GIF, WebP)'
    },
    {
      type: 'videos',
      title: 'Videos',
      icon: <FaVideo />,
      maxCount: 5,
      accept: 'video/*',
      getHint: () => 'You can add up to 5 videos (MP4, AVI, MOV, WMV, WebM)'
    },
    {
      type: 'audio',
      title: 'Audio',
      icon: <FaMusic />,
      maxCount: 5,
      accept: 'audio/*',
      getHint: () => 'You can add up to 5 audio files (MP3, WAV, OGG, M4A, FLAC)'
    },
    {
      type: 'documents',
      title: 'Documents',
      icon: <FaFile />,
      maxCount: 5,
      accept: '.pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx',
      getHint: () => 'You can add up to 5 documents (PDF, DOC, DOCX, TXT, ZIP, RAR, PPTX, XLSX)'
    }
  ];

  const handleButtonClick = (type) => {
    fileInputRefs[type].current?.click();
  };

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Basic validation
    const validFiles = selectedFiles.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      
      switch(type) {
        case 'images':
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
        case 'videos':
          return ['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension);
        case 'audio':
          return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension);
        case 'documents':
          return ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'pptx', 'xlsx'].includes(extension);
        default:
          return false;
      }
    });
    
    if (validFiles.length === 0) return;
    
    // Create previews
    const previews = validFiles.map(file => {
      const fileId = Date.now() + Math.random();
      const extension = file.name.split('.').pop().toLowerCase();
      
      switch(type) {
        case 'images':
          return {
            url: URL.createObjectURL(file),
            name: file.name,
            id: fileId,
            type: 'image',
            size: file.size,
            file: file
          };
          
        case 'videos':
          return {
            url: URL.createObjectURL(file),
            blobUrl: URL.createObjectURL(file),
            name: file.name,
            id: fileId,
            type: 'video',
            size: file.size,
            extension: extension,
            file: file
          };
          
        case 'audio':
          return {
            url: URL.createObjectURL(file),
            blobUrl: URL.createObjectURL(file),
            name: file.name,
            id: fileId,
            type: 'audio',
            size: file.size,
            extension: extension,
            file: file
          };
          
        case 'documents':
          return {
            name: file.name,
            id: fileId,
            type: 'document',
            size: file.size,
            extension: extension,
            file: file
          };
          
        default:
          return null;
      }
    }).filter(Boolean);
    
    onFileSelect(type, validFiles, previews);
    e.target.value = '';
  };

  const getFilePreview = (preview, type, index) => {
    switch(type) {
      case 'images':
        return (
          <div key={preview.id} className="preview-item">
            <img 
              src={preview.url} 
              alt="" 
              className="preview-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/150x150?text=Image+Error';
              }}
            />
            <div className="preview-info">
              <span className="preview-name">
                {preview.name.length > 15 ? preview.name.substring(0, 12) + '...' : preview.name}
              </span>
              <span className="file-size">{formatFileSize(preview.size)}</span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      case 'videos':
        return (
          <div key={preview.id} className="file-preview-item">
            <VideoPreview preview={preview} formatFileSize={formatFileSize} />
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      case 'audio':
        return (
          <div key={preview.id} className="file-preview-item">
            <AudioPreview preview={preview} formatFileSize={formatFileSize} />
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      case 'documents':
        return (
          <div key={preview.id} className="document-item">
            <div className="document-info">
              <i className={getFileIcon(preview.extension)}></i>
              <div className="document-details">
                <span className="document-name">
                  {preview.name.length > 25 ? preview.name.substring(0, 22) + '...' : preview.name}
                </span>
                <div className="document-meta">
                  <span className="file-type">.{preview.extension.toUpperCase()}</span>
                  <span className="file-size">{formatFileSize(preview.size)}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn-small"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      {uploadSections.map(({ type, title, icon, maxCount, accept, getHint }) => {
        const totalCount = existingMedia[type].length + newFiles[type].length;
        const isMaxReached = totalCount >= maxCount;
        
        return (
          <div key={type} className="upload-section">
            <h4>
              {icon} {title}
              <small className="upload-count">({totalCount}/{maxCount})</small>
            </h4>
            <div className="upload-group">
              <button
                type="button"
                onClick={() => handleButtonClick(type)}
                className={`btn-upload ${isMaxReached ? 'max-reached' : ''}`}
                disabled={disabled || isMaxReached}
              >
                <i className="fas fa-plus"></i> 
                {isMaxReached ? `Maximum reached (${maxCount})` : `Add ${title.toLowerCase()}`}
              </button>
              <input
                type="file"
                ref={fileInputRefs[type]}
                onChange={(e) => handleFileChange(e, type)}
                accept={accept}
                multiple={maxCount > 1}
                style={{ display: 'none' }}
                disabled={disabled || isMaxReached}
              />
              
              {newPreviews[type].length > 0 && (
                <div className={`new-${type}-previews`}>
                  {type === 'images' ? (
                    <div className="new-preview-grid">
                      {newPreviews[type].map((preview, index) => 
                        getFilePreview(preview, type, index)
                      )}
                    </div>
                  ) : (
                    <div className="new-preview-list">
                      {newPreviews[type].map((preview, index) => 
                        getFilePreview(preview, type, index)
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {newFiles[type].length === 0 && (
                <div className="upload-hint">
                  <small>
                    <i className="fas fa-info-circle"></i>
                    {getHint()}
                  </small>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
};

NewMediaUploader.propTypes = {
  newFiles: PropTypes.shape({
    images: PropTypes.array,
    videos: PropTypes.array,
    audio: PropTypes.array,
    documents: PropTypes.array
  }).isRequired,
  newPreviews: PropTypes.shape({
    images: PropTypes.array,
    videos: PropTypes.array,
    audio: PropTypes.array,
    documents: PropTypes.array
  }).isRequired,
  existingMedia: PropTypes.shape({
    images: PropTypes.array,
    videos: PropTypes.array,
    audio: PropTypes.array,
    documents: PropTypes.array
  }).isRequired,
  onFileSelect: PropTypes.func.isRequired,
  onRemoveFile: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired,
  getFileIcon: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
};

export default NewMediaUploader;