import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FaImage, FaVideo, FaMusic, FaFile, FaTimes } from 'react-icons/fa';

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
      accept: 'audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.wma,.m4b,.mpga,.weba',
      getHint: () => 'You can add up to 5 audio files (MP3, WAV, OGG, M4A, FLAC, AAC, WMA)'
    },
    {
      type: 'documents',
      title: 'Documents',
      icon: <FaFile />,
      maxCount: 5,
      accept: '.pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx,.csv,.rtf,.odt',
      getHint: () => 'You can add up to 5 documents (PDF, DOC, DOCX, TXT, ZIP, RAR, PPTX, XLSX, CSV, RTF)'
    }
  ];

  const handleButtonClick = (type) => {
    fileInputRefs[type].current?.click();
  };

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) return;
    
    // Log pour déboguer
    console.log(`Selected files for ${type}:`, selectedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    })));
    
    // Validation simple mais efficace
    const validFiles = selectedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const mimeType = file.type;
      
      // Accepter les fichiers selon leur type MIME
      switch(type) {
        case 'images':
          return mimeType.startsWith('image/') || 
                 /\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i.test(fileName);
        
        case 'videos':
          return mimeType.startsWith('video/') || 
                 /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v|3gp)$/i.test(fileName);
        
        case 'audio':
          return mimeType.startsWith('audio/') || 
                 /\.(mp3|wav|ogg|m4a|flac|aac|wma|m4b|mpga|weba|opus|midi?)$/i.test(fileName);
        
        case 'documents':
          return /\.(pdf|doc|docx|txt|zip|rar|pptx|xlsx|csv|rtf|odt)$/i.test(fileName);
        
        default:
          return false;
      }
    });
    
    console.log(`Valid files for ${type}:`, validFiles.length);
    
    if (validFiles.length === 0) {
      alert(`No valid files selected. Please make sure the files are in the correct format for ${type}.`);
      e.target.value = '';
      return;
    }
    
    // Créer les previews
    const previews = validFiles.map(file => {
      const fileId = Date.now() + Math.random();
      const extension = file.name.split('.').pop().toLowerCase();
      
      let preview = {
        id: fileId,
        name: file.name,
        size: file.size,
        type: type,
        file: file,
        extension: extension
      };
      
      // Créer une URL blob pour la prévisualisation
      if (['images', 'videos', 'audio'].includes(type)) {
        try {
          const blobUrl = URL.createObjectURL(file);
          preview.url = blobUrl;
          preview.blobUrl = blobUrl;
          
          if (type === 'images') {
            preview.previewType = 'image';
          } else if (type === 'videos') {
            preview.previewType = 'video';
          } else if (type === 'audio') {
            preview.previewType = 'audio';
          }
        } catch (error) {
          console.error('Error creating blob URL:', error);
          // Continuer sans URL blob
        }
      }
      
      return preview;
    });
    
    // Appeler la fonction parent
    onFileSelect(type, validFiles, previews);
    
    // Réinitialiser l'input
    e.target.value = '';
  };

  const getFilePreview = (preview, type, index) => {
    const revokeBlobUrl = (url) => {
      if (url && url.startsWith('blob:')) {
        URL.revokeObjectURL(url);
      }
    };

    switch(type) {
      case 'images':
        return (
          <div key={preview.id} className="preview-item">
            <img 
              src={preview.url} 
              alt="" 
              className="preview-image"
              onError={(e) => {
                console.error('Error loading image:', preview.name);
                revokeBlobUrl(preview.url);
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
              onClick={() => {
                revokeBlobUrl(preview.url);
                onRemoveFile(type, index);
              }}
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
            <div className="video-preview-container">
              <video 
                controls 
                className="video-preview"
                onError={(e) => {
                  console.error('Error loading video:', preview.name);
                  revokeBlobUrl(preview.url);
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
              onClick={() => {
                revokeBlobUrl(preview.url);
                onRemoveFile(type, index);
              }}
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
            <div className="audio-preview-container">
              <div className="audio-player">
                <i className="fas fa-music audio-icon"></i>
                <audio 
                  controls 
                  className="audio-preview"
                  onError={(e) => {
                    console.error('Error loading audio:', preview.name);
                    revokeBlobUrl(preview.url);
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
              onClick={() => {
                revokeBlobUrl(preview.url);
                onRemoveFile(type, index);
              }}
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
                // Attributs pour mobile
                capture={type === 'audio' ? "user" : undefined}
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
      
      {/* Ajouter des styles inline pour s'assurer que tout est visible */}
      <style jsx>{`
        .audio-preview-container {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px;
          background: #f8f9fa;
          border-radius: 8px;
          margin-bottom: 10px;
          width: 100%;
        }
        
        .audio-player {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
        }
        
        .audio-icon {
          font-size: 24px;
          color: #667eea;
        }
        
        .audio-preview {
          flex: 1;
          height: 40px;
          border-radius: 20px;
        }
        
        audio::-webkit-media-controls-panel {
          background-color: #f1f5f9;
        }
        
        audio::-webkit-media-controls-play-button {
          background-color: #667eea;
          border-radius: 50%;
        }
        
        audio::-webkit-media-controls-current-time-display,
        audio::-webkit-media-controls-time-remaining-display {
          color: #333;
        }
        
        /* Styles responsifs pour mobile */
        @media (max-width: 768px) {
          .audio-preview-container {
            flex-direction: column;
            align-items: stretch;
          }
          
          .audio-player {
            flex-direction: row;
          }
          
          audio {
            min-width: 200px;
          }
        }
        
        /* Correction pour les contrôles audio sur iOS */
        audio {
          -webkit-appearance: none;
          appearance: none;
        }
        
        audio::-webkit-media-controls {
          -webkit-appearance: initial;
        }
      `}</style>
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