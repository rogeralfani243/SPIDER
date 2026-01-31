// src/components/post/edit_post/NewMediaUploader.jsx
import React, { useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { FaImage, FaVideo, FaMusic, FaFile } from 'react-icons/fa';

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

  const [isMobile, setIsMobile] = useState(false);

  // Détecter mobile au chargement
  React.useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      setIsMobile(isMobileDevice);
      console.log('📱 Mobile detection:', isMobileDevice, navigator.userAgent);
    };
    checkMobile();
  }, []);

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
      // Pour mobile: accepter plus de formats vidéo
      accept: isMobile ? 'video/*,video/quicktime,video/mp4,video/x-m4v' : 'video/*',
      getHint: () => 'You can add up to 5 videos (MP4, MOV, AVI, WMV)'
    },
    {
      type: 'audio',
      title: 'Audio',
      icon: <FaMusic />,
      maxCount: 5,
      // Accept spécifique pour mobile
      accept: isMobile ? 'audio/*,audio/mpeg,audio/mp4,audio/x-m4a,audio/wav,audio/x-wav,audio/ogg,audio/webm' : 'audio/*',
      getHint: () => isMobile 
        ? 'You can add up to 5 audio files (MP3, M4A, WAV, OGG)' 
        : 'You can add up to 5 audio files (MP3, WAV, OGG, M4A, FLAC)',
      // Input spécial pour mobile
      mobileAttributes: {
        capture: 'environment', // Permet de choisir entre microphone, caméra, fichiers
        webkitdirectory: false,
        directory: false
      }
    },
    {
      type: 'documents',
      title: 'Documents',
      icon: <FaFile />,
      maxCount: 5,
      accept: '.pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx,.csv,.rtf,.odt',
      getHint: () => 'You can add up to 5 documents (PDF, DOC, DOCX, TXT, ZIP, RAR)'
    }
  ];

  // Fonction spéciale pour mobile - ouvre le bon sélecteur
  const handleMobileUpload = (type) => {
    if (!isMobile) {
      fileInputRefs[type].current?.click();
      return;
    }

    console.log('📱 Mobile upload for:', type);
    
    // Sur mobile, on crée un input temporaire avec les bons attributs
    const tempInput = document.createElement('input');
    tempInput.type = 'file';
    tempInput.accept = uploadSections.find(s => s.type === type)?.accept || '*/*';
    
    if (type === 'audio') {
      // Pour audio sur mobile, utiliser 'capture' pour accéder au microphone
      tempInput.setAttribute('capture', 'user');
      tempInput.accept = 'audio/*';
    }
    
    if (type === 'images' || type === 'videos') {
      tempInput.multiple = true;
    } else {
      tempInput.multiple = uploadSections.find(s => s.type === type)?.maxCount > 1;
    }
    
    tempInput.onchange = (e) => {
      if (e.target.files.length > 0) {
        handleFileChange({ target: e.target }, type);
      }
    };
    
    // Simuler un clic sur l'input
    tempInput.click();
  };

  const handleFileChange = (e, type) => {
    const selectedFiles = Array.from(e.target.files);
    
    if (selectedFiles.length === 0) {
      console.log('No files selected');
      return;
    }
    
    console.log(`📁 Files selected for ${type}:`, selectedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size,
      lastModified: f.lastModified
    })));
    
    // Validation plus permissive pour mobile
    const validFiles = selectedFiles.filter(file => {
      const fileName = file.name.toLowerCase();
      const mimeType = file.type.toLowerCase();
      
      console.log(`🔍 Validating file: ${fileName}, type: ${mimeType}`);
      
      // Accepter tous les fichiers pour audio sur mobile
      if (type === 'audio' && isMobile) {
        // Sur mobile, accepter plus largement
        const isAudio = mimeType.startsWith('audio/') || 
                       /\.(mp3|wav|ogg|m4a|flac|aac|wma|m4b|mpga|weba|opus|mid|midi|amr|3gp)$/i.test(fileName);
        console.log(`🎵 Audio validation for ${fileName}: ${isAudio}`);
        return isAudio;
      }
      
      switch(type) {
        case 'images':
          return mimeType.startsWith('image/') || 
                 /\.(jpg|jpeg|png|gif|webp|bmp|svg|heic|heif)$/i.test(fileName);
        
        case 'videos':
          return mimeType.startsWith('video/') || 
                 /\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv|m4v|3gp|mpeg|mpg)$/i.test(fileName);
        
        case 'audio':
          return mimeType.startsWith('audio/') || 
                 /\.(mp3|wav|ogg|m4a|flac|aac|wma|m4b|mpga|weba|opus|midi?)$/i.test(fileName);
        
        case 'documents':
          return /\.(pdf|doc|docx|txt|zip|rar|pptx|xlsx|csv|rtf|odt)$/i.test(fileName);
        
        default:
          return false;
      }
    });
    
    console.log(`✅ Valid files for ${type}:`, validFiles.length, 'out of', selectedFiles.length);
    
    if (validFiles.length === 0) {
      const errorMsg = isMobile 
        ? `No valid files selected. On mobile, try selecting files from your "Files" app or "Downloads" folder.`
        : `No valid files selected. Please make sure the files are in the correct format for ${type}.`;
      
      alert(errorMsg);
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
        extension: extension,
        mimeType: file.type
      };
      
      // Créer une URL blob pour la prévisualisation (sauf pour les très gros fichiers)
      if (file.size < 50 * 1024 * 1024) { // Max 50MB pour les previews
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
        }
      } else {
        console.log('File too large for preview:', file.name, file.size);
      }
      
      return preview;
    });
    
    // Appeler la fonction parent
    onFileSelect(type, validFiles, previews);
    
    // Réinitialiser l'input
    if (e.target && e.target.value) {
      e.target.value = '';
    }
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
              src={preview.url || 'https://via.placeholder.com/150x150?text=Image'} 
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
              {preview.url ? (
                <video 
                  controls 
                  className="video-preview"
                  onError={(e) => {
                    console.error('Error loading video:', preview.name);
                    revokeBlobUrl(preview.url);
                    e.target.onerror = null;
                  }}
                >
                  <source src={preview.url} type={preview.mimeType || `video/${preview.extension}`} />
                  Your browser does not support video playback.
                </video>
              ) : (
                <div className="video-placeholder">
                  <i className="fas fa-video"></i>
                  <span>Video preview not available</span>
                </div>
              )}
              <div className="preview-info">
                <span className="preview-name" title={preview.name}>
                  {preview.name.length > 20 ? preview.name.substring(0, 17) + '...' : preview.name}
                </span>
                <div className="preview-meta">
                  <span className="file-size">{formatFileSize(preview.size)}</span>
                  <span className="file-type">.{preview.extension}</span>
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
                {preview.url ? (
                  <audio 
                    controls 
                    className="audio-preview"
                    onError={(e) => {
                      console.error('Error loading audio:', preview.name);
                      revokeBlobUrl(preview.url);
                      e.target.onerror = null;
                    }}
                  >
                    <source src={preview.url} type={preview.mimeType || `audio/${preview.extension}`} />
                    Your browser does not support audio playback.
                  </audio>
                ) : (
                  <div className="audio-info">
                    <span className="audio-name">{preview.name}</span>
                    <span className="audio-size">{formatFileSize(preview.size)}</span>
                  </div>
                )}
              </div>
              <div className="preview-info">
                <span className="preview-name" title={preview.name}>
                  {preview.name.length > 25 ? preview.name.substring(0, 22) + '...' : preview.name}
                </span>
                <div className="preview-meta">
                  <span className="file-size">{formatFileSize(preview.size)}</span>
                  <span className="file-type">.{preview.extension}</span>
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
      {uploadSections.map(({ type, title, icon, maxCount, accept, getHint, mobileAttributes }) => {
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
                onClick={() => handleMobileUpload(type)}
                className={`btn-upload ${isMaxReached ? 'max-reached' : ''}`}
                disabled={disabled || isMaxReached}
                title={isMobile ? `Tap to select ${type}` : `Click to select ${type}`}
              >
                <i className="fas fa-plus"></i> 
                {isMaxReached 
                  ? `Maximum reached (${maxCount})` 
                  : `Add ${title.toLowerCase()}`
                }
                {isMobile && type === 'audio' && (
                  <span style={{fontSize: '10px', display: 'block', marginTop: '2px'}}>
                    (Tap to record or select)
                  </span>
                )}
              </button>
              
              {/* Input caché - utilisé pour desktop */}
              <input
                type="file"
                ref={fileInputRefs[type]}
                onChange={(e) => handleFileChange(e, type)}
                accept={accept}
                multiple={maxCount > 1}
                style={{ display: 'none' }}
                disabled={disabled || isMaxReached}
                {...(mobileAttributes || {})}
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
                    {isMobile && type === 'audio' && (
                      <span style={{display: 'block', marginTop: '4px', color: '#666'}}>
                        On mobile: Use "Record audio" or select from "Files"
                      </span>
                    )}
                  </small>
                </div>
              )}
            </div>
          </div>
        );
      })}
      
      {/* Conseils spécifiques pour mobile */}
      {isMobile && (
        <div className="mobile-tips" style={{
          marginTop: '20px',
          padding: '12px',
          backgroundColor: '#f0f7ff',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#0066cc',
          border: '1px solid #cce5ff'
        }}>
          <strong><i className="fas fa-mobile-alt"></i> Mobile Tips:</strong>
          <ul style={{margin: '8px 0 0 20px', padding: 0}}>
            <li><strong>Audio:</strong> Tap "Add audio" → Choose "Record audio" or browse files</li>
            <li><strong>Files:</strong> Use "Files" app to select from Downloads or other folders</li>
            <li><strong>Permissions:</strong> Make sure the app has permission to access files</li>
            <li><strong>Formats:</strong> Supported: MP3, M4A, WAV for audio; MP4, MOV for video</li>
          </ul>
        </div>
      )}
      
      {/* Styles inline pour les previews audio */}
      <style jsx>{`
        .audio-preview-container {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 10px;
          color: white;
          margin-bottom: 10px;
          width: 100%;
        }
        
        .audio-player {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0; /* Important pour le responsive */
        }
        
        .audio-icon {
          font-size: 24px;
          color: white;
          flex-shrink: 0;
        }
        
        .audio-preview {
          flex: 1;
          height: 40px;
          min-width: 150px;
          border-radius: 20px;
        }
        
        .audio-info {
          flex: 1;
          padding: 8px;
          background: rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        
        .audio-name {
          font-size: 12px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .audio-size {
          font-size: 10px;
          opacity: 0.8;
        }
        
        /* Améliorations pour mobile */
        @media (max-width: 768px) {
          .audio-preview-container {
            flex-direction: column;
            align-items: stretch;
            gap: 10px;
          }
          
          .audio-player {
            flex-direction: row;
            min-width: 100%;
          }
          
          .audio-preview {
            min-width: 200px;
          }
          
          .btn-upload {
            padding: 14px 16px;
            font-size: 15px;
          }
        }
        
        /* Correction pour les contrôles audio sur iOS */
        audio {
          -webkit-appearance: none;
          appearance: none;
          background: rgba(255, 255, 255, 0.9);
        }
        
        audio::-webkit-media-controls-panel {
          -webkit-appearance: initial;
          background: rgba(255, 255, 255, 0.9);
        }
        
        audio::-webkit-media-controls-play-button {
          background-color: #667eea;
          border-radius: 50%;
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