// src/components/Block/BlockHistory.jsx
import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TablePagination,
    Chip,
    IconButton,
    Tooltip,
    TextField,
    MenuItem,
    Box,
    Card,
    CardContent,
    Grid,
    Divider,
    CircularProgress,
    Alert,
    Avatar,
    Badge
} from '@mui/material';
import {
    FilterList,
    Refresh,
    Search,
    Block as BlockIcon,
    LockOpen,
    Schedule,
    PersonAddDisabled,
    VisibilityOff,
    MessageOff,
    History
} from '@mui/icons-material';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import blockService from '../../services/blockService';
import './BlockHistory.css';

const BlockHistory = () => {
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [totalItems, setTotalItems] = useState(0);
    const [filters, setFilters] = useState({
        action: '',
        date_from: '',
        date_to: '',
        search: ''
    });
    const [stats, setStats] = useState({
        total_blocks: 0,
        active_blocks: 0,
        blocked_by_others: 0,
        mutual_blocks: 0
    });

    // Options de filtre
    const actionOptions = [
        { value: '', label: 'Toutes les actions' },
        { value: 'block', label: 'Blocages' },
        { value: 'unblock', label: 'Déblocages' },
        { value: 'auto_block', label: 'Blocages automatiques' }
    ];

    // Charger l'historique
    useEffect(() => {
        fetchHistory();
        fetchStats();
    }, [page, rowsPerPage, filters]);

    const fetchHistory = async () => {
        try {
            setLoading(true);
            const response = await blockService.getBlockHistory(page + 1, rowsPerPage);
            setHistory(response.results || response.history || []);
            setTotalItems(response.total || response.count || 0);
        } catch (error) {
            console.error('Erreur:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStats = async () => {
        try {
            const blockedResponse = await blockService.getBlockedUsers();
            const blockedByResponse = await blockService.getWhoBlockedMe();
            
            const blockedCount = blockedResponse.total || 0;
            const blockedByCount = blockedByResponse.total || 0;
            
            setStats({
                total_blocks: blockedResponse.blocked_users?.length || 0,
                active_blocks: blockedResponse.blocked_users?.filter(b => !b.is_expired).length || 0,
                blocked_by_others: blockedByCount,
                mutual_blocks: 0 // À calculer selon votre logique
            });
        } catch (error) {
            console.error('Erreur stats:', error);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
        setPage(0); // Retour à la première page
    };

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleRefresh = () => {
        fetchHistory();
        fetchStats();
    };

    const getActionIcon = (action) => {
        switch (action) {
            case 'block':
                return <BlockIcon color="error" />;
            case 'unblock':
                return <LockOpen color="success" />;
            case 'auto_block':
                return <PersonAddDisabled color="warning" />;
            default:
                return <History />;
        }
    };

    const getActionColor = (action) => {
        switch (action) {
            case 'block':
                return 'error';
            case 'unblock':
                return 'success';
            case 'auto_block':
                return 'warning';
            default:
                return 'default';
        }
    };

    const getActionLabel = (action) => {
        switch (action) {
            case 'block':
                return 'Bloqué';
            case 'unblock':
                return 'Débloqué';
            case 'auto_block':
                return 'Blocage auto';
            default:
                return action;
        }
    };

    const getBlockTypeIcon = (blockType) => {
        switch (blockType) {
            case 'both':
                return <BlockIcon />;
            case 'profile':
                return <VisibilityOff />;
            case 'user':
                return <MessageOff />;
            default:
                return null;
        }
    };

    const getBlockTypeLabel = (blockType) => {
        switch (blockType) {
            case 'both':
                return 'Complet';
            case 'profile':
                return 'Profil';
            case 'user':
                return 'Messages';
            default:
                return blockType;
        }
    };

    const formatDate = (dateString) => {
        if (!dateString) return '-';
        try {
            return format(new Date(dateString), 'PPpp', { locale: fr });
        } catch {
            return dateString;
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            {/* En-tête et statistiques */}
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                <Typography variant="h4" component="h1">
                    <Box display="flex" alignItems="center" gap={1}>
                        <History />
                        Historique des blocages
                    </Box>
                </Typography>
                
                <Tooltip title="Actualiser">
                    <IconButton onClick={handleRefresh} disabled={loading}>
                        <Refresh />
                    </IconButton>
                </Tooltip>
            </Box>

            {/* Cartes de statistiques */}
            <Grid container spacing={3} mb={4}>
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Blocages actifs
                                </Typography>
                                <Badge badgeContent={stats.active_blocks} color="error">
                                    <BlockIcon color="action" />
                                </Badge>
                            </Box>
                            <Typography variant="h5" component="div">
                                {stats.active_blocks}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                sur {stats.total_blocks} total
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Bloqué par
                                </Typography>
                                <LockOpen color="action" />
                            </Box>
                            <Typography variant="h5" component="div">
                                {stats.blocked_by_others}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                utilisateurs
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Blocages mutuels
                                </Typography>
                                <Badge badgeContent={stats.mutual_blocks} color="warning">
                                    <BlockIcon color="action" />
                                </Badge>
                            </Box>
                            <Typography variant="h5" component="div">
                                {stats.mutual_blocks}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                blocages réciproques
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                    <Card>
                        <CardContent>
                            <Box display="flex" alignItems="center" justifyContent="space-between">
                                <Typography color="textSecondary" gutterBottom>
                                    Blocages ce mois
                                </Typography>
                                <Schedule color="action" />
                            </Box>
                            <Typography variant="h5" component="div">
                                {history.filter(h => 
                                    h.action === 'block' && 
                                    new Date(h.created_at).getMonth() === new Date().getMonth()
                                ).length}
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                                ce mois-ci
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            {/* Filtres */}
            <Paper sx={{ p: 2, mb: 3 }}>
                <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <FilterList color="action" />
                    <Typography variant="h6">Filtres</Typography>
                </Box>
                
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            select
                            fullWidth
                            label="Action"
                            name="action"
                            value={filters.action}
                            onChange={handleFilterChange}
                            size="small"
                        >
                            {actionOptions.map(option => (
                                <MenuItem key={option.value} value={option.value}>
                                    {option.label}
                                </MenuItem>
                            ))}
                        </TextField>
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Date de début"
                            name="date_from"
                            type="date"
                            value={filters.date_from}
                            onChange={handleFilterChange}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Date de fin"
                            name="date_to"
                            type="date"
                            value={filters.date_to}
                            onChange={handleFilterChange}
                            size="small"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            fullWidth
                            label="Rechercher"
                            name="search"
                            value={filters.search}
                            onChange={handleFilterChange}
                            size="small"
                            placeholder="Utilisateur, raison..."
                            InputProps={{
                                startAdornment: <Search fontSize="small" sx={{ mr: 1, color: 'action.active' }} />
                            }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            {/* Tableau d'historique */}
            <Paper>
                {loading ? (
                    <Box display="flex" justifyContent="center" p={3}>
                        <CircularProgress />
                    </Box>
                ) : history.length === 0 ? (
                    <Alert severity="info" sx={{ m: 2 }}>
                        Aucun historique de blocage trouvé.
                    </Alert>
                ) : (
                    <>
                        <TableContainer>
                            <Table>
                                <TableHead>
                                    <TableRow>
                                        <TableCell>Action</TableCell>
                                        <TableCell>Utilisateur</TableCell>
                                        <TableCell>Type</TableCell>
                                        <TableCell>Durée</TableCell>
                                        <TableCell>Raison</TableCell>
                                        <TableCell>Date</TableCell>
                                        <TableCell>IP</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {history.map((item) => (
                                        <TableRow key={item.id} hover>
                                            <TableCell>
                                                <Chip
                                                    icon={getActionIcon(item.action)}
                                                    label={getActionLabel(item.action)}
                                                    color={getActionColor(item.action)}
                                                    size="small"
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Box display="flex" alignItems="center" gap={1}>
                                                    <Avatar 
                                                        src={item.target_user?.avatar} 
                                                        sx={{ width: 24, height: 24 }}
                                                    >
                                                        {item.target_user?.username?.charAt(0)}
                                                    </Avatar>
                                                    <Typography variant="body2">
                                                        {item.target_user?.username || `ID: ${item.target_user_id}`}
                                                    </Typography>
                                                </Box>
                                            </TableCell>
                                            <TableCell>
                                                {item.block_type && (
                                                    <Tooltip title={getBlockTypeLabel(item.block_type)}>
                                                        <Chip
                                                            icon={getBlockTypeIcon(item.block_type)}
                                                            label={getBlockTypeLabel(item.block_type)}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </Tooltip>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                {item.duration_days > 0 ? (
                                                    <Chip
                                                        icon={<Schedule />}
                                                        label={`${item.duration_days} jours`}
                                                        size="small"
                                                        color="info"
                                                        variant="outlined"
                                                    />
                                                ) : (
                                                    <Chip
                                                        label="Permanent"
                                                        size="small"
                                                        color="default"
                                                        variant="outlined"
                                                    />
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <Typography 
                                                    variant="body2" 
                                                    sx={{ 
                                                        maxWidth: 200,
                                                        overflow: 'hidden',
                                                        textOverflow: 'ellipsis',
                                                        whiteSpace: 'nowrap'
                                                    }}
                                                >
                                                    {item.reason || '-'}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2">
                                                    {formatDate(item.created_at)}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" color="textSecondary">
                                                    {item.ip_address || '-'}
                                                </Typography>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <TablePagination
                            component="div"
                            count={totalItems}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                            labelRowsPerPage="Lignes par page:"
                        />
                    </>
                )}
            </Paper>

            {/* Légende */}
            <Paper sx={{ p: 2, mt: 3 }}>
                <Typography variant="subtitle2" gutterBottom>
                    Légende
                </Typography>
                <Grid container spacing={2}>
                    <Grid item xs={12} sm={4}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <BlockIcon color="error" fontSize="small" />
                            <Typography variant="body2">Blocage manuel</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <PersonAddDisabled color="warning" fontSize="small" />
                            <Typography variant="body2">Blocage automatique</Typography>
                        </Box>
                    </Grid>
                    <Grid item xs={12} sm={4}>
                        <Box display="flex" alignItems="center" gap={1}>
                            <LockOpen color="success" fontSize="small" />
                            <Typography variant="body2">Déblocage</Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Paper>
        </Container>
    );
};

export default BlockHistory;