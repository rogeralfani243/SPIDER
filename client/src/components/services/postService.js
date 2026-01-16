import api from './api';

// Configuration des URLs
const API_PREFIX = '/post'; // IMPORTANT: Ajouter le préfixe /api

// Get posts with filters
export const getPosts = async (params = {}) => {
  try {
    console.log('📡 Fetching posts from:', `${API_PREFIX}/posts/`);
    console.log('Params:', params);
    
    const response = await api.get(`${API_PREFIX}/posts/`, { 
      params,
      timeout: 10000
    });
    
    console.log(`✅ Posts loaded: ${response.data?.posts?.length || 0} posts`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching posts:', {
      url: `${API_PREFIX}/posts/`,
      params,
      error: error.message,
      response: error.response?.data
    });
    
    // Fallback pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using mock posts for development');
      return getMockPosts(params);
    }
    
    throw error;
  }
};

// Get categories
export const getCategories = async () => {
  try {
    console.log('📡 Fetching categories from:', `${API_PREFIX}/categories/`);
    
    const response = await api.get(`${API_PREFIX}/categories/`);
    console.log(`✅ Categories loaded: ${response.data?.length || 0} categories`);
    return response.data;
  } catch (error) {
    console.error('❌ Error fetching categories:', error.message);
    
    // Fallback pour le développement
    if (process.env.NODE_ENV === 'development') {
      console.warn('⚠️ Using mock categories for development');
      return getMockCategories();
    }
    
    throw error;
  }
};

// Get category by name
export const getCategoryByName = async (categoryName) => {
  try {
    console.log(`📡 Fetching category by name: ${categoryName}`);
    
    // Essayer d'abord l'endpoint spécifique
    const response = await api.get(`${API_PREFIX}/categories/${categoryName}/`);
    return response.data;
  } catch (error) {
    console.error(`❌ Error fetching category ${categoryName}:`, error.message);
    
    // Fallback: chercher dans la liste complète
    if (error.response?.status === 404) {
      console.log('🔄 Trying alternative method...');
      const categories = await getCategories();
      const foundCategory = Array.isArray(categories) 
        ? categories.find(cat => 
            cat.name && cat.name.toLowerCase() === categoryName.toLowerCase()
          )
        : null;
      
      if (foundCategory) {
        return { category: foundCategory, posts: [] };
      }
    }
    
    throw error;
  }
};

// Get posts by category
export const getPostsByCategory = async (categoryId, params = {}) => {
  return getPosts({ ...params, category: categoryId });
};

// Données mockées
const getMockCategories = () => {
  return [
    {
      id: 1,
      name: 'software',
      description: 'Software development and programming topics',
      image_url: null,
      parent: null,
      posts_count: 15,
      is_active: true
    },
    {
      id: 2,
      name: 'web',
      description: 'Web development and design',
      image_url: null,
      parent: null,
      posts_count: 23,
      is_active: true
    }
  ];
};

const getMockPosts = (params = {}) => {
  const mockPosts = [
    {
      id: 1,
      title: 'Getting Started with React',
      content: 'React is a popular JavaScript library for building user interfaces...',
      user_name: 'john_doe',
      user_profile_image: null,
      average_rating: 4.5,
      total_ratings: 12,
      category: { id: 1, name: 'software' },
      category_name: 'software',
      tags: [{ id: 1, name: 'react' }, { id: 2, name: 'javascript' }],
      created_at: '2024-01-15T10:30:00Z',
      image_url: null
    }
  ];
  
  return {
    posts: mockPosts,
    pagination: {
      page: params.page || 1,
      page_size: params.pageSize || 20,
      total_posts: mockPosts.length,
      total_pages: 1
    }
  };
};

// Export
export const postService = {
  getPosts,
  getPostsByCategory,
  getCategories,
  getCategoryByName
};

export default postService;