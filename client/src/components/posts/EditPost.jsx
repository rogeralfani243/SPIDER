// src/components/post/EditPost.jsx
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { FaArrowLeft, FaSave, FaSpinner, FaTimes, FaCheck } from 'react-icons/fa';

// IMPORTANT: Créez ce fichier apiConfig.js
// src/config/apiConfig.js
// Contenu: 
// const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000';
// export default API_BASE_URL;
import API_URL from '../../hooks/useApiUrl';

import '../../styles/create_post/create-post.css';
import '../../styles/edit_post/edit-post.css';
import DashboardMain from '../dashboard_main';

// Import modular components
import EditPostHeader from './edit_post/EditPostHeader';
import PostFormSection from './edit_post/PostFormSection';
import MainImageEditor from './edit_post/MainImageEditor';
import ExistingMediaManager from './edit_post/ExistingMediaManager';
import NewMediaUploader from './edit_post/NewMediaUploader';
import CategorySelector from '../create_post/category/CategorySelector';
import Alert from './edit_post/Alert';

const EditPost = () => {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Référence pour éviter les re-rendus inutiles
  const isMounted = useRef(true);
  const abortControllerRef = useRef(null);
  
  // Main states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectToPosts, setRedirectToPosts] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(true); // Nouvel état pour l'autorisation
  const [postData, setPostData] = useState(null); // Stocker les données complètes du post
  
  // Form data
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    link: '',
  });
  
  // New main image
  const [newMainImage, setNewMainImage] = useState(null);
  const [newMainImagePreview, setNewMainImagePreview] = useState('');
  const mainImageRef = useRef(null);
  
  // New files to add
  const [newFiles, setNewFiles] = useState({
    images: [],
    videos: [],
    audio: [],
    documents: []
  });
  
  // New files previews
  const [newPreviews, setNewPreviews] = useState({
    images: [],
    videos: [],
    audio: [],
    documents: []
  });
  
  // Existing media
  const [existingMedia, setExistingMedia] = useState({
    images: [],
    videos: [],
    audio: [],
    documents: []
  });
  
  // Media IDs to delete
  const [mediaToDelete, setMediaToDelete] = useState({
    images: [],
    files: []
  });

  const [categoriesError, setCategoriesError] = useState('');

  // Cleanup function
  useEffect(() => {
    isMounted.current = true;
    
    return () => {
      isMounted.current = false;
      
      // Annuler les requêtes en cours
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      
      // Nettoyer les URLs blob
      if (mainImageRef.current) {
        window.URL.revokeObjectURL(mainImageRef.current);
      }
      
      Object.values(newPreviews).forEach(previewArray => {
        previewArray.forEach(preview => {
          if (preview && preview.url && preview.url.startsWith('blob:')) {
            window.URL.revokeObjectURL(preview.url);
          }
        });
      });
    };
  }, []);

  // Helper functions
  const getToken = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setError('Authentication required. Please login.');
      setTimeout(() => {
        navigate('/login', { state: { from: location.pathname } });
      }, 1500);
      return null;
    }
    return token;
  }, [navigate, location]);

  const getCsrfToken = useCallback(() => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  }, []);

  // Récupérer l'utilisateur courant depuis localStorage
  const getCurrentUser = useCallback(() => {
    try {
      const userStr = localStorage.getItem('user');
      if (userStr) {
        return JSON.parse(userStr);
      }
    } catch (error) {
      console.error('Error parsing user from localStorage:', error);
    }
    return null;
  }, []);

  // Rediriger vers la page d'accueil si non autorisé
  const redirectToHome = useCallback(() => {
    setError('Post not found. Redirecting to homepage...');
    setIsAuthorized(false);
    
    setTimeout(() => {
      if (isMounted.current) {
        navigate('/');
      }
    }, 2000);
  }, [navigate]);

  // Vérifier les permissions à partir des données du serializer
  const checkPermissions = useCallback((postData) => {
    if (!postData) return false;
    
    const currentUser = getCurrentUser();
    
    console.log('🔐 [PERMISSIONS CHECK]', {
      postId: postData.id,
      postUserId: postData.user,
      currentUserId: currentUser?.id,
      is_owner: postData.is_owner,
      user_can_edit: postData.user_can_edit,
      user_can_delete: postData.user_can_delete
    });
    
    // Utiliser directement les permissions du serializer
    if (postData.user_can_edit === false) {
      console.log('🔒 [ACCESS DENIED] user_can_edit is false from serializer');
      return false;
    }
    
    // Vérification supplémentaire avec l'ID utilisateur
    if (currentUser && postData.user) {
      const isCreator = postData.user === currentUser.id;
      console.log('👤 [CREATOR CHECK]', { isCreator });
      
      if (!isCreator) {
        // Vérifier si c'est un admin/staff
        const userStr = localStorage.getItem('user');
        try {
          const userData = JSON.parse(userStr || '{}');
          const isAdmin = userData.is_staff || userData.is_superuser;
          console.log('🛡️ [ADMIN CHECK]', { isAdmin, userData });
          
          if (!isAdmin) {
            console.log('🔒 [ACCESS DENIED] Not creator and not admin');
            return false;
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          return false;
        }
      }
    } else {
      console.log('🔒 [ACCESS DENIED] No user data available');
      return false;
    }
    
    console.log('✅ [PERMISSION GRANTED] User can edit this post');
    return true;
  }, [getCurrentUser]);

  // Fetch post data with AbortController
  const fetchPostData = useCallback(async () => {
    if (!postId || !isMounted.current) return;
    
    // Annuler la requête précédente
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    abortControllerRef.current = new AbortController();
    
    try {
      setLoading(true);
      setError('');
      
      const token = getToken();
      if (!token) return;
      
      const response = await fetch(`${API_URL}/post/posts/${postId}/`, {
        method: 'GET',
        headers: {
          'Authorization': `Token ${token}`,
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal
      });
      
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('Post not found or you do not have permission to edit it.');
        } else if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          // Si l'API renvoie directement 403
          console.log('🔒 [API 403] Direct API access denied');
          redirectToHome();
          return;
        } else {
          throw new Error(`Error ${response.status}: Failed to load post`);
        }
      }
      
      const postData = await response.json();
      
      if (!isMounted.current) return;
      
      // Sauvegarder les données complètes du post
      setPostData(postData);
      
      // Vérifier les permissions
      const hasPermission = checkPermissions(postData);
      if (!hasPermission) {
        redirectToHome();
        return;
      }
      
      // Mettre à jour les données du formulaire
      setFormData({
        title: postData.title || '',
        content: postData.content || '',
        category_id: postData.category?.id || postData.category_id || '',
        link: postData.link || '',
      });
      
      // Prévisualisation de l'image principale
      if (postData.image_url) {
        setNewMainImagePreview(postData.image_url);
      }
      
      // Organiser les médias existants
      const media = {
        images: [],
        videos: [],
        audio: [],
        documents: []
      };
      
      // Traiter les images
      if (postData.post_images && Array.isArray(postData.post_images)) {
        media.images = postData.post_images.map(img => ({
          id: img.id,
          url: img.image,
          name: img.name || `image_${img.id}.jpg`,
          type: 'image',
          file_type: 'image',
          size: img.size || 0,
          isPostImage: true
        }));
      }
      
      // Traiter les fichiers
      if (postData.post_files && Array.isArray(postData.post_files)) {
        postData.post_files.forEach(file => {
          const fileType = (file.file_type || '').toLowerCase();
          const mediaItem = {
            id: file.id,
            url: file.file_url,
            name: file.name || `file_${file.id}`,
            type: fileType.includes('image') ? 'image' : 
                  fileType.includes('video') ? 'video' :
                  fileType.includes('audio') ? 'audio' : 'document',
            file_type: file.file_type || 'document',
            size: file.size || 0,
            isPostFile: true
          };
          
          if (mediaItem.type === 'image') {
            media.images.push(mediaItem);
          } else if (mediaItem.type === 'video') {
            media.videos.push(mediaItem);
          } else if (mediaItem.type === 'audio') {
            media.audio.push(mediaItem);
          } else {
            media.documents.push(mediaItem);
          }
        });
      }
      
      setExistingMedia(media);
      
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        return;
      }
      
      console.error('Error fetching post:', error);
      
      if (isMounted.current) {
        setError(error.message || 'Failed to load post data');
        
        if (error.message.includes('Session expired') || error.message.includes('Authentication')) {
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      }
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }, [postId, getToken, navigate, redirectToHome, checkPermissions]);

  // Initial fetch
  useEffect(() => {
    if (postId) {
      fetchPostData();
    }
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [postId, fetchPostData]);

  // Force refresh when component mounts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && !loading && !saving && isAuthorized) {
        // Recharger les données quand la page redevient visible
        fetchPostData();
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [loading, saving, fetchPostData, isAuthorized]);

  // Handle form input changes
  const handleInputChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  }, []);

  // Handle category change
  const handleCategoryChange = useCallback((categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
  }, []);

  // Handle main image change
  const handleMainImageChange = useCallback((file) => {
    if (!file) return;
    
    // Nettoyer l'ancienne preview
    if (mainImageRef.current) {
      window.URL.revokeObjectURL(mainImageRef.current);
    }
    
    const blobUrl = window.URL.createObjectURL(file);
    mainImageRef.current = blobUrl;
    
    setNewMainImage(file);
    setNewMainImagePreview(blobUrl);
  }, []);

  const removeMainImage = useCallback(() => {
    if (mainImageRef.current) {
      window.URL.revokeObjectURL(mainImageRef.current);
      mainImageRef.current = null;
    }
    
    setNewMainImage(null);
    setNewMainImagePreview('');
  }, []);

  // Handle new files
  const handleNewFileSelect = useCallback((fileType, validFiles, previews) => {
    if (!validFiles.length) return;
    
    setNewFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...validFiles]
    }));
    
    setNewPreviews(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...previews]
    }));
  }, []);

  const removeNewFile = useCallback((fileType, index) => {
    // Nettoyer l'URL blob
    const preview = newPreviews[fileType][index];
    if (preview && preview.url && preview.url.startsWith('blob:')) {
      window.URL.revokeObjectURL(preview.url);
    }
    
    setNewFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
    
    setNewPreviews(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  }, [newPreviews]);

  // Mark existing media for deletion
  const markMediaForDeletion = useCallback((fileType, mediaId) => {
    if (!window.confirm('Are you sure you want to delete this media? This action cannot be undone.')) {
      return;
    }
    
    if (fileType === 'images') {
      setMediaToDelete(prev => ({
        ...prev,
        images: [...prev.images, mediaId]
      }));
    } else {
      setMediaToDelete(prev => ({
        ...prev,
        files: [...prev.files, mediaId]
      }));
    }
    
    // Retirer immédiatement de l'affichage
    setExistingMedia(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter(item => item.id !== mediaId)
    }));
    
    setSuccess('Media marked for deletion');
    setTimeout(() => {
      if (isMounted.current) {
        setSuccess('');
      }
    }, 2000);
  }, []);

  // Format file size
  const formatFileSize = useCallback((bytes) => {
    if (!bytes || bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  // Get file icon
  const getFileIcon = useCallback((extension) => {
    if (!extension) return 'fas fa-file';
    
    const ext = extension.toLowerCase();
    switch(ext) {
      case 'pdf': return 'fas fa-file-pdf text-danger';
      case 'doc':
      case 'docx': return 'fas fa-file-word text-primary';
      case 'txt': return 'fas fa-file-alt text-secondary';
      case 'zip':
      case 'rar':
      case '7z': return 'fas fa-file-archive text-warning';
      case 'pptx':
      case 'ppt': return 'fas fa-file-powerpoint text-danger';
      case 'xlsx':
      case 'xls':
      case 'csv': return 'fas fa-file-excel text-success';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'gif':
      case 'webp':
      case 'bmp': return 'fas fa-file-image text-info';
      case 'mp4':
      case 'avi':
      case 'mov':
      case 'wmv': return 'fas fa-file-video text-primary';
      case 'mp3':
      case 'wav':
      case 'ogg':
      case 'flac': return 'fas fa-file-audio text-success';
      default: return 'fas fa-file text-muted';
    }
  }, []);

  // Form submission
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!isMounted.current || !isAuthorized) return;
    
    // Vérifier à nouveau les permissions avant soumission
    if (postData && !checkPermissions(postData)) {
      setError('You are no longer authorized to edit this post.');
      redirectToHome();
      return;
    }
    
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      return;
    }
    
    if (!formData.category_id) {
      setError('Please select a category');
      return;
    }
    
    const token = getToken();
    if (!token) return;
    
    setSaving(true);
    setError('');
    setSuccess('');
    
    try {
      const csrfToken = getCsrfToken();
      
      // Créer FormData
      const formDataToSend = new FormData();
      
      // Ajouter les données texte
      formDataToSend.append('title', formData.title.trim());
      formDataToSend.append('content', formData.content.trim());
      formDataToSend.append('category_id', formData.category_id);
      
      if (formData.link && formData.link.trim()) {
        formDataToSend.append('link', formData.link.trim());
      }
      
      // Ajouter la nouvelle image principale
      if (newMainImage) {
        formDataToSend.append('image', newMainImage);
      }
      
      // Ajouter les nouveaux fichiers
      Object.entries(newFiles).forEach(([type, files]) => {
        files.forEach(file => {
          if (file) {
            formDataToSend.append(type, file);
          }
        });
      });
      
      // Ajouter les médias à supprimer
      mediaToDelete.images.forEach(id => {
        formDataToSend.append('delete_images', id.toString());
      });
      
      mediaToDelete.files.forEach(id => {
        formDataToSend.append('delete_files', id.toString());
      });
      
      // Envoyer la requête
      const response = await fetch(`${API_URL}/post/posts/${postId}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Token ${token}`,
          'X-CSRFToken': csrfToken,
        },
        body: formDataToSend,
        credentials: 'include'
      });
      
      const responseText = await response.text();
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { detail: responseText || 'Unknown error occurred' };
        }
        
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          throw new Error('Session expired. Please login again.');
        } else if (response.status === 403) {
          // Firewall: l'utilisateur n'est pas l'auteur
          redirectToHome();
          return;
        } else if (response.status === 404) {
          throw new Error('Post not found.');
        } else {
          throw new Error(
            errorData.detail || 
            errorData.error || 
            errorData.message || 
            `Error ${response.status}: Update failed`
          );
        }
      }
      
      // Réinitialiser les états
      setSuccess('Post updated successfully! Redirecting...');
      setRedirectToPosts(true);
      
      // Stocker pour mise en évidence
      sessionStorage.setItem('editedPostId', postId);
      sessionStorage.setItem('postEditTime', Date.now().toString());
      
      // Redirection après délai
      setTimeout(() => {
        if (isMounted.current) {
          navigate(`/posts?highlight=${postId}&updated=true&t=${Date.now()}`);
        }
      }, 1500);
      
    } catch (error) {
      console.error('Update error:', error);
      
      if (isMounted.current) {
        setError(error.message || 'Failed to update post');
        
        if (error.message.includes('Session expired')) {
          setTimeout(() => {
            navigate('/login');
          }, 1500);
        }
      }
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  }, [
    formData, 
    newMainImage, 
    newFiles, 
    mediaToDelete, 
    postId, 
    getToken, 
    getCsrfToken, 
    navigate, 
    isAuthorized,
    redirectToHome,
    postData,
    checkPermissions
  ]);

  // Auto-hide messages
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        if (isMounted.current) {
          if (error) setError('');
          if (success && !redirectToPosts) setSuccess('');
        }
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [error, success, redirectToPosts]);

  // Si non autorisé, afficher un message de redirection
  if (!isAuthorized) {
    return (
      <div className="unauthorized-container">
        <DashboardMain />
        <div className="unauthorized-message">
          <i className="fas fa-shield-alt"></i>
          <h2>Access Denied</h2>
          <p>Post Not Found</p>
          <p>The post you are trying to reach was not founded😭</p>
          <button 
            className="btn-home"
            onClick={() => navigate('/')}
          >
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading post data...</p>
      </div>
    );
  }

  return (
    <>

      <div className="edit-post-container edit-post-container2">
        {/* Header */}
        <EditPostHeader 
          onBack={() => {
            if (redirectToPosts) {
              navigate(`/posts?highlight=${postId}&updated=true`);
            } else {
              navigate(-1);
            }
          }}
          saving={saving}
        />
        
        {/* Alerts */}
        {error && (
          <div className="alert-container">
            <Alert 
              type="error" 
              message={error}
              onClose={() => setError('')}
            />
          </div>
        )}
        
        {success && (
          <div className="alert-container">
            <Alert 
              type="success" 
              message={success}
              autoClose={!redirectToPosts}
              onClose={() => !redirectToPosts && setSuccess('')}
            />
          </div>
        )}
        
        {categoriesError && (
          <div className="alert-container">
            <Alert 
              type="error" 
              message={categoriesError}
              onClose={() => setCategoriesError('')}
            />
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="edit-post-form" noValidate>
          {/* Basic Information Section */}
          <PostFormSection title="Basic Information">
            <div className="form-group">
              <label htmlFor="title">Title *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                maxLength="200"
                placeholder="Post title"
                disabled={saving || redirectToPosts}
                className={error && !formData.title.trim() ? 'is-invalid' : ''}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="category_id">Category *</label>
              <CategorySelector
                selectedCategoryId={formData.category_id}
                onCategoryChange={handleCategoryChange}
                disabled={saving || redirectToPosts}
                showOnlyActive={true}
                placeholder="Choose a category"
                error={error && !formData.category_id}
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="link">Link (optional)</label>
              <input
                type="url"
                id="link"
                name="link"
                value={formData.link}
                onChange={handleInputChange}
                placeholder="https://example.com"
                disabled={saving || redirectToPosts}
              />
            </div>
          </PostFormSection>

          {/* Content Section */}
          <PostFormSection title="Content">
            <div className="form-group">
              <label htmlFor="content">Content *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                required
                rows="8"
                placeholder="Write your content here..."
                disabled={saving || redirectToPosts}
                className={error && !formData.content.trim() ? 'is-invalid' : ''}
              />
              <div className="content-tips">
                <small>
                  <i className="fas fa-info-circle"></i>
                  Use @mention to mention a user and #tag to create tags
                </small>
              </div>
            </div>
          </PostFormSection>

          {/* Main Image Section */}
      
          {/* Existing Media Section */}
          {(existingMedia.images.length > 0 || 
            existingMedia.videos.length > 0 || 
            existingMedia.audio.length > 0 || 
            existingMedia.documents.length > 0) && (
            <PostFormSection title="Existing Media">
              <ExistingMediaManager
                existingMedia={existingMedia}
                mediaToDelete={mediaToDelete}
                onDelete={markMediaForDeletion}
                formatFileSize={formatFileSize}
                getFileIcon={getFileIcon}
                disabled={saving || redirectToPosts}
              />
            </PostFormSection>
          )}

          {/* New Media Section */}
          <PostFormSection title="Add New Media">
            <NewMediaUploader
              newFiles={newFiles}
              newPreviews={newPreviews}
              existingMedia={existingMedia}
              onFileSelect={handleNewFileSelect}
              onRemoveFile={removeNewFile}
              formatFileSize={formatFileSize}
              getFileIcon={getFileIcon}
              disabled={saving || redirectToPosts}
            />
            
            {/* Summary */}
            {(Object.values(newFiles).some(arr => arr.length > 0) || 
              mediaToDelete.images.length > 0 || 
              mediaToDelete.files.length > 0) && (
              <div className="new-files-summary">
                <h5>Modifications Summary:</h5>
                <div className="summary-grid">
                  {newFiles.images.length > 0 && (
                    <div className="summary-item">
                      <i className="fas fa-images"></i>
                      <span>{newFiles.images.length} new image(s)</span>
                    </div>
                  )}
                  {newFiles.videos.length > 0 && (
                    <div className="summary-item">
                      <i className="fas fa-video"></i>
                      <span>{newFiles.videos.length} new video(s)</span>
                    </div>
                  )}
                  {newFiles.audio.length > 0 && (
                    <div className="summary-item">
                      <i className="fas fa-music"></i>
                      <span>{newFiles.audio.length} new audio file(s)</span>
                    </div>
                  )}
                  {newFiles.documents.length > 0 && (
                    <div className="summary-item">
                      <i className="fas fa-file"></i>
                      <span>{newFiles.documents.length} new document(s)</span>
                    </div>
                  )}
                  {mediaToDelete.images.length > 0 && (
                    <div className="summary-item deletion">
                      <i className="fas fa-trash"></i>
                      <span>{mediaToDelete.images.length} image(s) to delete</span>
                    </div>
                  )}
                  {mediaToDelete.files.length > 0 && (
                    <div className="summary-item deletion">
                      <i className="fas fa-trash"></i>
                      <span>{mediaToDelete.files.length} file(s) to delete</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </PostFormSection>

          {/* Form Actions */}
          <div className="form-actions">
            <button
              type="button"
              className={`btn-cancel ${redirectToPosts ? 'redirecting' : ''}`}
              onClick={() => {
                if (redirectToPosts) {
                  window.location.href = `/posts?highlight=${postId}&updated=true`;
                } else {
                  navigate(-1);
                }
              }}
              disabled={saving}
            >
              <FaTimes /> {redirectToPosts ? 'Go to Posts' : 'Cancel'}
            </button>
            
            <button
              type="submit"
              className={`btn-submit ${redirectToPosts ? 'updated' : ''}`}
              disabled={saving || redirectToPosts}
            >
              {saving ? (
                <>
                  <FaSpinner className="spinner-icon" /> Updating...
                </>
              ) : redirectToPosts ? (
                <>
                  <FaCheck /> Updated!
                </>
              ) : (
                <>
                  <FaSave /> Save Changes
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default EditPost;