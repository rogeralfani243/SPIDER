// src/components/shared/AudioPreview.jsx
import React from 'react';
import PropTypes from 'prop-types';

const AudioPreview = ({ preview, formatFileSize }) => {
  return (
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
  );
};

AudioPreview.propTypes = {
  preview: PropTypes.shape({
    url: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    extension: PropTypes.string,
    size: PropTypes.number
  }).isRequired,
  formatFileSize: PropTypes.func.isRequired
};

export default AudioPreview;