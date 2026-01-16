import React, { useState, useEffect } from 'react';
import { Download, X, Image as ImageIcon, Video, Music, FileText, File, Folder as FolderZip, Loader, ExternalLink, Play, Headphones, FileIcon } from 'lucide-react';
import '../../../../styles/main_post/download-modal.css';

const DownloadMediaModal = ({ 
  isOpen, 
  onClose, 
  post,
  URL,
  onDownloadSelected 
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalSize: '0 KB',
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0
  });
  const [downloadingItems, setDownloadingItems] = useState({});
  const [downloadAllProgress, setDownloadAllProgress] = useState(0);

  // Charger la liste des médias depuis l'API ou extraire directement
  useEffect(() => {
    if (isOpen && post) {
      fetchMediaList();
    }
  }, [isOpen, post]);

  const fetchMediaList = async () => {
    if (!post) return;
    
    setIsLoading(true);
    try {
      // Essayer l'API d'abord
      if (post.id && URL) {
        const response = await fetch(`${URL}/post/posts/${post.id}/media-list/`);
        if (response.ok) {
          const data = await response.json();
          setMediaList(data.media || []);
          setStats({
            total: data.total_media || 0,
            totalSize: data.total_size || '0 KB',
            images: data.statistics?.images || 0,
            videos: data.statistics?.videos || 0,
            audio: data.statistics?.audio || 0,
            documents: data.statistics?.documents || 0
          });
          
          setIsLoading(false);
          return;
        }
      }
    } catch (error) {
      console.log('API call failed, extracting media from post directly');
    }
    
    // Fallback: extraire directement du post
    extractMediaFromPost();
    setIsLoading(false);
  };

  const extractMediaFromPost = () => {
    const extractedMedia = [];
    
    console.log('Extracting media from post:', post);
    
    // 1. Image principale
    if (post.image || post.image_url) {
      const imageUrl = post.image || post.image_url;
      extractedMedia.push({
        id: 'main-image',
        type: 'image',
        name: getDownloadName('main-image', imageUrl, 'main-image.jpg'),
        url: imageUrl,
        directUrl: getDirectUrl(imageUrl),
        size: '300 KB',
        extension: getFileExtension(getFilenameFromUrl(imageUrl)) || 'jpg',
        order: 0,
        thumbnail: getDirectUrl(imageUrl) // URL pour la thumbnail
      });
    }
    
    // 2. Images du post
    if (post.post_images && Array.isArray(post.post_images)) {
      post.post_images.forEach((img, index) => {
        if (img.image || img.image_url) {
          const imageUrl = img.image || img.image_url;
          extractedMedia.push({
            id: `image-${index}`,
            type: 'image',
            name: getDownloadName(`image-${index}`, imageUrl, `image-${index+1}.jpg`),
            url: imageUrl,
            directUrl: getDirectUrl(imageUrl),
            size: '500 KB',
            extension: getFileExtension(getFilenameFromUrl(imageUrl)) || 'jpg',
            order: 1 + index,
            thumbnail: getDirectUrl(imageUrl)
          });
        }
      });
    }
    
    // 3. Fichiers du post
    if (post.post_files && Array.isArray(post.post_files)) {
      post.post_files.forEach((file, index) => {
        const fileUrl = file.file || file.file_url;
        if (fileUrl) {
          const filename = getFilenameFromUrl(fileUrl) || `file-${index}`;
          const extension = getFileExtension(filename);
          const type = file.file_type || getTypeFromExtension(extension);
          
          extractedMedia.push({
            id: `file-${index}`,
            type: type,
            name: getDownloadName(`file-${index}`, fileUrl, file.name || filename),
            url: fileUrl,
            directUrl: getDirectUrl(fileUrl),
            size: '1 MB',
            extension: extension || 'file',
            order: 100 + index,
            file_type_display: file.file_type_display,
            thumbnail: type === 'image' ? getDirectUrl(fileUrl) : null
          });
        }
      });
    }
    
    // Calculer les statistiques
    const stats = {
      total: extractedMedia.length,
      totalSize: calculateTotalSize(extractedMedia),
      images: extractedMedia.filter(m => m.type === 'image').length,
      videos: extractedMedia.filter(m => m.type === 'video').length,
      audio: extractedMedia.filter(m => m.type === 'audio').length,
      documents: extractedMedia.filter(m => m.type === 'document').length
    };
    
    setMediaList(extractedMedia);
    setStats(stats);
  };

  // Fonctions utilitaires
  const getFilenameFromUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.split('/').pop().split('?')[0];
  };

  const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const getTypeFromExtension = (extension) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    if (docExts.includes(extension)) return 'document';
    return 'other';
  };

  const getDirectUrl = (url) => {
    if (!url) return '';
    
    // Si déjà URL complète
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    // Ajouter l'URL de base
    if (URL) {
      const base = URL.endsWith('/') ? URL.slice(0, -1) : URL;
      const path = url.startsWith('/') ? url : `/${url}`;
      return `${base}${path}`;
    }
    
    return url;
  };

  const getDownloadName = (id, url, defaultName) => {
    const filename = getFilenameFromUrl(url);
    if (filename && filename.includes('.')) {
      return filename;
    }
    return defaultName || id;
  };

  // Fonction pour afficher la miniature du média
  const renderMediaPreview = (media) => {
    const directUrl = media.directUrl || media.url;
    
    switch(media.type) {
      case 'image':
        return (
          <div className="media-preview image-preview">
            <img 
              src={directUrl} 
              alt={media.name}
              className="preview-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<ImageIcon size={24} />';
              }}
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="media-preview video-preview">
            <div className="video-overlay">
              <Play size={20} />
            </div>
            <div className="video-label">VIDEO</div>
          </div>
        );
        
      case 'audio':
        return (
          <div className="media-preview audio-preview">
            <Headphones size={24} />
            <div className="audio-label">AUDIO</div>
          </div>
        );
        
      case 'document':
        return (
          <div className="media-preview document-preview">
            <FileIcon size={24} />
            <div className="document-extension">.{media.extension || 'doc'}</div>
          </div>
        );
        
      default:
        return (
          <div className="media-preview other-preview">
            <File size={24} />
            <div className="other-label">FILE</div>
          </div>
        );
    }
  };

  const getTypeDisplay = (type, fileTypeDisplay) => {
    if (fileTypeDisplay) return fileTypeDisplay.toUpperCase();
    
    switch(type) {
      case 'image': return 'IMAGE';
      case 'video': return 'VIDEO';
      case 'audio': return 'AUDIO';
      case 'document': return 'DOCUMENT';
      default: return 'FILE';
    }
  };

  // TÉLÉCHARGEMENT INDIVIDUEL pour un média
  const handleSingleDownload = async (media) => {
    if (downloadingItems[media.id]) return; // Éviter les doubles clics
    
    setDownloadingItems(prev => ({ ...prev, [media.id]: true }));
    
    try {
      console.log(`Downloading single file: ${media.name}`);
      
      const success = await downloadSingleFile(media);
      
      if (success) {
        console.log(`✅ Successfully downloaded: ${media.name}`);
        // Feedback visuel
        setTimeout(() => {
          setDownloadingItems(prev => ({ ...prev, [media.id]: false }));
        }, 1500);
      } else {
        console.log(`⚠️ Could not download automatically: ${media.name}`);
        // Ouvrir dans un nouvel onglet
        openInNewTab(media);
        setDownloadingItems(prev => ({ ...prev, [media.id]: false }));
      }
      
    } catch (error) {
      console.error(`Error downloading ${media.name}:`, error);
      setDownloadingItems(prev => ({ ...prev, [media.id]: false }));
    }
  };

  // TÉLÉCHARGEMENT DE TOUS LES FICHIERS
  const handleDownloadAll = async () => {
    if (mediaList.length === 0) return;
    
    const confirmed = window.confirm(
      `Download all ${mediaList.length} files?\n\n` +
      `Files will be downloaded one by one.`
    );
    
    if (!confirmed) return;
    
    setIsDownloading(true);
    setDownloadAllProgress(0);
    
    try {
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < mediaList.length; i++) {
        const media = mediaList[i];
        
        // Mettre à jour la progression
        setDownloadAllProgress(Math.round((i / mediaList.length) * 100));
        
        try {
          const success = await downloadSingleFile(media);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
          
          // Pause entre les téléchargements
          if (i < mediaList.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 800));
          }
          
        } catch (error) {
          console.error(`Failed to download ${media.name}:`, error);
          failCount++;
        }
      }
      
      // Mettre à jour la progression finale
      setDownloadAllProgress(100);
      
      // Afficher les résultats
      setTimeout(() => {
        let message = '';
        if (successCount > 0) {
          message += `✅ ${successCount} file(s) downloaded successfully\n`;
        }
        if (failCount > 0) {
          message += `📂 ${failCount} file(s) opened in tabs\n`;
          message += 'To save them: Right click → "Save as..."';
        }
        
        if (message) {
          alert(message);
        }
        
        setIsDownloading(false);
        setDownloadAllProgress(0);
        
      }, 500);
      
    } catch (error) {
      console.error('Error in batch download:', error);
      setIsDownloading(false);
      setDownloadAllProgress(0);
    }
  };

  // Fonction principale de téléchargement d'un seul fichier
  const downloadSingleFile = async (media) => {
    return new Promise((resolve) => {
      try {
        const url = getDirectUrl(media.url);
        if (!url) {
          resolve(false);
          return;
        }
        
        // Essayer la méthode fetch + blob d'abord
        fetch(url, { mode: 'cors' })
          .then(response => {
            if (!response.ok) {
              // Fallback: méthode standard
              standardDownload(url, media.name);
              resolve(true);
              return;
            }
            
            return response.blob().then(blob => {
              if (blob.size === 0) {
                standardDownload(url, media.name);
                resolve(true);
                return;
              }
              
              const blobUrl = window.URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.href = blobUrl;
              link.download = media.name;
              link.style.display = 'none';
              document.body.appendChild(link);
              link.click();
              
              // Libérer la mémoire
              setTimeout(() => {
                window.URL.revokeObjectURL(blobUrl);
                document.body.removeChild(link);
              }, 100);
              
              resolve(true);
            });
          })
          .catch(() => {
            // Fallback si fetch échoue
            standardDownload(url, media.name);
            resolve(true);
          });
          
      } catch (error) {
        console.error('Download error:', error);
        resolve(false);
      }
    });
  };

  // Méthode de téléchargement standard
  const standardDownload = (url, filename) => {
    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.style.display = 'none';
      link.style.position = 'absolute';
      link.style.left = '-9999px';
      
      document.body.appendChild(link);
      link.click();
      
      setTimeout(() => {
        document.body.removeChild(link);
      }, 100);
      
    } catch (error) {
      console.error('Standard download failed:', error);
    }
  };

  // Ouvrir dans un nouvel onglet
  const openInNewTab = (media) => {
    const url = getDirectUrl(media.url);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  // Ouvrir un fichier en prévisualisation
  const handlePreview = (media, e) => {
    if (e) e.stopPropagation();
    const url = getDirectUrl(media.url);
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="download-modal-overlay">
      <div className="download-modal-download">
        {/* Header */}
        <div className="modal-header-download">
          <div className="header-content-download">
            <Download size={20} />
            <div>
              <h3 >Download Files</h3>
              <p className="subtitle">{post?.title || 'This post'}</p>
            </div>
          </div>
          <button className="close-btn" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        
        {/* Statistics */}
        <div className="media-stats">
          <div className="stat-item">
            <span className="stat-label">Total:</span>
            <span className="stat-value">{stats.total} file{stats.total > 1 ? 's' : ''}</span>
          </div>
          <div className="stat-item">
            <span className="stat-label">Total Size:</span>
            <span className="stat-value">{stats.totalSize}</span>
          </div>
          <div className="stat-types">
            {stats.images > 0 && (
              <span className="type-badge image">
                <ImageIcon size={12} /> {stats.images} image{stats.images > 1 ? 's' : ''}
              </span>
            )}
            {stats.videos > 0 && (
              <span className="type-badge video">
                <Video size={12} /> {stats.videos} video{stats.videos > 1 ? 's' : ''}
              </span>
            )}
            {stats.audio > 0 && (
              <span className="type-badge audio">
                <Music size={12} /> {stats.audio} audio
              </span>
            )}
            {stats.documents > 0 && (
              <span className="type-badge document">
                <FileText size={12} /> {stats.documents} document{stats.documents > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
        
        {/* Download All Button */}
        {mediaList.length > 0 && !isLoading && (
          <div className="download-all-section">
            <button 
              className="download-all-btn"
              onClick={handleDownloadAll}
              disabled={isDownloading}
            >
              {isDownloading ? (
                <>
                  <span className="spinner"></span>
                  Downloading... {downloadAllProgress}%
                </>
              ) : (
                <>
                  <Download size={16} />
                  Download All Files ({stats.total})
                </>
              )}
            </button>
            
            {isDownloading && (
              <div className="progress-container">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${downloadAllProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>
        )}
        
        {/* Content */}
        <div className="modal-content2">
          {isLoading ? (
            <div className="loading-container">
              <Loader size={32} className="spinner" />
              <p>Loading file list...</p>
            </div>
          ) : (
            <>
              <div className="download-info">
                <p className="info-text">
                  Click the <Download size={16} /> button to download a file individually
                </p>
              </div>
              
              {/* Media list with preview thumbnails */}
              <div className="media-list">
                {mediaList.map((item) => (
                  <div 
                    key={item.id} 
                    className="media-item"
                  >
                    <div className="media-preview-container">
                      {renderMediaPreview(item)}
                    </div>
                    <div className="media-info">
                      <div className="media-name">{item.name}</div>
                      <div className="media-details">
                        <span className={`media-type type-${item.type}`}>
                          {getTypeDisplay(item.type, item.file_type_display)}
                        </span>
                        <span className="media-size">{item.size}</span>
                        {item.extension && item.extension !== 'file' && (
                          <span className="media-extension">.{item.extension}</span>
                        )}
                      </div>
                    </div>
                    <div className="media-actions">
{/*\
                      <button 
                        className="preview-btn"
                        onClick={(e) => handlePreview(item, e)}
                        title="Open in new tab"
                        disabled={downloadingItems[item.id]}
                      >
                        <ExternalLink size={14} />
                      </button>
*/}
                      <button 
                        className={`single-download-btn ${downloadingItems[item.id] ? 'downloading' : ''}`}
                        onClick={() => handleSingleDownload(item)}
                        disabled={downloadingItems[item.id]}
                        title="Download this file"
                      >
                        {downloadingItems[item.id] ? (
                          <span className="btn-spinner"></span>
                        ) : (
                          <Download size={14} />
                        )}
                      </button>
                    </div>
                  </div>
                ))}
                
                {mediaList.length === 0 && !isLoading && (
                  <div className="no-media">
                    <File size={32} />
                    <p>No files found in this post</p>
                  </div>
                )}
              </div>
              
           
            </>
          )}
        </div>
        
        {/* Actions */}
        <div className="modal-actions">
          <button className="cancel-btn" onClick={onClose} disabled={isDownloading}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

const calculateTotalSize = (items) => {
  if (!items || items.length === 0) return '0 KB';
  
  const sizeMap = {
    'KB': 1024,
    'MB': 1024 * 1024,
    'GB': 1024 * 1024 * 1024
  };
  
  let totalBytes = 0;
  
  items.forEach(item => {
    if (item.size) {
      const sizeStr = String(item.size);
      const match = sizeStr.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
      
      if (match) {
        const value = parseFloat(match[1]);
        const unit = match[2].toUpperCase();
        const multiplier = sizeMap[unit] || 1;
        totalBytes += value * multiplier;
      }
    }
  });
  
  if (totalBytes < 1024) {
    return `${totalBytes.toFixed(0)} B`;
  } else if (totalBytes < 1024 * 1024) {
    return `${(totalBytes / 1024).toFixed(1)} KB`;
  } else if (totalBytes < 1024 * 1024 * 1024) {
    return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
  } else {
    return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  }
};

export default DownloadMediaModal;