// src/components/post/components/MainImageEditor.jsx
import React, { useRef } from 'react';
import PropTypes from 'prop-types';
import { FaTrash } from 'react-icons/fa';

const MainImageEditor = ({ preview, onChange, onRemove, disabled }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      onChange(file);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="upload-section">
      <div className="upload-group">
        {preview ? (
          <div className="main-image-preview">
            <img 
              src={preview} 
              alt="Main image" 
              className="main-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = 'https://via.placeholder.com/400x300?text=Image+Error';
              }}
            />
            <button
              type="button"
              onClick={onRemove}
              className="remove-main-image-btn"
              disabled={disabled}
            >
              <FaTrash /> Remove
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={handleButtonClick}
            className="btn-upload"
            disabled={disabled}
          >
            <i className="fas fa-plus"></i> 
            {preview ? 'Change main image' : 'Add main image'}
          </button>
        )}
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          style={{ display: 'none' }}
          disabled={disabled}
        />
      </div>
    </div>
  );
};

MainImageEditor.propTypes = {
  preview: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  onRemove: PropTypes.func.isRequired,
  disabled: PropTypes.bool.isRequired
};

export default MainImageEditor;