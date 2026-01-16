// components/ContextMenu.js
import React from 'react';
import {
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Edit as EditIcon,
  DeleteOutline as DeleteOutlineIcon,
  DeleteForever as DeleteForeverIcon,
  Report as ReportIcon,
  Block as BlockIcon,
} from '@mui/icons-material';
import ReportButton from '../../reports/ReportButton';
import BlockButton from '../../blockage/blockButton';

const ContextMenu = ({
  contextMenu,
  currentUser,
  handleCloseContextMenu,
  startEditMessage,
  openDeleteDialog,
  handleReportMessage,
  handleBlockUser,
  onReportSuccess,
  conversation
}) => {
  // Vérifie si c'est un message de l'utilisateur courant
  const isOwnMessage = contextMenu.message?.sender?.id === currentUser?.id;
  
  // Vérifie si l'utilisateur peut signaler (pas son propre message)
  const canReport = contextMenu.message && !isOwnMessage;
  
  // Récupère l'utilisateur cible pour le blocage
  const targetUser = contextMenu.message?.sender;

  // Vérifie si on peut bloquer (pas son propre message et utilisateur existe)
  const canBlock = !isOwnMessage && targetUser;

  // Gestionnaire pour le nouveau système de signalement
  const handleNewReportSuccess = (reportType = null) => {
    handleCloseContextMenu();
    if (onReportSuccess) {
      onReportSuccess(contextMenu.message, reportType);
    }
    console.log(`Message ${contextMenu.message?.id} reported. Type: ${reportType}`);
  };

  // Gestionnaire pour le changement de statut de blocage
  const handleBlockChange = (isBlocked) => {
    handleCloseContextMenu();
    console.log(`Utilisateur ${targetUser?.username || targetUser?.id} ${isBlocked ? 'bloqué' : 'débloqué'}`);
    
    // Optionnel: Vous pouvez aussi appeler handleBlockUser ici si besoin
    // handleBlockUser();
  };

  return (
    <Menu
      open={contextMenu.mouseY !== null}
      onClose={handleCloseContextMenu}
      anchorReference="anchorPosition"
      anchorPosition={
        contextMenu.mouseY !== null && contextMenu.mouseX !== null
          ? { top: contextMenu.mouseY, left: contextMenu.mouseX }
          : undefined
      }
      PaperProps={{
        style: {
          maxHeight: 48 * 6.5,
          width: '250px',
        },
      }}
    >
      {/* Edit option (only for own messages) */}
      {isOwnMessage && (
        <MenuItem 
          onClick={() => {
            startEditMessage();
            handleCloseContextMenu();
          }}
          dense
        >
          <ListItemIcon>
            <EditIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>Edit</ListItemText>
        </MenuItem>
      )}
      
      {/* Delete for me (available for ALL messages) */}
      <MenuItem 
        onClick={() => {
          openDeleteDialog(false);
          handleCloseContextMenu();
        }}
        dense
      >
        <ListItemIcon>
          <DeleteOutlineIcon fontSize="small" />
        </ListItemIcon>
        <ListItemText>Delete for me</ListItemText>
      </MenuItem>
      
      {/* Delete for everyone (only for own messages) */}
      {isOwnMessage && (
        <MenuItem 
          onClick={() => {
            openDeleteDialog(true);
            handleCloseContextMenu();
          }}
          dense
        >
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete for everyone</ListItemText>
        </MenuItem>
      )}
      
            {conversation?.created_by?.id === currentUser?.id  && !isOwnMessage &&(
        <MenuItem 
          onClick={() => {
            openDeleteDialog(true);
            handleCloseContextMenu();
          }}
          dense
        >
          <ListItemIcon>
            <DeleteForeverIcon fontSize="small" color="error" />
          </ListItemIcon>
          <ListItemText sx={{ color: 'error.main' }}>Delete for everyone</ListItemText>
        </MenuItem>
      )}

      
      {/* Report button */}
      {canReport && (
        <MenuItem 
          dense
          sx={{ 
            padding: 0,
            '&:hover': { backgroundColor: 'transparent' }
          }}
        >
          <ReportButton
            contentType="message"
            contentId={contextMenu.message?.id}
            contentAuthorId={contextMenu.message?.sender?.id}
            contentObject={contextMenu.message}
            buttonVariant="text"
            showIcon={true}
            showText={true}
            onReported={handleNewReportSuccess}
            sx={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: '6px 16px',
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'text.primary',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
            startIcon={<ReportIcon fontSize="small" />}
          >
            <ListItemIcon>
              <ReportIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Report message</ListItemText>
          </ReportButton>
        </MenuItem>
      )}
      
      {/* Block user button */}
      {canBlock && (
        <MenuItem 
          dense
          sx={{ 
            padding: 0,
            '&:hover': { backgroundColor: 'transparent' }
          }}
        >
          <BlockButton 
            targetUser={targetUser} // Passez l'utilisateur cible
            onBlockChange={handleBlockChange}
            sx={{
              width: '100%',
              justifyContent: 'flex-start',
              padding: '6px 16px',
              textTransform: 'none',
              fontSize: '0.875rem',
              color: 'error.main',
              '&:hover': {
                backgroundColor: 'action.hover',
              }
            }}
            startIcon={<BlockIcon fontSize="small" color="error" />}
            showIcon={true}
            showText={true}
          >
            <ListItemIcon>
              <BlockIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText sx={{ color: 'error.main' }}>Block user</ListItemText>
          </BlockButton>
        </MenuItem>
      )}
    </Menu>
  );
};

export default ContextMenu;