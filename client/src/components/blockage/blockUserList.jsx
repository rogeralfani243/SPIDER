// src/components/Block/BlockedUsersList.jsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    ListItemSecondaryAction,
    Avatar,
    IconButton,
    Button,
    Chip,
    Box,
    TextField,
    InputAdornment,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Card,
    CardContent,
    Grid,
    CircularProgress,
    Alert,
    Divider,
    MenuItem
} from '@mui/material';
import {
    Search,
    Block as BlockIcon,
    LockOpen,
    PersonOff,
    Schedule,
    Message,
    VisibilityOff,
    FilterList,
    Refresh
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import blockService from '../../services/blockService';
import './BlockedUsersList.css';

const BlockedUsersList = () => {
    const [blockedUsers, setBlockedUsers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [selectedUser, setSelectedUser] = useState(null);
    const [unblockDialog, setUnblockDialog] = useState(false);

    // Charger la liste
    useEffect(() => {
        fetchBlockedUsers();
    }, []);

    const fetchBlockedUsers = async () => {
        try {
            setLoading(true);
            const response = await blockService.getBlockedUsers();
            setBlockedUsers(response.blocked_users || []);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUnblockClick = (user) => {
        setSelectedUser(user);
        setUnblockDialog(true);
    };

    const handleUnblockConfirm = async () => {
        if (!selectedUser) return;

        try {
            const response = await blockService.unblockUser(selectedUser.id);
            if (response.success) {
                // Mettre à jour la liste
                setBlockedUsers(prev => 
                    prev.filter(user => user.id !== selectedUser.id)
                );
                setUnblockDialog(false);
                setSelectedUser(null);
            }
        } catch (error) {
            console.error('Erreur:', error);
        }
    };

    const handleUnblockCancel = () => {
        setUnblockDialog(false);
        setSelectedUser(null);
    };

    const getBlockTypeIcon = (type) => {
        switch (type) {
            case 'both':
                return <BlockIcon />;
            case 'profile':
                return <VisibilityOff />;
            case 'user':
                return <Message />;
            default:
                return <PersonOff />;
        }
    };

    const getBlockTypeLabel = (type) => {
        switch (type) {
            case 'both':
                return 'Complet';
            case 'profile':
                return 'Profil seulement';
            case 'user':
                return 'Messages seulement';
            default:
                return type;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'PP', { locale: fr });
        } catch {
            return dateString;
        }
    };

    const getTimeRemaining = (expiresAt) => {
        if (!expiresAt) return null;
        
        const now = new Date();
        const expiry = new Date(expiresAt);
        const diffTime = expiry - now;
        
        if (diffTime <= 0) return 'Expiré';
        
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays > 0) return `${diffDays} jours restants`;
        
        const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
        return `${diffHours} heures restantes`;
    };

    // Filtrer les utilisateurs
    const filteredUsers = blockedUsers.filter(user => {
        // Filtre par recherche
        if (searchTerm && !user.username.toLowerCase().includes(searchTerm.toLowerCase())) {
            return false;
        }
        
        // Filtre par type
        if (filterType !== 'all' && user.block_type !== filterType) {
            return false;
        }
        
        // Filtre par statut (expiré/actif)
        if (filterType === 'expired' && !user.is_expired) return false;
        if (filterType === 'active' && user.is_expired) return false;
        
        return true;
    });

    // Statistiques
    const stats = {
        total: blockedUsers.length,
        active: blockedUsers.filter(u => !u.is_expired).length,
        expired: blockedUsers.filter(u => u.is_expired).length,
        permanent: blockedUsers.filter(u => !u.expires_at).length,
        temporary: blockedUsers.filter(u => u.expires_at).length
    };

    return (
        <Container maxWidth="md" sx={{ mt: 4, mb: 4 }}>
            {/* En-tête */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    <Box display="flex" alignItems="center" gap={1}>
                        <PersonOff />
                        Utilisateurs bloqués
                    </Box>
                </Typography>
                
                <Button
                    startIcon={<Refresh />}
                    onClick={fetchBlockedUsers}
                    disabled={loading}
                >
                    Actualiser
                </Button>
            </Box>

            {/* Statistiques */}
            <Grid container spacing={2} mb={3}>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="primary">
                                {stats.total}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Total
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="success">
                                {stats.active}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Actifs
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="warning">
                                {stats.expired}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Expirés
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                <Grid item xs={6} sm={3}>
                    <Card>
                        <CardContent sx={{ textAlign: 'center' }}>
                            <Typography variant="h6" color="info">
                                {stats.permanent}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                Permanents
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtres */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Grid container spacing={2} alignItems="center">
                    <Grid item xs={12} sm={6}>
                        <TextField
                            fullWidth
                            placeholder="Rechercher un utilisateur..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search />
                                    </InputAdornment>
                                )
                            }}
                        />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                        <TextField
                            select
                            fullWidth
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value)}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <FilterList />
                                    </InputAdornment>
                                )
                            }}
                        >
                            <MenuItem value="all">Tous les blocages</MenuItem>
                            <MenuItem value="active">Actifs seulement</MenuItem>
                            <MenuItem value="expired">Expirés seulement</MenuItem>
                            <MenuItem value="both">Blocages complets</MenuItem>
                            <MenuItem value="profile">Profil seulement</MenuItem>
                            <MenuItem value="user">Messages seulement</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>
            </Paper>

            {/* Liste */}
            <Paper>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : filteredUsers.length === 0 ? (
                    <Alert severity="info" sx={{ m: 2 }}>
                        {blockedUsers.length === 0 
                            ? "Vous n'avez bloqué aucun utilisateur." 
                            : "Aucun utilisateur ne correspond aux filtres."
                        }
                    </Alert>
                ) : (
                    <List>
                        {filteredUsers.map((user) => (
                            <React.Fragment key={user.id}>
                                <ListItem>
                                    <ListItemAvatar>
                                        <Avatar src={user.avatar}>
                                            {user.username?.charAt(0)}
                                        </Avatar>
                                    </ListItemAvatar>
                                    <ListItemText
                                        primary={
                                            <Box display="flex" alignItems="center" gap={1}>
                                                <Typography variant="subtitle1">
                                                    {user.username}
                                                </Typography>
                                                <Chip
                                                    icon={getBlockTypeIcon(user.block_type)}
                                                    label={getBlockTypeLabel(user.block_type)}
                                                    size="small"
                                                    color="default"
                                                    variant="outlined"
                                                />
                                                {user.is_expired && (
                                                    <Chip
                                                        label="Expiré"
                                                        size="small"
                                                        color="warning"
                                                    />
                                                )}
                                            </Box>
                                        }
                                        secondary={
                                            <Box>
                                                <Typography variant="body2" color="textSecondary">
                                                    Bloqué le: {formatDate(user.created_at)}
                                                </Typography>
                                                {user.reason && (
                                                    <Typography variant="body2">
                                                        Raison: {user.reason}
                                                    </Typography>
                                                )}
                                                {user.expires_at && !user.is_expired && (
                                                    <Box display="flex" alignItems="center" gap={0.5} mt={0.5}>
                                                        <Schedule fontSize="small" color="action" />
                                                        <Typography variant="body2" color="textSecondary">
                                                            Expire le: {formatDate(user.expires_at)}
                                                            {getTimeRemaining(user.expires_at) && 
                                                                ` (${getTimeRemaining(user.expires_at)})`
                                                            }
                                                        </Typography>
                                                    </Box>
                                                )}
                                            </Box>
                                        }
                                    />
                                    <ListItemSecondaryAction>
                                        <Button
                                            variant="outlined"
                                            color="primary"
                                            startIcon={<LockOpen />}
                                            onClick={() => handleUnblockClick(user)}
                                            size="small"
                                        >
                                            Débloquer
                                        </Button>
                                    </ListItemSecondaryAction>
                                </ListItem>
                                <Divider />
                            </React.Fragment>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Dialogue de confirmation de déblocage */}
            <Dialog open={unblockDialog} onClose={handleUnblockCancel}>
                <DialogTitle>
                    Confirmer le déblocage
                </DialogTitle>
                <DialogContent>
                    {selectedUser && (
                        <Box display="flex" alignItems="center" gap={2} mb={2}>
                            <Avatar src={selectedUser.avatar} sx={{ width: 50, height: 50 }}>
                                {selectedUser.username?.charAt(0)}
                            </Avatar>
                            <Typography variant="h6">
                                {selectedUser.username}
                            </Typography>
                        </Box>
                    )}
                    <Typography>
                        Êtes-vous sûr de vouloir débloquer cet utilisateur ? 
                        Il pourra à nouveau vous contacter et voir votre profil.
                    </Typography>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleUnblockCancel}>
                        Annuler
                    </Button>
                    <Button 
                        onClick={handleUnblockConfirm} 
                        color="primary" 
                        variant="contained"
                        startIcon={<LockOpen />}
                    >
                        Confirmer
                    </Button>
                </DialogActions>
            </Dialog>
        </Container>
    );
};

export default BlockedUsersList;