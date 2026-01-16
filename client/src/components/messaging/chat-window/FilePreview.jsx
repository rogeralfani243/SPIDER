// components/FilePreview.js
import React from 'react';
import {
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  Image as ImageIcon,
  Videocam as VideoIcon,
  Audiotrack as AudioIcon,
  PictureAsPdf as PdfIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import { getFileType , getFileIcon, getFileColor } from '../../../utils/fileUtils';
const FilePreview = ({ selectedFiles, removeFile }) => {
  const renderFilePreviews = () => {
    return selectedFiles.map((file, index) => {
      const fileType = getFileType(file.name, file.type);
      const FileIconComponent = {
        'image': ImageIcon,
        'video': VideoIcon,
        'audio': AudioIcon,
        'pdf': PdfIcon,
        'file': FileIcon,
      }[fileType] || FileIcon;
      
      return (
        <Chip
          key={index}
          icon={<FileIconComponent />}
          label={`${file.name.substring(0, 20)}${file.name.length > 20 ? '...' : ''}`}
          onDelete={() => removeFile(index)}
          sx={{ m: 0.5 }}
          color={getFileColor(fileType)}
        />
      );
    });
  };

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'grey.50' }}>
      <Typography variant="caption" color="text.secondary" display="block" mb={1}>
        Files to send ({selectedFiles.length})
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
        {renderFilePreviews()}
      </Box>
    </Box>
  );
};

export default FilePreview;