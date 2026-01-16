// src/components/shared/VideoPreview.jsx
import React from 'react';
import PropTypes from 'prop-types';

const VideoPreview = ({ preview, formatFileSize }) => {
  return (
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
  );
};

VideoPreview.propTypes = {
  preview: PropTypes.shape({
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    extension: PropTypes.string,
    size: PropTypes.number
  }).isRequired,
  formatFileSize: PropTypes.func.isRequired
};

export default VideoPreview;