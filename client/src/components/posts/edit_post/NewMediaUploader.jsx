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
      accept: 'video/*,.mp4,.avi,.mov,.wmv,.webm',
      getHint: () => 'You can add up to 5 videos (MP4, AVI, MOV, WMV, WebM)'
    },
    {
      type: 'audio',
      title: 'Audio',
      icon: <FaMusic />,
      maxCount: 5,
      // IMPORTANT: Correction pour mobile - ajout des extensions spécifiques
      accept: 'audio/*,.mp3,.wav,.ogg,.m4a,.flac,.aac,.wma',
      getHint: () => 'You can add up to 5 audio files (MP3, WAV, OGG, M4A, FLAC, AAC, WMA)'
    },
    {
      type: 'documents',
      title: 'Documents',
      icon: <FaFile />,
      maxCount: 5,
      accept: '.pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx,.csv,.rtf',
      getHint: () => 'You can add up to 5 documents (PDF, DOC, DOCX, TXT, ZIP, RAR, PPTX, XLSX, CSV, RTF)'
    }
  ];

  const handleButtonClick = (type) => {
    fileInputRefs[type].current?.click();
  };

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    
    // Validation améliorée pour mobile
    const validFiles = selectedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const extension = file.name.split('.').pop().toLowerCase();
      const mimeType = file.type;
      
      // Log pour déboguer
      console.log(`File selected: ${fileName}, type: ${mimeType}, extension: ${extension}`);
      
      switch(type) {
        case 'images':
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension) ||
                 mimeType.startsWith('image/');
        
        case 'videos':
          return ['mp4', 'avi', 'mov', 'wmv', 'webm', 'm4v', '3gp'].includes(extension) ||
                 mimeType.startsWith('video/');
        
        case 'audio':
          // Validation plus large pour mobile
          const audioExtensions = ['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac', 'wma', 'm4b', 'mpga', 'weba'];
          const audioMimeTypes = [
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/mp4', 
            'audio/flac', 'audio/aac', 'audio/x-ms-wma', 'audio/webm',
            'audio/x-m4a', 'audio/x-aac'
          ];
          
          return audioExtensions.includes(extension) ||
                 audioMimeTypes.includes(mimeType) ||
                 mimeType.startsWith('audio/');
        
        case 'documents':
          return ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'pptx', 'xlsx', 'csv', 'rtf'].includes(extension);
        
        default:
          return false;
      }
    });
    
    console.log(`Valid files for ${type}:`, validFiles.length);
    
    if (validFiles.length === 0) {
      // Afficher une erreur pour les fichiers invalides
      alert(`Some files were not accepted. Please make sure they are in the correct format for ${type}.`);
      e.target.value = '';
      return;
    }
    
    // Create previews avec gestion d'erreur
    const previews = validFiles.map(file => {
      try {
        const fileId = Date.now() + Math.random();
        const extension = file.name.split('.').pop().toLowerCase();
        const mimeType = file.type;
        
        switch(type) {
          case 'images':
            const imageUrl = URL.createObjectURL(file);
            return {
              url: imageUrl,
              name: file.name,
              id: fileId,
              type: 'image',
              size: file.size,
              file: file
            };
            
          case 'videos':
            const videoUrl = URL.createObjectURL(file);
            return {
              url: videoUrl,
              blobUrl: videoUrl,
              name: file.name,
              id: fileId,
              type: 'video',
              size: file.size,
              extension: extension,
              mimeType: mimeType,
              file: file
            };
            
          case 'audio':
            const audioUrl = URL.createObjectURL(file);
            return {
              url: audioUrl,
              blobUrl: audioUrl,
              name: file.name,
              id: fileId,
              type: 'audio',
              size: file.size,
              extension: extension,
              mimeType: mimeType,
              file: file
            };
            
          case 'documents':
            return {
              name: file.name,
              id: fileId,
              type: 'document',
              size: file.size,
              extension: extension,
              mimeType: mimeType,
              file: file
            };
            
          default:
            return null;
        }
      } catch (error) {
        console.error('Error creating preview for file:', file.name, error);
        return null;
      }
    }).filter(Boolean);
    
    if (previews.length > 0) {
      onFileSelect(type, validFiles, previews);
    } else {
      alert('Unable to create previews for the selected files.');
    }
    
    e.target.value = '';
  };

  const getFilePreview = (preview, type, index) => {
    // Fonction pour nettoyer les URLs blob
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
            <VideoPreview 
              preview={preview} 
              formatFileSize={formatFileSize} 
              onRemove={() => {
                revokeBlobUrl(preview.blobUrl);
                onRemoveFile(type, index);
              }}
            />
            <button
              type="button"
              onClick={() => {
                revokeBlobUrl(preview.blobUrl);
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
            <AudioPreview 
              preview={preview} 
              formatFileSize={formatFileSize} 
              onRemove={() => {
                revokeBlobUrl(preview.blobUrl);
                onRemoveFile(type, index);
              }}
            />
            <button
              type="button"
              onClick={() => {
                revokeBlobUrl(preview.blobUrl);
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

  // Fonction pour détecter si on est sur mobile
  const isMobile = () => {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  };

  // Fonction spéciale pour mobile - ouvrir directement la galerie audio
  const handleMobileAudioUpload = () => {
    if (isMobile()) {
      // Sur mobile, on peut essayer différentes approches
      console.log('Mobile device detected, using enhanced audio upload');
    }
    fileInputRefs.audio.current?.click();
  };

  return (
    <>
      {uploadSections.map(({ type, title, icon, maxCount, accept, getHint }) => {
        const totalCount = existingMedia[type].length + newFiles[type].length;
        const isMaxReached = totalCount >= maxCount;
        
        // Gestion spéciale pour audio sur mobile
        const isAudioOnMobile = type === 'audio' && isMobile();
        
        return (
          <div key={type} className="upload-section">
            <h4>
              {icon} {title}
              <small className="upload-count">({totalCount}/{maxCount})</small>
            </h4>
            <div className="upload-group">
              <button
                type="button"
                onClick={isAudioOnMobile ? handleMobileAudioUpload : () => handleButtonClick(type)}
                className={`btn-upload ${isMaxReached ? 'max-reached' : ''}`}
                disabled={disabled || isMaxReached}
                title={isAudioOnMobile ? "Tap to select audio files from your device" : ""}
              >
                <i className="fas fa-plus"></i> 
                {isMaxReached 
                  ? `Maximum reached (${maxCount})` 
                  : isAudioOnMobile
                    ? `Tap to select audio`
                    : `Add ${title.toLowerCase()}`
                }
              </button>
              
              <input
                type="file"
                ref={fileInputRefs[type]}
                onChange={(e) => handleFileChange(e, type)}
                accept={accept}
                multiple={maxCount > 1}
                style={{ display: 'none' }}
                disabled={disabled || isMaxReached}
                // Attributs spécifiques pour mobile
                capture={type === 'audio' && isMobile() ? "user" : undefined}
                webkitdirectory={type === 'documents' && isMobile() ? "false" : undefined}
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
                    {isAudioOnMobile && (
                      <span style={{display: 'block', marginTop: '5px', color: '#666'}}>
                        Note: On mobile, you can select files from your device's storage or recordings.
                      </span>
                    )}
                  </small>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Message d'aide pour mobile */}
      {isMobile() && (
        <div className="mobile-help" style={{
          marginTop: '20px',
          padding: '10px',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          fontSize: '12px',
          color: '#666'
        }}>
          <strong>Mobile Tips:</strong>
          <ul style={{margin: '5px 0 0 20px', padding: 0}}>
            <li>For audio: Use "Files" app or "Audio Recorder" depending on your device</li>
            <li>Supported formats: MP3, M4A, WAV, AAC</li>
            <li>If files don't appear, check app permissions</li>
          </ul>
        </div>
      )}
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