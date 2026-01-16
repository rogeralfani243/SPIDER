// Custom hook for media file management
export const useMedia = (post) => {
  
  // Helper: Safely get URL from different formats
  const getSafeUrl = (item) => {
    if (!item) return null;
    
    // If it's already a string URL
    if (typeof item === 'string') return item;
    
    // If it's an object, check multiple possible URL properties
    if (typeof item === 'object') {
      // Check PostImage model (image field)
      if (item.image) return item.image;
      
      // Check PostFile model (file field)
      if (item.file) return item.file;
      
      // Check general URL properties
      if (item.file_url) return item.file_url;
      if (item.url) return item.url;
      
      // Check backend serialized fields
      if (item.image_url) return item.image_url;
      if (item.fileUrl) return item.fileUrl;
      
      // Check if it's a File object (from input)
      if (item instanceof File) {
        return URL.createObjectURL(item);
      }
    }
    
    return null;
  };

  // Helper: Safely get file name
  const getSafeFileName = (item) => {
    if (!item) return 'File';
    
    // If it's an object with name property
    if (typeof item === 'object') {
      if (item.name && typeof item.name === 'string') return item.name;
      if (item.filename) return item.filename;
      if (item.displayName) return item.displayName;
    }
    
    // Extract from URL as fallback
    const url = getSafeUrl(item);
    if (!url || typeof url !== 'string') return 'File';
    
    try {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      
      // Remove query parameters
      const cleanName = fileName.split('?')[0];
      
      // Decode URL-encoded characters
      try {
        return decodeURIComponent(cleanName);
      } catch (e) {
        return cleanName;
      }
    } catch (error) {
      console.error('Error extracting filename:', error);
      return 'File';
    }
  };

  // Determine file type from URL or file object
  const getFileType = (item) => {
    if (!item) return 'file';
    
    // If item has a file_type property (from backend)
    if (typeof item === 'object') {
      if (item.file_type && typeof item.file_type === 'string') {
        const type = item.file_type.toLowerCase();
        if (['image', 'video', 'audio', 'document', 'pdf', 'file'].includes(type)) {
          return type;
        }
      }
      
      // Check type property
      if (item.type && typeof item.type === 'string') {
        const type = item.type.toLowerCase();
        if (['image', 'video', 'audio', 'document', 'pdf', 'file'].includes(type)) {
          return type;
        }
      }
    }
    
    // Determine from URL
    const url = getSafeUrl(item);
    if (!url || typeof url !== 'string') return 'file';
    
    const urlLower = url.toLowerCase();
    
    try {
      // Check images first
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp', '.svg'];
      const isImage = imageExtensions.some(ext => urlLower.includes(ext));
      if (isImage) return 'image';
      
      // Check videos
      const videoExtensions = ['.mp4', '.webm', '.ogg', '.mov', '.avi', '.mkv', '.flv', '.wmv'];
      const isVideo = videoExtensions.some(ext => urlLower.includes(ext));
      if (isVideo) return 'video';
      
      // Check audio
      const audioExtensions = ['.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma'];
      const isAudio = audioExtensions.some(ext => urlLower.includes(ext));
      if (isAudio) return 'audio';
      
      // Check PDF
      if (urlLower.endsWith('.pdf') || urlLower.includes('.pdf?')) {
        return 'pdf';
      }
      
      // Check documents
      const docExtensions = ['.doc', '.docx', '.txt', '.rtf', '.odt'];
      const isDocument = docExtensions.some(ext => urlLower.includes(ext));
      if (isDocument) return 'document';
      
      return 'file';
    } catch (e) {
      console.error('Error determining file type:', e);
      return 'file';
    }
  };

  // Get all media files from post data
  const getAllMedia = () => {
    if (!post) return [];
    
    const media = [];
    

    
    // 2. Add post_images (ONLY IMAGES from PostImage model)
    if (post.post_images && Array.isArray(post.post_images) && post.post_images.length > 0) {
      post.post_images.forEach((img, index) => {
        const url = getSafeUrl(img);
        if (url) {
          media.push({
            type: 'image', // PostImage is only for images
            url: url,
            id: img.id || `post-image-${index}`,
            order: img.order || index + 1, // +1 to come after main image
            uploadedAt: img.uploaded_at,
            name: getSafeFileName(img),
            isPostImage: true
          });
        }
      });
    }
    
    // 3. Add files from post.files (for list view - objects)
    if (post.files) {
      let filesArray = [];
      
      // Handle different formats
      if (Array.isArray(post.files)) {
        filesArray = post.files;
      } else if (typeof post.files === 'object' && !Array.isArray(post.files)) {
        filesArray = [post.files];
      }
      
      filesArray.forEach((file, index) => {
        const url = getSafeUrl(file);
        if (url) {
          const fileType = getFileType(file);
          const currentOrder = media.length;
          
          media.push({
            type: fileType,
            url: url,
            id: file.id || `file-${index}`,
            order: file.order || currentOrder,
            name: getSafeFileName(file),
            isFile: true,
            fileType: fileType,
            fileData: file // Keep original data
          });
        }
      });
    }
    
    // 4. Add files from post.post_files (for detail view)
    if (post.post_files && Array.isArray(post.post_files) && post.post_files.length > 0) {
      post.post_files.forEach((file, index) => {
        const url = getSafeUrl(file);
        if (url) {
          // Check if this file is already in the list (by URL)
          const exists = media.some(m => m.url === url);
          if (!exists) {
            const fileType = getFileType(file);
            const currentOrder = media.length;
            
            media.push({
              type: fileType,
              url: url,
              id: file.id || `post-file-${index}`,
              order: file.order || currentOrder,
              name: getSafeFileName(file),
              isPostFile: true,
              fileType: fileType,
              fileData: file
            });
          }
        }
      });
    }
    
    // Sort by order
    return media.sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  // Get specific types
  const getImages = () => {
    return getAllMedia().filter(item => item.type === 'image');
  };

  const getVideos = () => {
    return getAllMedia().filter(item => item.type === 'video');
  };

  const getPDFs = () => {
    return getAllMedia().filter(item => item.type === 'pdf');
  };

  const getAudioFiles = () => {
    return getAllMedia().filter(item => item.type === 'audio');
  };

  const getDocuments = () => {
    return getAllMedia().filter(item => item.type === 'document');
  };

  // Get first media item
  const getFirstMedia = () => {
    const media = getAllMedia();
    return media.length > 0 ? media[0] : null;
  };

  // Check if multiple media
  const hasMultipleMedia = () => {
    const media = getAllMedia();
    return media.length > 1;
  };

  // Get media count
  const getMediaCount = () => {
    return getAllMedia().length;
  };

  // Get count by type
  const getMediaCountByType = (type) => {
    return getAllMedia().filter(item => item.type === type).length;
  };

  // Get media info for debugging
  const debugMediaInfo = () => {
    console.log('Post data:', post);
    console.log('All media:', getAllMedia());
    console.log('Post files:', post.files);
    console.log('Post post_files:', post.post_files);
    console.log('Post post_images:', post.post_images);
  };

  return { 
    getAllMedia, 
    getImages,
    getVideos,
    getPDFs,
    getAudioFiles,
    getFirstMedia,
    hasMultipleMedia,
    getMediaCount,
    getMediaCountByType,
    getSafeUrl,
    getSafeFileName,
    getFileType,
    debugMediaInfo
  };
};