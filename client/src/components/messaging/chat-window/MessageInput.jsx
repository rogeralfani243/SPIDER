import React, { useState, useEffect } from 'react';
import {
  Box,
  TextField,
  IconButton,
  Tooltip,
  CircularProgress,
  Menu,
  MenuItem,
  useMediaQuery,
  Fade,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  Image as ImageIcon,
  Mic as MicIcon,
  Stop as StopIcon,
  Videocam as VideoIcon,
  Audiotrack as AudioIcon,
  Add as AddIcon,
} from '@mui/icons-material';

const MessageInput = ({
  newMessage,
  setNewMessage,
  selectedFiles,
  audioBlob,
  uploading,
  isRecording,
  handleSendMessage,
  handleKeyPress,
  handleFileSelect,
  startRecording,
  stopRecording,
  imageInputRef,
  fileInputRef,
  audioInputRef,
  videoInputRef,
}) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const isMobile = useMediaQuery('(max-width:736px)');
  const [showAttachments, setShowAttachments] = useState(false);

  const handleMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
    setShowAttachments(true);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setShowAttachments(false);
  };

  const handleFileButtonClick = (type) => {
    handleMenuClose();
    switch (type) {
      case 'image':
        imageInputRef.current?.click();
        break;
      case 'video':
        videoInputRef.current?.click();
        break;
      case 'audio':
        audioInputRef.current?.click();
        break;
      case 'file':
        fileInputRef.current?.click();
        break;
      default:
        break;
    }
  };

  const menuItems = [
    { type: 'image', icon: <ImageIcon />, label: 'Image' },
    { type: 'video', icon: <VideoIcon />, label: 'Video' },
    { type: 'audio', icon: <AudioIcon />, label: 'Audio file' },
    { type: 'file', icon: <AttachFileIcon />, label: 'Other file' },
  ];

  // Close menu when not on mobile
  useEffect(() => {
    if (!isMobile && showAttachments) {
      setShowAttachments(false);
      setAnchorEl(null);
    }
  }, [isMobile, showAttachments]);

  return (
    <Box sx={{ p: 2, borderTop: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
      <Box display="flex" alignItems="center" gap={1} sx={{ '@media (max-width:746px)': { height: '10px' } }}>
        {/* Hidden file inputs */}
        <input
          type="file"
          accept="image/*"
          ref={imageInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e, 'image')}
          multiple
        />
        <input
          type="file"
          ref={fileInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e, 'any')}
          multiple
        />
        <input
          type="file"
          accept="audio/*"
          ref={audioInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e, 'audio')}
        />
        <input
          type="file"
          accept="video/*"
          ref={videoInputRef}
          style={{ display: 'none' }}
          onChange={(e) => handleFileSelect(e, 'video')}
        />
        
        {/* Desktop view: show all buttons */}
        {!isMobile && (
          <>
            <Tooltip title="Send image">
              <IconButton onClick={() => imageInputRef.current?.click()} disabled={uploading || isRecording}>
                <ImageIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Send video">
              <IconButton onClick={() => videoInputRef.current?.click()} disabled={uploading || isRecording}>
                <VideoIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Send audio file">
              <IconButton onClick={() => audioInputRef.current?.click()} disabled={uploading || isRecording}>
                <AudioIcon />
              </IconButton>
            </Tooltip>
            
            <Tooltip title="Send other file">
              <IconButton onClick={() => fileInputRef.current?.click()} disabled={uploading || isRecording}>
                <AttachFileIcon />
              </IconButton>
            </Tooltip>
          </>
        )}
        
        {/* Mobile view: single + button */}
        {isMobile && (
          <>
            <Tooltip title="Attach file">
              <IconButton 
                onClick={handleMenuOpen}
                disabled={uploading || isRecording}
                sx={{ 
                  bgcolor: showAttachments ? 'action.selected' : 'transparent',
                  '&:hover': { bgcolor: 'action.hover' }
                }}
              >
                <AddIcon />
              </IconButton>
            </Tooltip>
            
            {/* Menu for file attachments */}
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
              TransitionComponent={Fade}
              anchorOrigin={{
                vertical: 'top',
                horizontal: 'left',
              }}
              transformOrigin={{
                vertical: 'bottom',
                horizontal: 'left',
              }}
              sx={{
                '& .MuiPaper-root': {
                  borderRadius: 2,
                  boxShadow: '0px 4px 20px rgba(0,0,0,0.15)',
                  minWidth: 180,
                },
                '& .MuiMenuItem-root': {
                  gap: 1.5,
                  py: 1.5,
                }
              }}
            >
              {menuItems.map((item) => (
                <MenuItem
                  key={item.type}
                  onClick={() => handleFileButtonClick(item.type)}
                  disabled={uploading || isRecording}
                >
                  {item.icon}
                  {item.label}
                </MenuItem>
              ))}
            </Menu>
          </>
        )}
        
        {/* Audio recording button (always visible) */}
        <Tooltip title={isRecording ? "Stop recording" : "Record audio"}>
          <IconButton 
            onClick={isRecording ? stopRecording : startRecording}
            disabled={uploading}
            sx={{ color: isRecording ? 'error.main' : 'inherit' }}
          >
            {isRecording ? <StopIcon /> : <MicIcon />}
          </IconButton>
        </Tooltip>

        {/* Text field */}
        <TextField
          fullWidth
          multiline
        
          maxRows={4}
          placeholder="Write 😊..."
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          variant="outlined"
          size="small"
          disabled={uploading || isRecording}
          sx={{'@media(max-width:756px)':{
            height:'30px',
               
            marginBottom:'10px'
          }}}
        />

        {/* Send button */}
        <IconButton
          color="primary"
          onClick={handleSendMessage}
          disabled={uploading || isRecording || (!newMessage.trim() && selectedFiles.length === 0 && !audioBlob)}
        >
          {uploading ? <CircularProgress size={24} /> : <SendIcon />}
        </IconButton>
      </Box>
    </Box>
  );
};

export default MessageInput;