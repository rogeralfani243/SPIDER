// src/services/categoryService.js
import api from './api';

export const categoryService = {
  // Utilise TES endpoints Django
  getAllCategories: () => api.get('post/categories/'),
  
  // Utilise ton endpoint Django : GET /api/categories/{category_name}/
  getCategoryByName: (categoryName) => 
    api.get(`post/categories/${categoryName}/`),
  
  // Utilise ton endpoint Django : GET /api/posts/?category={categoryId}
  getCategoryPosts: (categoryId, params = {}) =>
    api.get('/posts/', { params: { category: categoryId, ...params } }),
  
  // Utilise ton endpoint Django : GET /api/categories/?parent={categoryId}
  getSubcategories: (categoryId) =>
    api.get('/categories/', { params: { parent: categoryId } }),
  
  // Tu as un endpoint pour les posts populaires ?
  getPopularPostsByCategory: (categoryId) =>
    api.get('/posts/popular/', { params: { category: categoryId } }),
    
  // Nouveau : Récupérer la catégorie "Software" spécifiquement
  getSoftwareCategory: async () => {
    try {
      // Cherche d'abord par nom "software"
      const allCategories = await api.get('post/categories/');
      const softwareCategory = allCategories.data.find(
        cat => cat.name.toLowerCase() === 'software'
      );
      
      if (softwareCategory) {
        // Récupère les détails complets
        return api.get(`post/categories/${softwareCategory.id}/`);
      }
      
      // Si pas trouvé, crée-la
      return api.post('/categories/', {
        name: 'Software',
        description: 'Discussions about software development',
        is_active: true
      });
    } catch (error) {
      console.error('Error getting software category:', error);
      throw error;
    }
  }
};