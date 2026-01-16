import React from 'react';
import { FaImages, FaEllipsisH, FaFilePdf } from 'react-icons/fa';
import FileRenderer, { renderFileThumbnail } from '../media/FileRenderer';
import '../../styles/profile_details/post-media.css';

// Helper function to safely get URL from any input
const getSafeUrl = (item) => {
  if (!item) return null;
  
  // If it's already a string (URL), return it
  if (typeof item === 'string') return item;
  
  // If it's an object, extract URL
  if (typeof item === 'object') {
    return item.url || item.file_url || item.file || item.image || item.image_url || null;
  }
  
  return null;
};

const PostMedia = ({ 
  post, 
  URL, 
  isMobile, 
  onToggleShowAllMedia, 
  onThumbnailClick, 
  onOpenGallery 
}) => {
  // Fonction sécurisée pour obtenir un nom de fichier propre
  const getCleanFileName = (fileInput) => {
    if (!fileInput) return 'File';
    
    // Si c'est un objet avec name property
    if (typeof fileInput === 'object') {
      return fileInput.name || fileInput.displayName || 'File';
    }
    
    // Si c'est une URL, extraire le nom du fichier
    const fileUrl = getSafeUrl(fileInput);
    if (!fileUrl || typeof fileUrl !== 'string') return 'File';
    
    try {
      const fileName = fileUrl.split('/').pop() || 'File';
      
      // Vérifier si c'est un PDF
      if (fileName.toLowerCase().endsWith('.pdf')) {
        return 'PDF File';
      }
      
      // Pour les autres types de fichiers, retourner le nom original
      return fileName;
    } catch (e) {
      console.error('Error getting file name:', e);
      return 'File';
    }
  };

  // Fonction sécurisée pour vérifier si c'est un PDF
  const isPdfFile = (fileInput) => {
    // Get URL safely first
    const fileUrl = getSafeUrl(fileInput);
    if (!fileUrl || typeof fileUrl !== 'string') return false;
    
    try {
      const fileName = fileUrl.split('/').pop() || '';
      return fileName.toLowerCase().endsWith('.pdf');
    } catch (e) {
      console.error('Error checking PDF:', e);
      return false;
    }
  };

  // Fonction pour obtenir l'icône du fichier
  const getFileIcon = (fileInput) => {
    if (isPdfFile(fileInput)) {
      return <FaFilePdf className="file-icon pdf-icon" />;
    }
    return null;
  };

  const getAllMediaFromPost = (post) => {
    if (!post) return [];
    
    const media = [];
    
    // Helper to process files safely
    const processFile = (file) => {
      if (!file) return null;
      
      const fileUrl = getSafeUrl(file);
      if (!fileUrl) return null;
      
      return {
        url: fileUrl,
        type: isPdfFile(file) ? 'pdf' : 'file',
        displayName: getCleanFileName(file),
        rawFile: file // Keep original for debugging
      };
    };
    
    // Add main image
    const hasImage = post.image || post.image_url;
    const imageUrl = getSafeUrl(post.image || post.image_url);
    
    if (hasImage && imageUrl) {
      media.push({
        url: imageUrl,
        type: 'image',
        displayName: 'Image',
        rawFile: post.image || post.image_url
      });
    }
    
    // Add files
    if (post.files) {
      if (Array.isArray(post.files)) {
        post.files.forEach(file => {
          const processedFile = processFile(file);
          if (processedFile) {
            media.push(processedFile);
          }
        });
      } else {
        const processedFile = processFile(post.files);
        if (processedFile) {
          media.push(processedFile);
        }
      }
    }
    
    // Debug: Log what we're getting
    console.log('PostMedia - processed media:', {
      postId: post.id,
      mediaCount: media.length,
      mediaItems: media.map(m => ({
        url: m.url,
        type: m.type,
        displayName: m.displayName,
        urlType: typeof m.url,
        rawFileType: typeof m.rawFile
      }))
    });
    
    return media;
  };

  const allMedia = getAllMediaFromPost(post);
  
  if (allMedia.length === 0) {
    return null;
  }

  // Composant pour afficher une miniature de fichier
  const renderFileItem = (fileItem, index) => {
    const isPdf = fileItem.type === 'pdf';
    
    // Safely get URLs for thumbnail click
    const getSafeUrls = () => {
      return allMedia
        .map(m => getSafeUrl(m.url || m))
        .filter(url => url && typeof url === 'string');
    };
    
    if (isPdf) {
      return (
        <div 
          key={index} 
          className="file-thumbnail pdf-thumbnail"
          onClick={() => onThumbnailClick(post.id, getSafeUrls(), index)}
        >
          <div className="pdf-preview">
            <FaFilePdf className="pdf-icon-large" />
            <span className="pdf-label">{fileItem.displayName || 'PDF File'}</span>
          </div>
        </div>
      );
    }
    
    // Pour les autres types de fichiers, utiliser le renderer existant
    const fileUrl = getSafeUrl(fileItem.url);
    
    return (
      <div 
        key={index} 
        className="file-thumbnail"
        onClick={() => onThumbnailClick(post.id, getSafeUrls(), index)}
      >
        {fileUrl ? renderFileThumbnail(fileUrl, URL) : (
          <div className="file-placeholder">
            <span>📁</span>
            <span>{fileItem.displayName || 'File'}</span>
          </div>
        )}
      </div>
    );
  };

  // If only one media, display normally
  if (allMedia.length === 1) {
    const fileItem = allMedia[0];
    const fileUrl = getSafeUrl(fileItem.url);
    
    if (fileItem.type === 'pdf') {
      return (
        <div className="files-container single-file pdf-file">
          <div className="pdf-file-preview">
            <FaFilePdf className="pdf-icon-large" />
            <div className="pdf-file-info">
              <span className="pdf-file-label">{fileItem.displayName || 'PDF Document'}</span>
              <button 
                className="view-pdf-btn"
                onClick={() => {
                  const urls = allMedia
                    .map(m => getSafeUrl(m.url))
                    .filter(url => url && typeof url === 'string');
                  onThumbnailClick(post.id, urls, 0);
                }}
              >
                View PDF
              </button>
            </div>
          </div>
        </div>
      );
    }
    
    return (
      <div className="files-container single-file">
        {fileUrl ? <FileRenderer fileUrl={fileUrl} URL={URL} /> : (
          <div className="no-file-available">
            <span>No file available</span>
          </div>
        )}
      </div>
    );
  }

  // ON MOBILE: Display only first media + button
  if (isMobile && !post.showAllMedia) {
    const firstMedia = allMedia[0];
    const firstMediaUrl = getSafeUrl(firstMedia.url);
    
    return (
      <div className="files-container mobile-preview">
        <div className="first-media">
          {firstMedia.type === 'pdf' ? (
            <div className="pdf-preview-mobile">
              <FaFilePdf className="pdf-icon-mobile" />
              <span>{firstMedia.displayName || 'PDF File'}</span>
            </div>
          ) : firstMediaUrl ? (
            <FileRenderer fileUrl={firstMediaUrl} URL={URL} />
          ) : (
            <div className="no-file-mobile">
              <span>No media available</span>
            </div>
          )}
        </div>
        
        <button 
          className="show-more-media-btn"
          onClick={() => onToggleShowAllMedia(post.id)}
        >
          <FaImages />
          <span>View {allMedia.length - 1} more media</span>
        </button>
      </div>
    );
  }

  // ON MOBILE (full display) or DESKTOP: Display all media
  return (
    <div className={`files-container grouped-files ${isMobile ? 'mobile-full' : ''}`}>
      <div className="grouped-header">
        <h4>Shared Media ({allMedia.length})</h4>
        {isMobile && (
          <button 
            className="hide-media-btn"
            onClick={() => onToggleShowAllMedia(post.id)}
          >
            Collapse
          </button>
        )}
      </div>
      
      <div className="files-grid">
        {allMedia.map((fileItem, index) => renderFileItem(fileItem, index))}
      </div>
      
      {/* Desktop navigation menu */}
      {!isMobile && (
        <div className="media-menu">
          <button 
            className="media-menu-btn"
            onClick={() => {
              const urls = allMedia
                .map(m => getSafeUrl(m.url))
                .filter(url => url && typeof url === 'string');
              onOpenGallery(post.id, urls);
            }}
          >
            <FaEllipsisH />
            <span>Open Gallery ({allMedia.length} media)</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default PostMedia;