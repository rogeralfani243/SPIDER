// src/hooks/useSoftwarePosts.js
import { useState, useEffect } from 'react';
import { categoryService } from '../services/categoryService';
import { postService } from '../services/postService';
// src/hooks/useSoftwarePosts.js
import { useCallback } from 'react';

export const useSoftwarePosts = (filters = {}) => {
  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrevious: false
  });

  const loadSoftwareData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('🔍 [useSoftwarePosts] Loading data with filters:', filters);
      
      // 1. Chercher la catégorie Software si pas déjà chargée
      if (!category) {
        console.log('🔍 [useSoftwarePosts] Loading software category...');
        try {
          const categoriesResponse = await categoryService.getAllCategories();
          console.log('🔍 [useSoftwarePosts] Categories response:', categoriesResponse.data);
          
          if (categoriesResponse.data && Array.isArray(categoriesResponse.data)) {
            const softwareCategory = categoriesResponse.data.find(
              cat => cat.name && cat.name.toLowerCase().includes('software')
            );
            
            if (softwareCategory) {
              console.log('✅ [useSoftwarePosts] Found software category:', softwareCategory);
              setCategory(softwareCategory);
            } else {
              console.warn('⚠️ [useSoftwarePosts] No software category found');
              setError('Software category not found in system');
              setLoading(false);
              return;
            }
          } else {
            console.error('❌ [useSoftwarePosts] Invalid categories response:', categoriesResponse.data);
            setError('Invalid response from server');
            setLoading(false);
            return;
          }
        } catch (catError) {
          console.error('❌ [useSoftwarePosts] Error loading categories:', catError);
          setError('Failed to load categories: ' + catError.message);
          setLoading(false);
          return;
        }
      }
      
      // 2. Préparer les paramètres pour la requête posts
      const postsParams = {
        ...filters,
        category: category?.id,
        page: filters.page || 1,
        page_size: filters.pageSize || 20
      };
      
      console.log('🔍 [useSoftwarePosts] Fetching posts with params:', postsParams);
      
      const postsResponse = await postService.getPosts(postsParams);
      console.log('🔍 [useSoftwarePosts] Posts response:', postsResponse);
      
      // 3. Gérer les différents formats de réponse
      if (!postsResponse || !postsResponse.data) {
        console.error('❌ [useSoftwarePosts] No data in response');
        setError('No data received from server');
        setPosts([]);
        setLoading(false);
        return;
      }
      
      const responseData = postsResponse.data;
      console.log('🔍 [useSoftwarePosts] Response data structure:', Object.keys(responseData));
      
      let postsArray = [];
      let paginationData = null;
      
      // Vérifier la structure de la réponse
      if (Array.isArray(responseData)) {
        // Format 1: Tableau direct de posts
        postsArray = responseData;
        console.log(`✅ [useSoftwarePosts] Got ${postsArray.length} posts as array`);
      } else if (responseData.posts && Array.isArray(responseData.posts)) {
        // Format 2: { posts: [...], pagination: {...} }
        postsArray = responseData.posts;
        console.log(`✅ [useSoftwarePosts] Got ${postsArray.length} posts in posts field`);
        
        if (responseData.pagination) {
          paginationData = responseData.pagination;
          console.log('🔍 [useSoftwarePosts] Pagination data:', paginationData);
        }
      } else if (responseData.data && Array.isArray(responseData.data)) {
        // Format 3: { data: [...] }
        postsArray = responseData.data;
        console.log(`✅ [useSoftwarePosts] Got ${postsArray.length} posts in data field`);
      } else {
        console.warn('⚠️ [useSoftwarePosts] Unknown response format:', responseData);
        postsArray = [];
      }
      
      // 4. Mettre à jour l'état
      setPosts(postsArray);
      
      if (paginationData) {
        setPagination({
          page: paginationData.page || 1,
          pageSize: paginationData.page_size || 20,
          total: paginationData.total_posts || postsArray.length,
          totalPages: paginationData.total_pages || 1,
          hasNext: paginationData.has_next || false,
          hasPrevious: paginationData.has_previous || false
        });
      } else {
        // Par défaut
        setPagination(prev => ({
          ...prev,
          total: postsArray.length,
          totalPages: Math.ceil(postsArray.length / (filters.pageSize || 20))
        }));
      }
      
      console.log(`✅ [useSoftwarePosts] Successfully loaded ${postsArray.length} posts`);
      
    } catch (err) {
      console.error('❌ [useSoftwarePosts] Error:', err);
      console.error('❌ [useSoftwarePosts] Error details:', {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status
      });
      
      setError(err.message || 'Failed to load software posts');
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [category, filters]);

  useEffect(() => {
    loadSoftwareData();
  }, [loadSoftwareData]);

  // Fonction pour changer de page
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= pagination.totalPages) {
      loadSoftwareData({ ...filters, page: pageNumber });
    }
  };

  // Fonction pour créer un post
  const createSoftwarePost = async (postData) => {
    try {
      console.log('🔍 [useSoftwarePosts] Creating post:', postData);
      
      if (!category) {
        await loadSoftwareData();
      }
      
      const postToCreate = {
        ...postData,
        category_id: category.id,
        // Assure-toi que c'est le bon format pour ton backend
      };
      
      console.log('🔍 [useSoftwarePosts] Sending to API:', postToCreate);
      
      const response = await postService.createPost(postToCreate);
      console.log('✅ [useSoftwarePosts] Post created:', response.data);
      
      // Recharger les données
      await loadSoftwareData();
      
      return response.data;
    } catch (error) {
      console.error('❌ [useSoftwarePosts] Error creating post:', error);
      throw error;
    }
  };

  // Fonction pour mettre à jour un post
  const updateSoftwarePost = async (postId, postData) => {
    try {
      const response = await postService.updatePost(postId, postData);
      await loadSoftwareData();
      return response.data;
    } catch (error) {
      console.error('Error updating post:', error);
      throw error;
    }
  };

  // Fonction pour supprimer un post
  const deleteSoftwarePost = async (postId) => {
    try {
      await postService.deletePost(postId);
      await loadSoftwareData();
    } catch (error) {
      console.error('Error deleting post:', error);
      throw error;
    }
  };

  // Fonction pour rafraîchir
  const refresh = () => {
    loadSoftwareData();
  };

  return {
    // Données
    posts,
    category,
    
    // État
    loading,
    error,
    pagination,
    
    // Actions
    refresh,
    createSoftwarePost,
    updateSoftwarePost,
    deleteSoftwarePost,
    goToPage,
    
    // Utilitaires
    hasPosts: posts.length > 0,
    postsCount: posts.length,
    
    // Pour debug
    debug: {
      filters,
      categoryId: category?.id
    }
  };
};

export default useSoftwarePosts;