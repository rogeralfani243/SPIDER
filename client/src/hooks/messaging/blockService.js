// src/services/blockService.js
import api from './axiosConfig';

class BlockService {
    constructor() {
        // Configuration optionnelle si nécessaire
    }

    // Vérifier le statut de blocage
    async getBlockStatus(userId) {
        try {
            const response = await api.get(`/msg/block/status/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la vérification du statut:', error);
            throw error;
        }
    }

    // Bloquer un utilisateur
    async blockUser(userId, data) {
        try {
            const formData = new FormData();
            formData.append('block_type', data.block_type || 'both');
            formData.append('reason', data.reason || '');
            formData.append('duration_days', data.duration_days || 0);
            
            const response = await api.post(
                `/msg/block/user/${userId}/`,
                formData,
                {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                    }
                }
            );
            return response.data;
        } catch (error) {
            console.error('Erreur lors du blocage:', error);
            throw error;
        }
    }

    // Débloquer un utilisateur
    async unblockUser(userId) {
        try {
            const response = await api.post(`/msg/block/unblock/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors du déblocage:', error);
            throw error;
        }
    }

    // Liste des utilisateurs bloqués
    async getBlockedUsers() {
        try {
            const response = await api.get('/msg/block/list/');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des utilisateurs bloqués:', error);
            throw error;
        }
    }

    // Liste des utilisateurs qui m'ont bloqué
    async getWhoBlockedMe() {
        try {
            const response = await api.get('/msg/block/who-blocked-me/');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération:', error);
            throw error;
        }
    }

    // Historique des blocages
    async getBlockHistory(page = 1, limit = 20) {
        try {
            const response = await api.get('/msg/block/history/', {
                params: { page, limit }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération de l\'historique:', error);
            throw error;
        }
    }

    // Paramètres de blocage
    async getBlockSettings() {
        try {
            const response = await api.get('/msg/block/settings/');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des paramètres:', error);
            throw error;
        }
    }

    // Mettre à jour les paramètres
    async updateBlockSettings(settings) {
        try {
            const formData = new FormData();
            
            // Ajouter tous les paramètres
            Object.keys(settings).forEach(key => {
                if (settings[key] !== null && settings[key] !== undefined) {
                    formData.append(key, settings[key]);
                }
            });
            
            const response = await api.post('/msg/block/settings/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                }
            });
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la mise à jour des paramètres:', error);
            throw error;
        }
    }

    // Méthodes supplémentaires
    async searchBlockedUsers(query) {
        try {
            const response = await api.get(`/msg/block/search/?q=${encodeURIComponent(query)}`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la recherche:', error);
            throw error;
        }
    }

    async getBlockStats() {
        try {
            const response = await api.get('/msg/block/stats/');
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la récupération des stats:', error);
            throw error;
        }
    }

    // Vérifier si je peux envoyer un message
    async canSendMessage(userId) {
        try {
            const response = await api.get(`/msg/block/can-send-message/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la vérification:', error);
            throw error;
        }
    }

    // Vérifier si je peux voir le profil
    async canViewProfile(userId) {
        try {
            const response = await api.get(`/msg/block/can-view-profile/${userId}/`);
            return response.data;
        } catch (error) {
            console.error('Erreur lors de la vérification:', error);
            throw error;
        }
    }
}

export default new BlockService();