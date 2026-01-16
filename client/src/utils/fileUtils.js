import React from 'react';
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive
} from 'react-icons/fa';

// utils/fileUtils.js
export const getSafeUrl = (item) => {
  if (!item) return null;
  
  // If it's already a string, return it
  if (typeof item === 'string') return item;
  
  // If it's an object, try to extract URL
  if (typeof item === 'object') {
    // Check all possible URL properties
    const urlProps = ['url', 'file_url', 'file', 'image', 'image_url', 'src', 'link'];
    for (const prop of urlProps) {
      if (item[prop] && typeof item[prop] === 'string') {
        return item[prop];
      }
    }
    
    // If it's a File/Blob object
    if (item instanceof File || item instanceof Blob) {
      return URL.createObjectURL(item);
    }
    
    // Last resort: try to convert to string
    try {
      return String(item);
    } catch (e) {
      return null;
    }
  }
  
  return null;
};

export const getSafeFileName = (item) => {
  if (!item) return 'File';
  
  // If it's an object, try to get name
  if (typeof item === 'object') {
    const nameProps = ['name', 'filename', 'displayName', 'title'];
    for (const prop of nameProps) {
      if (item[prop] && typeof item[prop] === 'string') {
        return item[prop];
      }
    }
  }
  
  // Extract from URL
  const url = getSafeUrl(item);
  if (!url || typeof url !== 'string') return 'File';
  
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const cleanName = filename.split('?')[0]; // Remove query parameters
    return decodeURIComponent(cleanName);
  } catch (e) {
    console.warn('Error extracting filename from URL:', e);
    return 'File';
  }
};

export const getFileExtension = (item) => {
  const url = getSafeUrl(item);
  if (!url || typeof url !== 'string') return null;
  
  try {
    const parts = url.split('/');
    const filename = parts[parts.length - 1];
    const cleanName = filename.split('?')[0];
    const extensionParts = cleanName.split('.');
    
    if (extensionParts.length > 1) {
      return extensionParts.pop().toLowerCase();
    }
    return null;
  } catch (e) {
    console.warn('Error getting file extension:', e);
    return null;
  }
};

export const isPdfFile = (item) => {
  if (!item) return false;
  
  // Check if explicitly marked as PDF
  if (typeof item === 'object') {
    const fileType = item.file_type || item.type;
    if (fileType && typeof fileType === 'string') {
      return fileType.toLowerCase() === 'pdf';
    }
  }
  
  // Check by extension
  const extension = getFileExtension(item);
  return extension === 'pdf';
};

export const getFileType = (item) => {
  if (!item) return 'file';
  
  // Check explicit type
  if (typeof item === 'object') {
    const fileType = item.file_type || item.type;
    if (fileType && typeof fileType === 'string') {
      return fileType.toLowerCase();
    }
  }
  
  // Determine by extension
  const extension = getFileExtension(item);
  if (!extension) return 'file';
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(extension)) {
    return 'image';
  }
  if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'flv', 'wmv'].includes(extension)) {
    return 'video';
  }
  if (['mp3', 'wav', 'ogg', 'm4a', 'flac', 'aac'].includes(extension)) {
    return 'audio';
  }
  if (extension === 'pdf') return 'pdf';
  if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) return 'document';
  
  return 'file';
};


export const getFileIcon = (fileInput) => {
  const fileUrl = getSafeUrl(fileInput);
  const extension = getFileExtension(fileUrl);
  
  if (!extension) return <FaFileAlt color="#6c757d" />;
  
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension))
    return <FaFileImage color="#ff9800" />;
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension))
    return <FaFileVideo color="#03a9f4" />;
  if (['mp3', 'wav', 'ogg'].includes(extension))
    return <FaFileAudio color="#8bc34a" />;
  if (['pdf'].includes(extension)) return <FaFilePdf color="#e53935" />;
  if (['doc', 'docx'].includes(extension))
    return <FaFileWord color="#2196f3" />;
  if (['xls', 'xlsx'].includes(extension))
    return <FaFileExcel color="#4caf50" />;
  if (['zip', 'rar', '7z'].includes(extension))
    return <FaFileArchive color="#ffb300" />;
  return <FaFileAlt color="#6c757d" />;
};

// Optionnel : exportez aussi une fonction pour obtenir juste la couleur
export const getFileIconColor = (fileInput) => {
  const fileUrl = getSafeUrl(fileInput);
  const extension = getFileExtension(fileUrl);
  
  if (!extension) return "#6c757d";
  if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension)) return "#ff9800";
  if (['mp4', 'mov', 'avi', 'mkv'].includes(extension)) return "#03a9f4";
  if (['mp3', 'wav', 'ogg'].includes(extension)) return "#8bc34a";
  if (['pdf'].includes(extension)) return "#e53935";
  if (['doc', 'docx'].includes(extension)) return "#2196f3";
  if (['xls', 'xlsx'].includes(extension)) return "#4caf50";
  if (['zip', 'rar', '7z'].includes(extension)) return "#ffb300";
  return "#6c757d";
};

export const getFileColor = (fileType) => {
  switch (fileType) {
    case 'image': return 'primary';
    case 'video': return 'secondary';
    case 'audio': return 'info';
    default: return 'default';
  }
};
