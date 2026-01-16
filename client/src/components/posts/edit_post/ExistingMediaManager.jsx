// src/components/post/components/ExistingMediaManager.jsx
import React from 'react';
import PropTypes from 'prop-types';
import { FaImage, FaVideo, FaMusic, FaFile, FaTrash, FaExternalLinkAlt } from 'react-icons/fa';

const ExistingMediaManager = ({ 
  existingMedia, 
  mediaToDelete, 
  onDelete, 
  formatFileSize, 
  getFileIcon, 
  disabled 
}) => {
  
  const ExistingMediaSection = ({ type, title, icon, items }) => {
    if (items.length === 0) return null;
    
    const deletionCount = type === 'images' 
      ? mediaToDelete.images.length 
      : mediaToDelete.files.filter(id => items.some(item => item.id === id)).length;
    
    return (
      <div className="existing-media-section">
        <h4>
          {icon} {title} ({items.length})
          {deletionCount > 0 && (
            <span className="deletion-badge">
              {deletionCount} marked for deletion
            </span>
          )}
        </h4>
        
        {type === 'images' ? (
          <div className="existing-media-grid">
            {items.map(item => (
              <ExistingImageItem 
                key={item.id}
                item={item}
                onDelete={() => onDelete(type, item.id)}
                disabled={disabled}
              />
            ))}
          </div>
        ) : (
          <div className="existing-media-list">
            {items.map(item => (
              <ExistingFileItem 
                key={item.id}
                item={item}
                type={type}
                onDelete={() => onDelete(type, item.id)}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
                disabled={disabled}
              />
            ))}
          </div>
        )}
      </div>
    );
  };

  const ExistingImageItem = ({ item, onDelete, disabled }) => (
    <div className="existing-media-item">
      <img 
        src={item.url} 
        alt={item.name} 
        className="existing-image"
        onError={(e) => {
          e.target.onerror = null;
          e.target.src = 'https://via.placeholder.com/150x150?text=Image+Error';
        }}
      />
      <div className="existing-media-info">
       
        <button
          type="button"
          onClick={onDelete}
          className="remove-existing-btn"
          disabled={disabled}
        >
          <FaTrash /> 
        </button>
      </div>
    </div>
  );

  const ExistingFileItem = ({ item, type, onDelete, formatFileSize, getFileIcon, disabled }) => {
    const fileIcon = type === 'videos' 
      ? <FaVideo /> 
      : type === 'audio' 
        ? <FaMusic /> 
        : <i className={getFileIcon(item.type || 'file')}></i>;
    
    const fileTypeLabel = type.charAt(0).toUpperCase() + type.slice(1);

    return (
      <div className="existing-media-item">
        <div className={`existing-${type}-info`}>
          {fileIcon}
          <span className="existing-media-name" style={{'@media(max-width:746px)':{maxWidth:'10px'}}}>
            {item.name}
          </span>
          <span className="file-type-badge">{fileTypeLabel}</span>
        </div>
        <div className="existing-media-actions">
          <a 
            href={item.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="view-existing-btn"
          >
            <FaExternalLinkAlt /> View
          </a>
          <button
            type="button"
            onClick={onDelete}
            className="remove-existing-btn"
            disabled={disabled}
          >
            <FaTrash /> Delete
          </button>
        </div>
      </div>
    );
  };

  return (
    <>
      <ExistingMediaSection 
        type="images"
        title="Existing Images"
        icon={<FaImage />}
        items={existingMedia.images}
      />
      
      <ExistingMediaSection 
        type="videos"
        title="Existing Videos"
        icon={<FaVideo />}
        items={existingMedia.videos}
      />
      
      <ExistingMediaSection 
        type="audio"
        title="Existing Audio"
        icon={<FaMusic />}
        items={existingMedia.audio}
      />
      
      <ExistingMediaSection 
        type="documents"
        title="Existing Documents"
        icon={<FaFile />}
        items={existingMedia.documents}
      />
    </>
  );
};

ExistingMediaManager.propTypes = {
  existingMedia: PropTypes.shape({
    images: PropTypes.array,
    videos: PropTypes.array,
    audio: PropTypes.array,
    documents: PropTypes.array
  }).isRequired,
  mediaToDelete: PropTypes.shape({
    images: PropTypes.array,
    files: PropTypes.array
  }).isRequired,
  onDelete: PropTypes.func.isRequired,
  formatFileSize: PropTypes.func.isRequired,
  getFileIcon: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
};

export default ExistingMediaManager;