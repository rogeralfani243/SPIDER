// src/components/Block/BlockButton.jsx
import React, { useState, useEffect } from 'react';
import { 
    MenuItem,
    ListItemIcon,
    ListItemText,
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions,
    Alert,
    Snackbar,
    CircularProgress,
    Box,
    Chip,
    TextField,
    Typography,
    Button
} from '@mui/material';
import { 
    Block as BlockIcon, 
  
    Lock, 
    LockOpen,
    Schedule,
    
} from '@mui/icons-material';
import blockService from '../../hooks/messaging/blockService';

const BlockButton = ({ targetUser, onBlockChange, showAsMenuItem = false, size = 'medium', variant = 'outlined' }) => {
    const [blockStatus, setBlockStatus] = useState(null);
    const [loading, setLoading] = useState(false);
    const [openDialog, setOpenDialog] = useState(false);
    const [blockData, setBlockData] = useState({
        block_type: 'both',
        reason: '',
        duration_days: 0
    });
    const [snackbar, setSnackbar] = useState({
        open: false,
        message: '',
        severity: 'success'
    });

    // Predefined durations
    const durations = [
        { value: 0, label: 'Permanent', description: 'Permanent block' },
        { value: 1, label: '24 hours', description: '1 day' },
        { value: 7, label: '1 week', description: '7 days' },
        { value: 30, label: '1 month', description: '30 days' },
        { value: 90, label: '3 months', description: '90 days' },
        { value: 365, label: '1 year', description: '365 days' }
    ];

    // Block types
    const blockTypes = [
        { value: 'both', label: 'Complete block', description: 'Prevents all contact and profile viewing' },
        { value: 'user', label: 'Message block', description: 'Prevents only messages' },
        { value: 'profile', label: 'Profile block', description: 'Prevents only profile viewing' }
    ];

    // Load initial status
    useEffect(() => {
        if (targetUser?.id) {
            fetchBlockStatus();
        }
    }, [targetUser]);

    const fetchBlockStatus = async () => {
        try {
            setLoading(true);
            const response = await blockService.getBlockStatus(targetUser.id);
            setBlockStatus(response.status);
        } catch (error) {
            console.error('Error:', error);
            setSnackbar({
                open: true,
                message: 'Error checking block status',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleOpenDialog = () => {
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setBlockData({
            block_type: 'both',
            reason: '',
            duration_days: 0
        });
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setBlockData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleBlock = async () => {
        try {
            setLoading(true);
            const response = await blockService.blockUser(targetUser.id, blockData);
            
            if (response.success) {
                setSnackbar({
                    open: true,
                    message: response.message,
                    severity: 'success'
                });
                await fetchBlockStatus();
                if (onBlockChange) {
                    onBlockChange(true);
                }
            } else {
                setSnackbar({
                    open: true,
                    message: response.error,
                    severity: 'error'
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Error blocking user',
                severity: 'error'
            });
        } finally {
            setLoading(false);
            handleCloseDialog();
        }
    };

    const handleUnblock = async () => {
        if (!window.confirm(`Are you sure you want to unblock ${targetUser.username}?`)) {
            return;
        }

        try {
            setLoading(true);
            const response = await blockService.unblockUser(targetUser.id);
            
            if (response.success) {
                setSnackbar({
                    open: true,
                    message: response.message,
                    severity: 'success'
                });
                await fetchBlockStatus();
                if (onBlockChange) {
                    onBlockChange(false);
                }
            } else {
                setSnackbar({
                    open: true,
                    message: response.error,
                    severity: 'error'
                });
            }
        } catch (error) {
            setSnackbar({
                open: true,
                message: 'Error unblocking user',
                severity: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSnackbarClose = () => {
        setSnackbar(prev => ({ ...prev, open: false }));
    };

    if (!targetUser) {
        return null;
    }

    // VERSION MENU ITEM - Pour ChatHeader
    if (showAsMenuItem) {
        // Si l'utilisateur m'a bloqué
        if (blockStatus?.user2_blocks_user1) {
            return (
                <MenuItem disabled>
                    <ListItemIcon>
                        <Lock fontSize="small" />
                    </ListItemIcon>
                    <ListItemText primary={`${targetUser.username} has blocked you`} />
                </MenuItem>
            );
        }

        // Si j'ai bloqué l'utilisateur
        if (blockStatus?.user1_blocks_user2) {
            return (
                <MenuItem onClick={handleUnblock} disabled={loading}>
                    <ListItemIcon>
                        {loading ? (
                            <CircularProgress size={20} />
                        ) : (
                            <LockOpen fontSize="small" />
                        )}
                    </ListItemIcon>
                    <ListItemText primary="Unblock User" />
                </MenuItem>
            );
        }

        // Si pas de blocage
        return (
            <>
                <MenuItem onClick={handleOpenDialog}>
                    <ListItemIcon>
                        <BlockIcon fontSize="small" color="error" />
                    </ListItemIcon>
                    <ListItemText primary="Block User" />
                </MenuItem>

                {/* Dialogue de blocage */}
                <Dialog 
                    open={openDialog} 
                    onClose={handleCloseDialog}
                    maxWidth="sm"
                    fullWidth
                >
                    <DialogTitle>
                        <Box display="flex" alignItems="center" gap={1}>
                            <BlockIcon color="error" />
                            <Typography variant="h6">
                                Block {targetUser.username}
                            </Typography>
                        </Box>
                    </DialogTitle>
                    
                    <DialogContent>
                        <Alert severity="warning" sx={{ mb: 2 }}>
                            Blocking this user will prevent all communication and/or access to your profile based on the chosen type.
                        </Alert>

                        <TextField
                            select
                            fullWidth
                            label="Block Type"
                            name="block_type"
                            value={blockData.block_type}
                            onChange={handleInputChange}
                            margin="normal"
                            helperText={blockTypes.find(t => t.value === blockData.block_type)?.description}
                        >
                            {blockTypes.map((type) => (
                                <MenuItem key={type.value} value={type.value}>
                                    {type.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            select
                            fullWidth
                            label="Block Duration"
                            name="duration_days"
                            value={blockData.duration_days}
                            onChange={handleInputChange}
                            margin="normal"
                            helperText={durations.find(d => d.value === blockData.duration_days)?.description}
                        >
                            {durations.map((duration) => (
                                <MenuItem key={duration.value} value={duration.value}>
                                    {duration.label}
                                </MenuItem>
                            ))}
                        </TextField>

                        <TextField
                            fullWidth
                            label="Reason (optional)"
                            name="reason"
                            value={blockData.reason}
                            onChange={handleInputChange}
                            margin="normal"
                            multiline
                            rows={3}
                            placeholder="Why do you want to block this user?"
                        />
                    </DialogContent>

                    <DialogActions>
                        <Button onClick={handleCloseDialog} disabled={loading}>
                            Cancel
                        </Button>
                        <Button 
                            onClick={handleBlock} 
                            color="error" 
                            variant="contained"
                            disabled={loading}
                            startIcon={loading ? <CircularProgress size={20} /> : <BlockIcon />}
                        >
                            Confirm Block
                        </Button>
                    </DialogActions>
                </Dialog>
            </>
        );
    }

    // VERSION ORIGINALE - Pour usage normal (bouton)
    // Si l'utilisateur m'a bloqué
    if (blockStatus?.user2_blocks_user1) {
        return (
            <Button
                variant="contained"
                color="error"
                startIcon={<Lock />}
                size={size}
                disabled
                sx={{ opacity: 0.7 }}
            >
                {targetUser.username} has blocked you
            </Button>
        );
    }

    // Si j'ai bloqué l'utilisateur
    if (blockStatus?.user1_blocks_user2) {
        const blockInfo = blockStatus.block_info || {};
        const isExpired = blockInfo.is_expired;
        
        return (
            <Box display="flex" alignItems="center" gap={1}>
                <Button
                    variant="contained"
                    color="warning"
                    startIcon={<LockOpen />}
                    onClick={handleUnblock}
                    disabled={loading}
                    size={size}
                >
                    {loading ? <CircularProgress size={20} /> : 'Unblock'}
                </Button>
                
                {!isExpired && blockInfo.expires_at && (
                    <Chip
                        icon={<Schedule />}
                        label={`Expires: ${new Date(blockInfo.expires_at).toLocaleDateString()}`}
                        size="small"
                        color="warning"
                        variant="outlined"
                    />
                )}
                
                {isExpired && (
                    <Chip
                        label="Expired"
                        size="small"
                        color="default"
                        variant="outlined"
                    />
                )}
            </Box>
        );
    }

    // Si pas de blocage - version bouton normale
    return (
        <>
            <Button
                variant={variant}
                color="error"
                startIcon={<BlockIcon />}
                onClick={handleOpenDialog}
                disabled={loading}
                size={size}
            >
            
            </Button>

            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog}
                maxWidth="sm"
                fullWidth
            >
                <DialogTitle>
                    <Box display="flex" alignItems="center" gap={1}>
                        <BlockIcon color="error" />
                        <Typography variant="h6">
                            Block {targetUser.first_name}
                        </Typography>
                    </Box>
                </DialogTitle>
                
                <DialogContent>
                    <Alert severity="warning" sx={{ mb: 2 }}>
                        Blocking this user will prevent all communication and/or access to your profile based on the chosen type.
                    </Alert>

        

                    <TextField
                        select
                        fullWidth
                        label="Block Duration"
                        name="duration_days"
                        value={blockData.duration_days}
                        onChange={handleInputChange}
                        margin="normal"
                        helperText={durations.find(d => d.value === blockData.duration_days)?.description}
                    >
                        {durations.map((duration) => (
                            <MenuItem key={duration.value} value={duration.value}>
                                {duration.label}
                            </MenuItem>
                        ))}
                    </TextField>

                    <TextField
                        fullWidth
                        label="Reason (optional)"
                        name="reason"
                        value={blockData.reason}
                        onChange={handleInputChange}
                        margin="normal"
                        multiline
                        rows={3}
                        placeholder="Why do you want to block this user?"
                    />
                </DialogContent>

                <DialogActions>
                    <Button onClick={handleCloseDialog} disabled={loading}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleBlock} 
                        color="error" 
                        variant="contained"
                        disabled={loading}
                        startIcon={loading ? <CircularProgress size={20} /> : <BlockIcon />}
                    >
                        Confirm Block
                    </Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={handleSnackbarClose}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
                    {snackbar.message}
                </Alert>
            </Snackbar>
        </>
    );
};

export default BlockButton;