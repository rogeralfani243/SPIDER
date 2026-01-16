import React, { useRef } from 'react';

const FileUploadSection = ({
  type,
  title,
  icon,
  files,
  previews,
  onFileSelect,
  onRemoveFile,
  maxFiles = 10,
  accept,
  loading = false,
  disabled = false
}) => {
  const fileInputRef = useRef(null);
  const isMaxReached = files.length >= maxFiles;

  const handleButtonClick = () => {
    if (!disabled && !isMaxReached) {
      fileInputRef.current?.click();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFilePreview = (preview, index) => {
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
              onClick={() => onRemoveFile(index)}
              className="remove-btn"
              title="Remove"
              disabled={loading || disabled}
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
              onClick={() => onRemoveFile(index)}
              className="remove-btn"
              title="Remove"
              disabled={loading || disabled}
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
                  className="audipreview"
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
              onClick={() => onRemoveFile(index)}
              className="remove-btn"
              title="Remove"
              disabled={loading || disabled}
            >
              ×
            </button>
          </div>
        );

      case 'documents':
        const getFileIcon = (extension) => {
          switch(extension) {
            case 'pdf': return 'fas fa-file-pdf';
            case 'doc':
            case 'docx': return 'fas fa-file-word';
            case 'txt': return 'fas fa-file-alt';
            case 'zip':
            case 'rar': return 'fas fa-file-archive';
            case 'pptx': return 'fas fa-file-powerpoint';
            case 'xlsx': return 'fas fa-file-excel';
            default: return 'fas fa-file';
          }
        };

        return (
          <div key={preview.id || index} className="document-item">
            <div className="document-info">
              <i className={`${getFileIcon(preview.extension)} document-icon`}></i>
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
              onClick={() => onRemoveFile(index)}
              className="remove-btn-small"
              title="Remove"
              disabled={loading || disabled}
            >
              ×
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  const getHintText = () => {
    switch (type) {
      case 'images':
        return 'You can add up to 10 images (JPG, PNG, GIF, WebP)';
      case 'videos':
        return 'You can add up to 5 videos (MP4, AVI, MOV, WMV, WebM)';
      case 'audio':
        return 'You can add up to 5 audio files (MP3, WAV, OGG, M4A, FLAC)';
      case 'documents':
        return 'You can add up to 5 documents (PDF, DOC, DOCX, TXT, ZIP, RAR, PPTX, XLSX)';
      default:
        return '';
    }
  };

  return (
    <div className="upload-section">
      <h4>
        <i className={icon}></i> {title}
        <small className="upload-count">({files.length}/{maxFiles})</small>
      </h4>
      <div className="upload-group">
        <button
          type="button"
          onClick={handleButtonClick}
          className={`btn-upload ${isMaxReached ? 'max-reached' : ''}`}
          disabled={loading || disabled || isMaxReached}
        >
          <i className="fas fa-plus"></i> 
          {isMaxReached ? `Maximum reached (${maxFiles})` : `Add ${title.toLowerCase()}`}
        </button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={(e) => onFileSelect(e, type)}
          accept={accept}
          multiple={maxFiles > 1}
          style={{ display: 'none' }}
          disabled={loading || disabled || isMaxReached}
        />
        
        {previews.length > 0 && (
          <div className={`${type}-previews`}>
            {type === 'images' ? (
              <div className="preview-grid">
                {previews.map((preview, index) => getFilePreview(preview, index))}
              </div>
            ) : (
              <div className={`${type}-list`}>
                {previews.map((preview, index) => getFilePreview(preview, index))}
              </div>
            )}
          </div>
        )}
        
        {files.length === 0 && (
          <div className="upload-hint">
            <small>
              <i className="fas fa-info-circle"></i>
              {getHintText()}
            </small>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploadSection;