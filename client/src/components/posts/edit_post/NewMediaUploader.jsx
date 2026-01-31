// src/components/post/edit_post/NewMediaUploader.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';

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

  const sections = [
    {
      type: 'images',
      title: 'Additional Images',
      icon: 'fas fa-images',
      maxCount: 10,
      accept: 'image/*',
      getHint: () => 'You can add up to 10 images (JPG, PNG, GIF, WebP)'
    },
    {
      type: 'videos',
      title: 'Videos',
      icon: 'fas fa-video',
      maxCount: 5,
      accept: 'video/*',
      getHint: () => 'You can add up to 5 videos (MP4, AVI, MOV, WMV, WebM)'
    },
    {
      type: 'audio',
      title: 'Audio',
      icon: 'fas fa-music',
      maxCount: 5,
      // IMPORTANT: Utiliser des extensions au lieu de audio/* pour éviter l'enregistreur
      accept: '.mp3,.wav,.ogg,.m4a,.flac,.aac,.wma,.m4b,.opus,.amr,.3gp',
      getHint: () => 'You can add up to 5 audio files (MP3, WAV, OGG, M4A, FLAC)'
    },
    {
      type: 'documents',
      title: 'Documents',
      icon: 'fas fa-file',
      maxCount: 5,
      accept: '.pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx,.csv,.rtf,.odt',
      getHint: () => 'You can add up to 5 documents (PDF, DOC, DOCX, TXT, ZIP, RAR, PPTX, XLSX)'
    }
  ];

  const handleButtonClick = (type) => {
    if (!disabled && !isMaxReached(type)) {
      fileInputRefs[type].current?.click();
    }
  };

  const isMaxReached = (type) => {
    const totalCount = existingMedia[type].length + newFiles[type].length;
    const section = sections.find(s => s.type === type);
    return totalCount >= (section?.maxCount || 5);
  };

  const getFilePreview = (preview, type, index) => {
    switch (type) {
      case 'images':
        return (
          <div key={preview.id || index} className="preview-item">
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
              <span className="preview-name" title={preview.name}>
                {preview.name.length > 15 ? preview.name.substring(0, 12) + '...' : preview.name}
              </span>
              <span className="file-size">{formatFileSize(preview.size)}</span>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn"
              title="Remove"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      case 'videos':
        return (
          <div key={preview.id || index} className="file-preview-item">
            <div className="video-preview-container">
              <video 
                controls 
                className="video-preview"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.parentElement.innerHTML = `
                    <div class="video-preview-error">
                      <i class="fas fa-exclamation-triangle"></i>
                      <span>Video not available</span>
                    </div>
                  `;
                }}
              >
                <source src={preview.url} type={`video/${preview.extension}`} />
                Your browser does not support video playback.
              </video>
              <div className="preview-info">
                <span className="preview-name" title={preview.name}>
                  {preview.name.length > 20 ? preview.name.substring(0, 17) + '...' : preview.name}
                </span>
                <div className="preview-meta">
                  <span className="file-size">{formatFileSize(preview.size)}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn"
              title="Remove"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      case 'audio':
        return (
          <div key={preview.id || index} className="file-preview-item">
            <div className="audio-preview-container">
              <div className="audio-player">
                <i className="fas fa-music audio-icon"></i>
                <audio 
                  controls 
                  className="audio-preview"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.parentElement.innerHTML = `
                      <div class="audio-preview-error">
                        <i class="fas fa-exclamation-triangle"></i>
                        <span>Audio not available</span>
                      </div>
                    `;
                  }}
                >
                  <source src={preview.url} type={`audio/${preview.extension}`} />
                  Your browser does not support audio playback.
                </audio>
              </div>
              <div className="preview-info">
                <span className="preview-name" title={preview.name}>
                  {preview.name.length > 25 ? preview.name.substring(0, 22) + '...' : preview.name}
                </span>
                <div className="preview-meta">
                  <span className="file-size">{formatFileSize(preview.size)}</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={() => onRemoveFile(type, index)}
              className="remove-btn"
              title="Remove"
              disabled={disabled}
            >
              ×
            </button>
          </div>
        );

      case 'documents':
        const docIcon = getFileIcon(preview.extension);
        return (
          <div key={preview.id || index} className="document-item">
            <div className="document-info">
              <i className={docIcon}></i>
              <div className="document-details">
                <span className="document-name" title={preview.name}>
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
              title="Remove"
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
      {sections.map(({ type, title, icon, maxCount, accept, getHint }) => {
        const totalCount = existingMedia[type].length + newFiles[type].length;
        const isMax = isMaxReached(type);
        
        return (
          <div key={type} className="upload-section">
            <h4>
              <i className={icon}></i> {title}
              <small className="upload-count">({totalCount}/{maxCount})</small>
            </h4>
            <div className="upload-group">
              <button
                type="button"
                onClick={() => handleButtonClick(type)}
                className={`btn-upload ${isMax ? 'max-reached' : ''}`}
                disabled={disabled || isMax}
              >
                <i className="fas fa-plus"></i> 
                {isMax ? `Maximum reached (${maxCount})` : `Add ${title.toLowerCase()}`}
              </button>
              
              {/* Input file - SANS capture attribute */}
              <input
                type="file"
                ref={fileInputRefs[type]}
                onChange={(e) => onFileSelect(type, e)}
                accept={accept}
                multiple={maxCount > 1}
                style={{ display: 'none' }}
                disabled={disabled || isMax}
                // IMPORTANT: Pas de capture pour audio!
              />
              
              {/* Previews */}
              {newPreviews[type].length > 0 && (
                <div className={`${type}-previews`}>
                  {type === 'images' ? (
                    <div className="preview-grid">
                      {newPreviews[type].map((preview, index) => 
                        getFilePreview(preview, type, index)
                      )}
                    </div>
                  ) : (
                    <div className={`${type}-list`}>
                      {newPreviews[type].map((preview, index) => 
                        getFilePreview(preview, type, index)
                      )}
                    </div>
                  )}
                </div>
              )}
              
              {/* Hint message */}
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