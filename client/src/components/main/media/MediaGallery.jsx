import React, { useState } from 'react';
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa';

const MediaGallery = ({ files, onClose, renderFile, startIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(startIndex);

  const nextMedia = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === files.length - 1 ? 0 : prevIndex + 1
    );
  };

  const prevMedia = () => {
    setCurrentIndex((prevIndex) => 
      prevIndex === 0 ? files.length - 1 : prevIndex - 1
    );
  };

  const currentFile = files[currentIndex];

  return (
    <div className="media-gallery-overlay">
      <div className="media-gallery-content">
        <button className="gallery-close-btn" onClick={onClose}>
          ×
        </button>
        
        <div className="gallery-navigation">
          <button className="nav-btn prev-btn" onClick={prevMedia}>
            <FaChevronLeft />
          </button>
          
          <div className="gallery-media-container">
            {renderFile(currentFile)}
          </div>
          
          <button className="nav-btn next-btn" onClick={nextMedia}>
            <FaChevronRight />
          </button>
        </div>
        
        <div className="gallery-info">
          <span className="gallery-counter">
            {currentIndex + 1} / {files.length}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MediaGallery;