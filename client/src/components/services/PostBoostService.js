import axios from 'axios';
import URL from '../../hooks/useUrl';

class PostBoostService {
  /**
   * Vérifie si un post est boosté
   * @param {number} postId - ID du post
   * @returns {Promise<Object>} - Résultat de la vérification
   */
  static async checkPostBoost(postId) {
    try {
      const response = await axios.get(`${URL}/post/api/posts/${postId}/check-boost/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error checking post boost:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to check boost status'
      };
    }
  }

  /**
   * Boost un post
   * @param {number} postId - ID du post
   * @param {Object} boostData - Données du boost
   * @returns {Promise<Object>} - Résultat du boost
   */
  static async boostPost(postId, boostData) {
    try {
      const response = await axios.post(`${URL}/posts/boost/${postId}/`, boostData, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        }
      });
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error boosting post:', error);
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to boost post'
      };
    }
  }

  /**
   * Récupère les packages de boost disponibles
   * @returns {Promise<Object>} - Liste des packages
   */
  static async getBoostPackages() {
    try {
      const response = await axios.get(`${URL}/boost-packages/`);
      return {
        success: true,
        data: response.data
      };
    } catch (error) {
      console.error('Error fetching boost packages:', error);
      return {
        success: false,
        error: 'Failed to fetch boost packages'
      };
    }
  }
}

export default PostBoostService;