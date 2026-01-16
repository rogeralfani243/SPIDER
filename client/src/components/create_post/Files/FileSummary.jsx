import React from 'react';

const FileSummary = ({ files, previews = null }) => {
  const totalFiles = 
    files.images.length + 
    files.videos.length + 
    files.audio.length + 
    files.documents.length;

  if (totalFiles === 0) {
    return null;
  }

  const formatFileSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp': return 'fas fa-image';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv':
      case 'webm': return 'fas fa-video';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'm4a':
      case 'flac': return 'fas fa-music';
      default: return 'fas fa-file';
    }
  };

  return (
    <div className="upload-summary">
      <h5 className="summary-title">
        <i className="fas fa-clipboard-list"></i> Files Summary ({totalFiles} total)
      </h5>
      
      <div className="summary-container">
        {/* Images */}
        {files.images.length > 0 && (
          <div className="summary-section">
            <div className="section-header">
              <i className="fas fa-images text-primary"></i>
              <span className="section-title-create">{files.images.length} Image{files.images.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="media-preview-grid">
              {files.images.slice(0, 4).map((file, index) => {
                const preview = previews?.images?.[index];
                const name = preview?.name || file.name;
                const size = preview?.size || file.size;
                const url = preview?.url;
                
                return (
                  <div key={index} className="media-preview-item">
                    {url ? (
                      <img 
                        src={url} 
                        alt={`Preview ${index + 1}`}
                        className="media-preview-image"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = 'https://via.placeholder.com/100x100?text=Image';
                        }}
                      />
                    ) : (
                      <div className="file-placeholder">
                        <i className="fas fa-image"></i>
                      </div>
                    )}
                    <div className="media-preview-info">
                      <small className="media-name" title={name}>
                        {name.length > 15 ? name.substring(0, 12) + '...' : name}
                      </small>
                      <small className="media-size">{formatFileSize(size)}</small>
                    </div>
                  </div>
                );
              })}
              
              {files.images.length > 4 && (
                <div className="media-preview-more">
                  <div className="more-count">+{files.images.length - 4}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Videos - Balise video simple */}
        {files.videos.length > 0 && (
          <div className="summary-section">
            <div className="section-header">
              <i className="fas fa-video text-danger"></i>
              <span className="section-title-create">{files.videos.length} Video{files.videos.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="media-preview-list">
              {files.videos.slice(0, 2).map((file, index) => {
                const preview = previews?.videos?.[index];
                const name = preview?.name || file.name;
                const size = preview?.size || file.size;
                const url = preview?.url;
                const extension = preview?.extension || file.name.split('.').pop().toLowerCase();
                
                return (
                  <div key={index} className="video-item">
                    <div className="video-container">
                      {url && (
                        <video 
                          controls
                          className="video-preview"
                        >
                          <source src={url} type={`video/${extension}`} />
                          Your browser does not support the video tag.
                        </video>
                      )}
                      {!url && (
                        <div className="file-placeholder video">
                          <i className="fas fa-video"></i>
                        </div>
                      )}
                    </div>
                    <div className="video-info">
                      <small className="media-name" title={name}>
                        {name.length > 25 ? name.substring(0, 22) + '...' : name}
                      </small>
                      <small className="media-size">{formatFileSize(size)}</small>
                      <small className="media-extension">.{extension}</small>
                    </div>
                  </div>
                );
              })}
              
              {files.videos.length > 2 && (
                <div className="more-files">
                  <small>+ {files.videos.length - 2} more</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Audio - Balise audio simple */}
        {files.audio.length > 0 && (
          <div className="summary-section">
            <div className="section-header">
              <i className="fas fa-music text-success"></i>
              <span className="section-title-create">{files.audio.length} Audio File{files.audio.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="media-preview-list">
              {files.audio.slice(0, 2).map((file, index) => {
                const preview = previews?.audio?.[index];
                const name = preview?.name || file.name;
                const size = preview?.size || file.size;
                const url = preview?.url;
                const extension = preview?.extension || file.name.split('.').pop().toLowerCase();
                
                return (
                  <div key={index} className="audio-item">
                    <div className="audio-container">
                      {url && (
                        <audio 
                          controls
                          className="audiopreview"
                        >
                          <source src={url} type={`audio/${extension}`} />
                          Your browser does not support the audio element.
                        </audio>
                      )}
                      {!url && (
                        <div className="file-placeholder audio">
                          <i className="fas fa-music"></i>
                        </div>
                      )}
                    </div>
                    <div className="audio-info">
                      <small className="media-name" title={name}>
                        {name.length > 25 ? name.substring(0, 22) + '...' : name}
                      </small>
                      <small className="media-size">{formatFileSize(size)}</small>
                      <small className="media-extension">.{extension}</small>
                    </div>
                  </div>
                );
              })}
              
              {files.audio.length > 2 && (
                <div className="more-files">
                  <small>+ {files.audio.length - 2} more</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Documents */}
        {files.documents.length > 0 && (
          <div className="summary-section">
            <div className="section-header">
              <i className="fas fa-file text-info"></i>
              <span className="section-title-create">{files.documents.length} Document{files.documents.length !== 1 ? 's' : ''}</span>
            </div>
            
            <div className="documents-list">
              {files.documents.slice(0, 3).map((file, index) => {
                const preview = previews?.documents?.[index];
                const name = preview?.name || file.name;
                const size = preview?.size || file.size;
                const extension = preview?.extension || file.name.split('.').pop().toLowerCase();
                
                return (
                  <div key={index} className="document-item">
                    <i className={getFileIcon(extension)}></i>
                    <div className="document-info">
                      <small className="media-name" title={name}>
                        {name.length > 25 ? name.substring(0, 22) + '...' : name}
                      </small>
                      <div className="document-meta">
                        <small className="media-extension">.{extension.toUpperCase()}</small>
                        <small className="media-size">{formatFileSize(size)}</small>
                      </div>
                    </div>
                  </div>
                );
              })}
              
              {files.documents.length > 3 && (
                <div className="more-files">
                  <small>+ {files.documents.length - 3} more</small>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quick Summary */}
        <div className="quick-summary">
          <div className="summary-stats">
            {files.images.length > 0 && (
              <span className="stat-item">
                <i className="fas fa-images"></i> {files.images.length} image{files.images.length !== 1 ? 's' : ''}
              </span>
            )}
            {files.videos.length > 0 && (
              <span className="stat-item">
                <i className="fas fa-video"></i> {files.videos.length} video{files.videos.length !== 1 ? 's' : ''}
              </span>
            )}
            {files.audio.length > 0 && (
              <span className="stat-item">
                <i className="fas fa-music"></i> {files.audio.length} audio{files.audio.length !== 1 ? 's' : ''}
              </span>
            )}
            {files.documents.length > 0 && (
              <span className="stat-item">
                <i className="fas fa-file"></i> {files.documents.length} document{files.documents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FileSummary;