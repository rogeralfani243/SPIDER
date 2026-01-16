import { 
  MdPictureAsPdf, MdVideoLibrary, MdAudioFile, 
  MdImage, MdFilePresent
} from 'react-icons/md';
import { FaFileWord } from 'react-icons/fa';

// Media type detection
export const getMediaType = (media) => {
  if (!media) return 'image';
  if (media.type) return media.type;
  
  const url = media.url || media;
  if (!url || typeof url !== 'string') return 'image';
  
  const urlLower = url.toLowerCase();
  
  if (urlLower.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/)) return 'image';
  if (urlLower.match(/\.(mp4|webm|ogg|mov|avi|mkv|flv|wmv)$/)) return 'video';
  if (urlLower.match(/\.(mp3|wav|ogg|m4a|flac|aac|wma)$/)) return 'audio';
  if (urlLower.endsWith('.pdf')) return 'pdf';
  if (urlLower.match(/\.(doc|docx|txt|rtf|odt)$/)) return 'document';
  return 'file';
};

// Get file name
export const getFileName = (media) => {
  if (!media) return 'File';
  if (media.name) return media.name;
  
  const url = media.url || media;
  if (typeof url !== 'string') return 'File';
  
  const parts = url.split('/');
  return parts[parts.length - 1].split('?')[0] || 'File';
};

// Get file icon
export const getFileIcon = (media) => {
  const mediaType = getMediaType(media);
  
  switch(mediaType) {
    case 'image': return <MdImage />;
    case 'video': return <MdVideoLibrary />;
    case 'audio': return <MdAudioFile />;
    case 'pdf': return <MdPictureAsPdf />;
    case 'document': return <FaFileWord />;
    default: return <MdFilePresent />;
  }
};

// Format time helper
export const formatTime = (seconds) => {
  if (!seconds || isNaN(seconds)) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
};