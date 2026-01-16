import React from 'react';
import { getMediaType, getFileIcon } from '../../../utils/mediaUtils';

const MediaThumbnails = ({ mediaFiles, activeMediaIndex, onMediaChange }) => {
  const showTitle = mediaFiles.length > 9;
  return (
    <div className="media-thumbnails" >
      {mediaFiles.map((media, index) => {
        const mediaType = getMediaType(media);
        const url = media.url || media;
        const isActive = index === activeMediaIndex;
        
        return (
          <div
          title={showTitle ? 'Slide with your arrow keys on the keyboard' : undefined}
            key={index}
            className={`thumbnail-item ${isActive ? 'active' : ''}`}
            onClick={() => onMediaChange && onMediaChange(index)}
          >
            {mediaType === 'image' ? (
              <img src={url} alt={`Thumbnail ${index + 1}`} />
            ) : (
              <div className="file-thumbnail">
                {getFileIcon(media)}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default MediaThumbnails;