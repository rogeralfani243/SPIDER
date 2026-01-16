import React from 'react';
import { 
  FaImages, 
  FaEllipsisH, 
  FaFilePdf, 
  FaFileVideo, 
  FaFileAudio, 
  FaFileAlt,
  FaFileExcel,
  FaFileArchive,
  FaFile,
  FaImage
} from 'react-icons/fa';
import { AiOutlineFile } from 'react-icons/ai';
import FileRenderer, { renderFileThumbnail, getFileIcon } from '../media/FileRenderer';
import '../../styles/profile_details/post-media.css';

const PostMedia = ({ 
  post, 
  URL, 
  isMobile, 
  onToggleShowAllMedia, 
  onThumbnailClick, 
  onOpenGallery 
}) => {
  // Fonction pour obtenir un nom de fichier propre
  const getCleanFileName = (fileInput) => {
    if (!fileInput) return 'File';
    
    if (typeof fileInput === 'string') {
      return fileInput.split('/').pop() || 'File';
    }
    
    if (fileInput && typeof fileInput === 'object') {
      if (fileInput.name) return fileInput.name;
      if (fileInput.file && typeof fileInput.file === 'string') {
        return fileInput.file.split('/').pop() || 'File';
      }
      if (fileInput.file_url && typeof fileInput.file_url === 'string') {
        return fileInput.file_url.split('/').pop() || 'File';
      }
      if (fileInput.url && typeof fileInput.url === 'string') {
        return fileInput.url.split('/').pop() || 'File';
      }
    }
    
    return 'File';
  };

  // Fonction pour extraire l'URL
  const getFileUrl = (fileInput) => {
    if (!fileInput) return null;
    
    if (typeof fileInput === 'string') {
      return fileInput;
    }
    
    if (fileInput && typeof fileInput === 'object') {
      if (fileInput.file_url && typeof fileInput.file_url === 'string') {
        return fileInput.file_url;
      }
      if (fileInput.file && typeof fileInput.file === 'string') {
        return fileInput.file;
      }
      if (fileInput.url && typeof fileInput.url === 'string') {
        return fileInput.url;
      }
      if (fileInput.image && typeof fileInput.image === 'string') {
        return fileInput.image;
      }
      if (fileInput.image_url && typeof fileInput.image_url === 'string') {
        return fileInput.image_url;
      }
    }
    
    return null;
  };

  // Fonction pour déterminer le type de fichier
  const getFileType = (fileInput) => {
    const fileUrl = getFileUrl(fileInput);
    if (!fileUrl) return 'unknown';
    
    const fileName = String(fileUrl).toLowerCase();
    
    if (fileName.endsWith('.pdf')) return 'pdf';
    
    const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
    if (imageExts.some(ext => fileName.endsWith(ext))) return 'image';
    
    const videoExts = ['.mp4', '.mov', '.avi', '.mkv', '.wmv', '.flv', '.webm'];
    if (videoExts.some(ext => fileName.endsWith(ext))) return 'video';
    
    const audioExts = ['.mp3', '.wav', '.ogg', '.m4a', '.aac', '.flac'];
    if (audioExts.some(ext => fileName.endsWith(ext))) return 'audio';
    
    const docExts = ['.doc', '.docx', '.txt', '.rtf', '.odt'];
    if (docExts.some(ext => fileName.endsWith(ext))) return 'document';
    
    const sheetExts = ['.xls', '.xlsx', '.csv'];
    if (sheetExts.some(ext => fileName.endsWith(ext))) return 'spreadsheet';
    
    const archiveExts = ['.zip', '.rar', '.7z'];
    if (archiveExts.some(ext => fileName.endsWith(ext))) return 'archive';
    
    return 'unknown';
  };

  // Fonction pour obtenir l'icône selon le type de fichier
  const getFileTypeIcon = (fileType, size = 20) => {
    switch(fileType) {
      case 'pdf':
        return <FaFilePdf size={size} color="#F40F02" />;
      case 'video':
        return <FaFileVideo size={size} color="#FF0000" />;
      case 'audio':
        return <FaFileAudio size={size} color="#FF6B00" />;
      case 'document':
        return <FaFileAlt size={size} color="#2B579A" />;
      case 'spreadsheet':
        return <FaFileExcel size={size} color="#217346" />;
      case 'archive':
        return <FaFileArchive size={size} color="#795548" />;
      case 'image':
        return <FaImage size={size} color="#4CAF50" />;
      case 'unknown':
      default:
        return <FaFile size={size} color="#757575" />;
    }
  };

  // Récupérer tous les médias
  const getAllMediaFromPost = (post) => {
    const media = [];
    
    // Images
    const allImages = [];
    const mainImageUrl = post.image || post.image_url;

    if (post.post_images && Array.isArray(post.post_images) && post.post_images.length > 0) {
      let startIndex = 0;
      
      if (mainImageUrl && post.post_images[0]) {
        const firstPostImageUrl = getFileUrl(post.post_images[0]);
        if (firstPostImageUrl === mainImageUrl) {
          startIndex = 1;
        }
      }
      
      post.post_images.slice(startIndex).forEach((postImage, index) => {
        const imageUrl = getFileUrl(postImage);
        if (imageUrl) {
          allImages.push({
            url: imageUrl,
            type: 'image',
            displayName: getCleanFileName(postImage),
            isPostImage: true,
            order: postImage.order || (index + startIndex),
            id: postImage.id,
            fileType: 'image'
          });
        }
      });
    }
    
    media.push(...allImages);
    
    // Fichiers historiques
    if (post.files) {
      if (Array.isArray(post.files)) {
        post.files.forEach(file => {
          if (file) {
            const fileUrl = getFileUrl(file);
            if (fileUrl) {
              const fileType = getFileType(fileUrl);
              media.push({
                url: fileUrl,
                type: fileType,
                displayName: getCleanFileName(file),
                fileType: fileType,
                icon: getFileIcon(fileUrl)
              });
            }
          }
        });
      } else if (post.files) {
        const fileUrl = getFileUrl(post.files);
        if (fileUrl) {
          const fileType = getFileType(fileUrl);
          media.push({
            url: fileUrl,
            type: fileType,
            displayName: getCleanFileName(post.files),
            fileType: fileType,
            icon: getFileIcon(fileUrl)
          });
        }
      }
    }
    
    // Fichiers structurés
    if (post.post_files && Array.isArray(post.post_files)) {
      post.post_files.forEach((file, index) => {
        const fileUrl = getFileUrl(file);
        if (fileUrl) {
          let fileType = file.file_type || getFileType(fileUrl);
          
          media.push({
            url: fileUrl,
            type: fileType,
            displayName: file.name || getCleanFileName(fileUrl),
            fileType: fileType,
            icon: getFileIcon(fileUrl),
            fileData: file,
            order: 1000 + index
          });
        }
      });
    }
    
    media.sort((a, b) => {
      if (a.type === 'image' && b.type !== 'image') return -1;
      if (a.type !== 'image' && b.type === 'image') return 1;
      return (a.order || 0) - (b.order || 0);
    });
    
    return media;
  };

  const allMedia = getAllMediaFromPost(post);
  
  if (allMedia.length === 0) {
    return null;
  }

  // Composant pour afficher une miniature de fichier
  const renderFileItem = (fileItem, index) => {
    const isImage = fileItem.type === 'image';
    
    return (
      <div 
        key={index} 
        className={`file-thumbnail ${fileItem.type}-thumbnail`}
        onClick={() => onThumbnailClick(post.id, allMedia.map(m => m.url), index)}
      >
        {renderFileThumbnail(fileItem.url, URL)}
        {!isImage && (
          <div className={`file-type-overlay ${fileItem.type}-overlay`}>
            <div className="file-icon-container">
              {getFileTypeIcon(fileItem.type)}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Style Facebook : Logique pour déterminer le layout
  const renderFacebookStyleMedia = () => {
    const mediaCount = allMedia.length;
    const firstMedia = allMedia[0];
    const secondMedia = allMedia[1];
    const remainingCount = mediaCount - 2;

    // Cas 1: Un seul média
    if (mediaCount === 1) {
      const isImage = firstMedia.type === 'image';
      return (
        <div className="facebook-media-container single-media">
          <div 
            className={`media-item full-width ${isImage ? 'image-item' : 'file-item'}`}
            onClick={() => onThumbnailClick(post.id, allMedia.map(m => m.url), 0)}
          >
            <FileRenderer fileUrl={firstMedia.url} URL={URL} />
            {!isImage && (
              <div className="file-type-icon-badge">
                {getFileTypeIcon(firstMedia.type, 24)}
              </div>
            )}
          </div>
        </div>
      );
    }

    // Cas 2: Deux médias - côte à côte
    if (mediaCount === 2) {
      return (
        <div className="facebook-media-container two-media">
          <div className="media-grid two-columns">
            {allMedia.map((media, index) => {
              const isImage = media.type === 'image';
              return (
                <div 
                  key={index}
                  className={`media-item half-width ${isImage ? 'image-item' : 'file-item'}`}
                  onClick={() => onThumbnailClick(post.id, allMedia.map(m => m.url), index)}
                >
                  <FileRenderer fileUrl={media.url} URL={URL} />
                  {!isImage && (
                    <div className="file-type-icon-badge">
                      {getFileTypeIcon(media.type, 20)}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      );
    }

    // Cas 3: Trois médias ou plus - Layout Facebook
    return (
      <div className="facebook-media-container multiple-media">
        <div className="media-grid facebook-grid">
          {/* Premier média (gauche, plein hauteur) */}
          <div 
            className="media-item main-item"
            onClick={() => onThumbnailClick(post.id, allMedia.map(m => m.url), 0)}
          >
            <FileRenderer fileUrl={firstMedia.url} URL={URL} />
            {firstMedia.type !== 'image' && (
              <div className="file-type-icon-badge">
                {getFileTypeIcon(firstMedia.type, 24)}
              </div>
            )}
          </div>
          
          {/* Deuxième média (en haut à droite) */}
          <div 
            className="media-item secondary-item top-right"
            onClick={() => onThumbnailClick(post.id, allMedia.map(m => m.url), 1)}
          >
            <FileRenderer fileUrl={secondMedia.url} URL={URL} />
            {secondMedia.type !== 'image' && (
              <div className="file-type-icon-badge">
                {getFileTypeIcon(secondMedia.type, 20)}
              </div>
            )}
          </div>
          
          {/* Troisième média ou overlay de compteur (en bas à droite) */}
          <div 
            className="media-item secondary-item bottom-right"
            onClick={() => {
              if (mediaCount === 3) {
                onThumbnailClick(post.id, allMedia.map(m => m.url), 2);
              } else {
                onOpenGallery(post.id, allMedia.map(m => m.url));
              }
            }}
          >
            {mediaCount === 3 ? (
              <>
                <FileRenderer fileUrl={allMedia[2].url} URL={URL} />
                {allMedia[2].type !== 'image' && (
                  <div className="file-type-icon-badge">
                    {getFileTypeIcon(allMedia[2].type, 20)}
                  </div>
                )}
              </>
            ) : (
              <div className="more-media-overlay">
                <div className="overlay-content">
                  <span className="count">+{remainingCount}</span>
                  <span className="text">Voir plus</span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Bouton pour ouvrir la galerie (optionnel) */}
        {mediaCount > 3 && (
          <div className="facebook-media-footer">
            <button 
              className="view-all-media-btn"
              onClick={() => onOpenGallery(post.id, allMedia.map(m => m.url))}
            >
              <FaImages />
              <span>Voir les {mediaCount} médias</span>
            </button>
          </div>
        )}
      </div>
    );
  };

  // ON MOBILE: Version simplifiée
  if (isMobile && !post.showAllMedia) {
    const firstMedia = allMedia[0];
    const mediaCount = allMedia.length;
    
    if (mediaCount === 1) {
      return (
        <div className="files-container mobile-single">
          <FileRenderer fileUrl={firstMedia.url} URL={URL} />
          {firstMedia.type !== 'image' && (
            <div className="mobile-file-icon">
              {getFileTypeIcon(firstMedia.type, 24)}
            </div>
          )}
        </div>
      );
    }
    
    return (
      <div className="mobile-media-preview">
        <div className="mobile-media-grid">
          {/* Premier média */}
          <div 
            className="mobile-media-item main-item"
            onClick={() => onThumbnailClick(post.id, allMedia.map(m => m.url), 0)}
          >
            <FileRenderer fileUrl={firstMedia.url} URL={URL} />
            {firstMedia.type !== 'image' && (
              <div className="mobile-file-icon">
                {getFileTypeIcon(firstMedia.type, 20)}
              </div>
            )}
          </div>
          
          {/* Deuxième média ou compteur */}
          <div 
            className="mobile-media-item secondary-item"
            onClick={() => {
              if (mediaCount === 2) {
                onThumbnailClick(post.id, allMedia.map(m => m.url), 1);
              } else {
                onToggleShowAllMedia(post.id);
              }
            }}
          >
            {mediaCount === 2 ? (
              <>
                <FileRenderer fileUrl={allMedia[1].url} URL={URL} />
                {allMedia[1].type !== 'image' && (
                  <div className="mobile-file-icon">
                    {getFileTypeIcon(allMedia[1].type, 20)}
                  </div>
                )}
              </>
            ) : (
              <div className="mobile-more-overlay">
                <span className="mobile-count">+{mediaCount - 1}</span>
              </div>
            )}
          </div>
        </div>
        
        {mediaCount > 2 && (
          <button 
            className="mobile-view-more-btn"
            onClick={() => onToggleShowAllMedia(post.id)}
          >
            <FaImages />
            <span>Voir les {mediaCount - 1} autres</span>
          </button>
        )}
      </div>
    );
  }

  // ON MOBILE (full display): Afficher tous les médias
  if (isMobile && post.showAllMedia) {
    return (
      <div className="mobile-full-media">
        <div className="mobile-media-header">
          <h4>Médias partagés ({allMedia.length})</h4>
          <button 
            className="mobile-collapse-btn"
            onClick={() => onToggleShowAllMedia(post.id)}
          >
            Réduire
          </button>
        </div>
        
        <div className="mobile-media-grid-full">
          {allMedia.map((fileItem, index) => renderFileItem(fileItem, index))}
        </div>
      </div>
    );
  }

  // DESKTOP: Utiliser le style Facebook
  return renderFacebookStyleMedia();
};

export default PostMedia;