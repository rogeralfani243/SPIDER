import React, { useState, useRef, useEffect } from 'react';
import axios from 'axios';
import { FaImage, FaVideo, FaFile, FaAt, FaSmile, FaPaperPlane, FaTimes, FaSearch, FaUser } from 'react-icons/fa';
import '../../styles/comment_post/CommentForm.css';
import API_URL from '../../hooks/useApiUrl';
import EmojiPicker from 'emoji-picker-react';
import UserMentionRenderer from './UserMentionRender'; // Import du nouveau composant
import MentionUserItem from './UserMentionItem';
import { useNavigate } from 'react-router-dom';
import { userAPI } from '../../hooks/messaging/messagingApi';
const CommentForm = ({ 
  postId, 
  parentCommentId = null, 
  initialContent = '', 
  initialImage = null,
  initialVideo = null,
  initialFile = null,
  commentId = null,
  onSubmit, 
  onCancel,
  isEditing = false,
  placeholder = "Write a comment...",
  autoFocus = false,
  isReply = false,
  isSubmitting = false
}) => {
  const [content, setContent] = useState(initialContent);
  const [image, setImage] = useState(null);
  const [video, setVideo] = useState(null);
  const [file, setFile] = useState(null);
  const [internalIsSubmitting, setInternalIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const [previewVideo, setPreviewVideo] = useState(null);
  const [error, setError] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [mediaToDelete, setMediaToDelete] = useState({
    image: false,
    video: false,
    file: false
  });
  
  // 🔥 États pour le système de mentions
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionPosition, setMentionPosition] = useState({ top: 0, left: 0 });
  const [mentionSearch, setMentionSearch] = useState('');
  const [selectedUserIndex, setSelectedUserIndex] = useState(0);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [mentionStartIndex, setMentionStartIndex] = useState(-1);
  const [currentUser, setCurrentUser] = useState(null); // Ajout pour connaître l'utilisateur connecté
  
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const imageInputRef = useRef(null);
  const videoInputRef = useRef(null);
  const mentionListRef = useRef(null);
  
  // Combiner les états de soumission
  const submitting = isSubmitting || internalIsSubmitting;
  const navigate = useNavigate()
  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [autoFocus]);

  // Initialiser les médias existants en mode édition
  useEffect(() => {
    if (isEditing) {
      console.log('🔍 CommentForm - Initializing edit mode:', {
        initialImage,
        initialVideo,
        initialFile,
        commentId
      });
      
      // Afficher les prévisualisations des médias existants
      if (initialImage) {
        console.log('🖼️ Existing image:', initialImage);
        setPreviewImage(initialImage);
      }
      
      if (initialVideo) {
        console.log('🎬 Existing video:', initialVideo);
        setPreviewVideo(initialVideo);
      }
    }
  }, [isEditing, initialImage, initialVideo, initialFile, commentId]);

  // 🔥 Charger la liste des utilisateurs pour les mentions
  useEffect(() => {
    const fetchUsersAndCurrentUser = async () => {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      setIsLoadingUsers(true);
      try {
        // Charger la liste des utilisateurs
        const usersResponse = await axios.get(`${API_URL}/comment/users/list/`, {
          headers: {
            'Authorization': `Token ${token}`
          },
          params: {
            limit: 100,
            exclude_self: true
          }
        });
        
        const usersData = usersResponse.data.users || usersResponse.data || [];
        setUsers(usersData);
        setFilteredUsers(usersData);
        
        // Charger l'utilisateur courant
        try {
          const currentUserResponse = await axios.get( {
            headers: {
              'Authorization': `Token ${token}`
            }
          });
          setCurrentUser(currentUserResponse.data);
        } catch (userError) {
          console.warn("Could not fetch current user:", userError);
        }
        
      } catch (error) {
        console.error("Error fetching users for mentions:", error);
      } finally {
        setIsLoadingUsers(false);
      }
    };

    fetchUsersAndCurrentUser();
  }, []);

  // 🔥 Détecter les mentions (@) dans le texte
  useEffect(() => {
    if (!textareaRef.current || !users.length) return;

    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = content.substring(0, cursorPosition);
    
    // Chercher le dernier @ avant le curseur
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex !== -1) {
      // Vérifier si le @ est au début d'un mot
      const charBeforeAt = lastAtIndex > 0 ? textBeforeCursor[lastAtIndex - 1] : ' ';
      const isStartOfWord = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
      
      if (isStartOfWord) {
        const searchText = textBeforeCursor.substring(lastAtIndex + 1, cursorPosition);
        
        // Vérifier s'il n'y a pas d'espace après le @
        if (!searchText.includes(' ')) {
          setMentionSearch(searchText);
          setMentionStartIndex(lastAtIndex);
          
          // Filtrer les utilisateurs
          const filtered = users.filter(user => 
            user.username.toLowerCase().includes(searchText.toLowerCase()) ||
            user.full_name?.toLowerCase().includes(searchText.toLowerCase())
          );
          
          setFilteredUsers(filtered);
          
          if (filtered.length > 0) {
            // Calculer la position pour afficher la liste
            const textareaRect = textarea.getBoundingClientRect();
            const linesBeforeCursor = (content.substring(0, cursorPosition).match(/\n/g) || []).length;
            const lineHeight = 20; // Hauteur approximative d'une ligne
            
            setMentionPosition({
              top: textareaRect.top + window.scrollY + (linesBeforeCursor * lineHeight) + lineHeight,
              left: textareaRect.left + window.scrollX + 10
            });
            
            setShowMentionList(true);
            setSelectedUserIndex(0);
            return;
          }
        }
      }
    }
    
    // Cacher la liste si conditions non remplies
    setShowMentionList(false);
  }, [content, users]);

  // 🔥 Gérer la navigation clavier dans la liste des mentions
  useEffect(() => {
    if (!showMentionList) return;

    const handleKeyDown = (e) => {
      if (!showMentionList) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedUserIndex(prev => 
            prev < filteredUsers.length - 1 ? prev + 1 : 0
          );
          break;
          
        case 'ArrowUp':
          e.preventDefault();
          setSelectedUserIndex(prev => 
            prev > 0 ? prev - 1 : filteredUsers.length - 1
          );
          break;
          
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          if (filteredUsers[selectedUserIndex]) {
            insertMention(filteredUsers[selectedUserIndex]);
          }
          break;
          
        case 'Escape':
          e.preventDefault();
          setShowMentionList(false);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [showMentionList, filteredUsers, selectedUserIndex]);

  // 🔥 Insérer une mention dans le texte
  const insertMention = (user) => {
    if (!textareaRef.current || mentionStartIndex === -1) return;
    
    const textarea = textareaRef.current;
    const cursorPosition = textarea.selectionStart;
    
    // Construire le nouveau texte avec la mention
    const newText = 
      content.substring(0, mentionStartIndex) + 
      `@${user.username} ` + 
      content.substring(cursorPosition);
    
    setContent(newText);
    setShowMentionList(false);
    setMentionStartIndex(-1);
    
    // Focus et positionner le curseur après la mention
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = mentionStartIndex + user.username.length + 2; // +2 pour @ et espace
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 0);
  };

  // 🔥 Click outside pour fermer la liste des mentions
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showMentionList && 
          mentionListRef.current && 
          !mentionListRef.current.contains(event.target) &&
          textareaRef.current &&
          !textareaRef.current.contains(event.target)) {
        setShowMentionList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMentionList]);

  // 🔥 Scroller vers l'utilisateur sélectionné
  useEffect(() => {
    if (showMentionList && mentionListRef.current) {
      const selectedElement = mentionListRef.current.children[selectedUserIndex];
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        });
      }
    }
  }, [selectedUserIndex, showMentionList]);

  // 🔥 Fonction pour gérer le clic sur une mention dans l'aperçu
  const handleMentionClick = (username, userInfo) => {
    console.log('Mention cliquée:', { username, userInfo });
    if (userInfo) {
      // Ouvrir le profil dans un nouvel onglet
      window.open(`/profile/${userInfo.profile_id}`, '_blank');
    
  };
  }
  const handleImageChange = (e) => {
    console.log('🖼️ Image input changed');
    console.log('  Event target:', e.target);
    console.log('  Files:', e.target.files);
    
    const file = e.target.files[0];
    if (file) {
      console.log('✅ Image selected:', {
        name: file.name,
        size: file.size,
        type: file.type,
        isFile: file instanceof File,
        constructor: file.constructor.name
      });
      
      // Vérifier que c'est bien un fichier
      if (!(file instanceof File)) {
        console.error('❌ Selected item is not a File object!');
        return;
      }
      
      setImage(file);
      setPreviewImage(URL.createObjectURL(file));
      
      // Clear other media
      setVideo(null);
      setPreviewVideo(null);
      setFile(null);
      
      // Réinitialiser le marquage de suppression
      setMediaToDelete(prev => ({ ...prev, image: false, video: false, file: false }));
    } else {
      console.log('❌ No file selected');
    }
  };

  const handleVideoChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('🎬 Video selected:', file.name, file.size, file.type);
      
      if (isEditing && initialVideo) {
        setMediaToDelete(prev => ({ ...prev, video: true }));
      }
      
      setVideo(file);
      setPreviewVideo(URL.createObjectURL(file));
      
      // Clear other media
      setImage(null);
      setPreviewImage(null);
      setFile(null);
      
      setMediaToDelete(prev => ({ ...prev, image: false, file: false }));
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      console.log('📎 File selected:', file.name, file.size, file.type);
      
      if (isEditing && initialFile) {
        setMediaToDelete(prev => ({ ...prev, file: true }));
      }
      
      setFile(file);
      
      // Clear other media
      setImage(null);
      setPreviewImage(null);
      setVideo(null);
      setPreviewVideo(null);
      
      setMediaToDelete(prev => ({ ...prev, image: false, video: false }));
    }
  };

  const removeMedia = (type) => {
    console.log(`🗑️ Removing ${type}, isEditing: ${isEditing}`);
    
    if (type === 'image') {
      if (isEditing && initialImage && !image) {
        // En mode édition, marquer l'image existante pour suppression
        setMediaToDelete(prev => ({ ...prev, image: true }));
        setPreviewImage(null);
        console.log('🗑️ Existing image marked for deletion');
      } else {
        // En mode création ou nouvelle image uploadée
        if (previewImage) {
          URL.revokeObjectURL(previewImage);
        }
        setImage(null);
        setPreviewImage(null);
        setMediaToDelete(prev => ({ ...prev, image: false }));
      }
      
      if (imageInputRef.current) {
        imageInputRef.current.value = '';
      }
      
    } else if (type === 'video') {
      if (isEditing && initialVideo && !video) {
        setMediaToDelete(prev => ({ ...prev, video: true }));
        setPreviewVideo(null);
        console.log('🗑️ Existing video marked for deletion');
      } else {
        if (previewVideo) {
          URL.revokeObjectURL(previewVideo);
        }
        setVideo(null);
        setPreviewVideo(null);
        setMediaToDelete(prev => ({ ...prev, video: false }));
      }
      
      if (videoInputRef.current) {
        videoInputRef.current.value = '';
      }
      
    } else if (type === 'file') {
      if (isEditing && initialFile && !file) {
        setMediaToDelete(prev => ({ ...prev, file: true }));
        console.log('🗑️ Existing file marked for deletion');
      } else {
        setFile(null);
        setMediaToDelete(prev => ({ ...prev, file: false }));
      }
      
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Nettoyer les URLs lors du démontage
  useEffect(() => {
    return () => {
      if (previewImage) {
        URL.revokeObjectURL(previewImage);
      }
      if (previewVideo) {
        URL.revokeObjectURL(previewVideo);
      }
    };
  }, [previewImage, previewVideo]);

  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

const handleSubmit = async (e) => {
  e.preventDefault();
  
  console.log('🔄 CommentForm: Starting submit process...');
  
  const token = localStorage.getItem('token');
  if (!token) {
    setError('You must be logged in to post a comment');
    return;
  }
  
  // Vérifier qu'on a au moins quelque chose
  const hasText = content !== undefined && content !== null && content !== '';
  const hasNewMedia = image || video || file;
  const hasExistingMedia = initialImage || initialVideo || initialFile;
  const isDeletingMedia = mediaToDelete.image || mediaToDelete.video || mediaToDelete.file;
  
  console.log('✅ Validation:', {
    hasText,
    hasNewMedia,
    hasExistingMedia,
    isDeletingMedia
  });
  
  if (!hasText && !hasNewMedia && !(isEditing && (hasExistingMedia || isDeletingMedia))) {
    setError('Please add some text or attach a file');
    return;
  }
  
  if (!isSubmitting) {
    setInternalIsSubmitting(true);
  }
  
  setError('');
  
  try {
    // 🔥 NORMALISER LE CONTENU POUR LES EMOJIS
    const normalizedContent = content ? content.normalize('NFC') : '';
    
    // DEBUG: Vérifier la normalisation
    console.log('🔍 Emoji normalization debug:');
    console.log('Original content:', content);
    console.log('Normalized content:', normalizedContent);
    console.log('Are they equal?', content === normalizedContent);
    console.log('Original length:', content?.length);
    console.log('Normalized length:', normalizedContent?.length);
    
    // 🔥 CRÉATION DU FORMDATA
    const formData = new FormData();
    
    // 🔥 UTILISER LE CONTENU NORMALISÉ (c'était l'erreur)
    formData.append('content', normalizedContent || '');
    
    // 🔥 AJOUTER LES FICHIERS
    if (image && image instanceof File) {
      formData.append('image', image);
      console.log('✅ Added image:', image.name);
    }
    
    if (video && video instanceof File) {
      formData.append('video', video);
      console.log('✅ Added video:', video.name);
    }
    
    if (file && file instanceof File) {
      formData.append('file', file);
      console.log('✅ Added file:', file.name);
    }
    
    // Mode édition : gestion spéciale
    if (isEditing) {
      if (mediaToDelete.image) {
        formData.append('image', '');
        console.log('🗑️ Marked image for deletion');
      }
      if (mediaToDelete.video) {
        formData.append('video', '');
        console.log('🗑️ Marked video for deletion');
      }
      if (mediaToDelete.file) {
        formData.append('file', '');
        console.log('🗑️ Marked file for deletion');
      }
    }
    
    // 🔥 DEBUG: Vérifier le FormData
    console.log('📋 FormData contents:');
    let fileCount = 0;
    for (let [key, value] of formData.entries()) {
      if (value instanceof File) {
        fileCount++;
        console.log(`  📁 ${key}: ${value.name} (${value.size} bytes)`);
      } else if (value === '') {
        console.log(`  🗑️ ${key}: "" (marked for deletion)`);
      } else if (key === 'content') {
        // 🔥 DEBUG SPÉCIAL POUR LE CONTENU
        console.log(`  📝 ${key}: "${value}"`);
        console.log(`  🔤 Content char codes:`, 
          Array.from(value).map(c => ({
            char: c,
            code: c.charCodeAt(0),
            hex: c.charCodeAt(0).toString(16)
          }))
        );
      } else {
        console.log(`  📝 ${key}: "${value}"`);
      }
    }
    console.log(`📊 Total files: ${fileCount}`);
    
    // 🔥 CONSTRUCTION DE L'URL
    let url;
    const csrfToken = getCsrfToken();
    
    if (isEditing && commentId) {
      url = `${API_URL}/comment/comments/${commentId}/`;
      console.log(`✏️ Editing comment ${commentId}`);
    } else {
      // Mode création
      url = `${API_URL}/comment/posts/${postId}/comments/`;
      
      // Ajouter parent_comment aux query params si c'est une réponse
      if (parentCommentId) {
        const params = new URLSearchParams();
        params.append('parent_comment', parentCommentId);
        url += `?${params.toString()}`;
        console.log(`📝 Creating reply to comment ${parentCommentId}`);
      } else {
        console.log(`📝 Creating new comment for post ${postId}`);
      }
    }
    
    // 🔥 ENVOI DE LA REQUÊTE AVEC AXIOS
    const response = await axios({
      method: isEditing && commentId ? 'PATCH' : 'POST',
      url: url,
      data: formData,
      headers: {
        'Authorization': `Token ${token}`,
        'X-CSRFToken': csrfToken,
        'Content-Type': 'multipart/form-data; charset=utf-8',
      }
    });
    
    console.log('✅ Server response:', response.data);
    
    // DEBUG: Vérifier si les emojis sont corrects dans la réponse
    if (response.data && response.data.content) {
      console.log('🔍 Emojis in server response:');
      console.log('Response content:', response.data.content);
      console.log('Response char codes:', 
        Array.from(response.data.content).map(c => ({
          char: c,
          code: c.charCodeAt(0),
          hex: c.charCodeAt(0).toString(16)
        }))
      );
      
      // Comparer avec ce qui a été envoyé
      const sentContent = normalizedContent;
      const receivedContent = response.data.content;
      console.log('📊 Comparison:', {
        equal: sentContent === receivedContent,
        sentLength: sentContent?.length,
        receivedLength: receivedContent?.length,
        difference: sentContent !== receivedContent ? 
          '⚠️ Content changed during transmission!' : '✅ Content preserved'
      });
    }
    
    // 🔥 APPELER LE CALLBACK ONSUBMIT
    if (onSubmit) {
      await onSubmit(response.data);  // Passe l'objet commentaire créé
    }
    
    // Réinitialiser le formulaire si création
    if (!isEditing) {
      setContent('');
      setImage(null);
      setVideo(null);
      setFile(null);
      setPreviewImage(null);
      setPreviewVideo(null);
      setMediaToDelete({ image: false, video: false, file: false });
      
      if (imageInputRef.current) imageInputRef.current.value = '';
      if (videoInputRef.current) videoInputRef.current.value = '';
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
    
  } catch (error) {
    console.error('❌ Error submitting comment:', error);
    console.error('❌ Error response:', error.response?.data);
    
    let errorMessage = 'Failed to submit comment';
    
    if (error.response?.data) {
      const data = error.response.data;
      if (data.error) errorMessage = data.error;
      else if (data.detail) errorMessage = data.detail;
      else if (data.content) errorMessage = Array.isArray(data.content) ? data.content[0] : data.content;
      else if (typeof data === 'object') {
        const keys = Object.keys(data);
        if (keys.length > 0) {
          const firstKey = keys[0];
          const firstValue = data[firstKey];
          errorMessage = `${firstKey}: ${Array.isArray(firstValue) ? firstValue[0] : firstValue}`;
        }
      }
    }
    
    setError(errorMessage);
    
  } finally {
    if (!isSubmitting) {
      setInternalIsSubmitting(false);
    }
  }
};

  const handleKeyDown = (e) => {
    // Empêcher Enter de soumettre si la liste de mentions est ouverte
    if (showMentionList && e.key === 'Enter') {
      e.preventDefault();
      return;
    }
    
    // Submit on Ctrl+Enter or Cmd+Enter
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter' && !submitting) {
      handleSubmit(e);
    }
    
    // Cancel on Escape
    if (e.key === 'Escape' && onCancel) {
      onCancel();
    }
  };

  const handleTextareaChange = (e) => {
    setContent(e.target.value);
    if (error) {
      setError('');
    }
  };

  const isUserLoggedIn = () => {
    return !!localStorage.getItem('token');
  };

  const canSubmit = () => {
    if (!isUserLoggedIn()) return false;
    if (submitting) return false;
    
    const hasText = content && content.trim().length > 0;
    const hasNewMedia = image || video || file;
    const hasExistingMedia = initialImage || initialVideo || initialFile;
    const isDeletingMedia = mediaToDelete.image || mediaToDelete.video || mediaToDelete.file;
    
    console.log('🔍 canSubmit check:', {
      hasText,
      hasNewMedia,
      hasExistingMedia,
      isDeletingMedia,
      isEditing,
      content: `"${content}"`,
      contentLength: content ? content.trim().length : 0
    });
    
    // 🔥 EN MODE ÉDITION - LOGIQUE SPÉCIALE
    if (isEditing) {
      console.log('📝 Edit mode validation...');
      
      // Calculer si on supprime TOUS les médias existants
      const isDeletingAllExistingMedia = 
        (initialImage && mediaToDelete.image) &&
        (initialVideo && mediaToDelete.video) &&
        (initialFile && mediaToDelete.file);
      
      // Calculer si on a un média existant qui n'est PAS supprimé
      const hasKeptExistingMedia = 
        (initialImage && !mediaToDelete.image) ||
        (initialVideo && !mediaToDelete.video) ||
        (initialFile && !mediaToDelete.file);
      
      console.log('📊 Media status:', {
        isDeletingAllExistingMedia,
        hasKeptExistingMedia,
        initialImage: initialImage ? 'exists' : 'none',
        deleteImage: mediaToDelete.image,
        initialVideo: initialVideo ? 'exists' : 'none',
        deleteVideo: mediaToDelete.video,
        initialFile: initialFile ? 'exists' : 'none',
        deleteFile: mediaToDelete.file
      });
      
      // 🔥 SCÉNARIO 1: On supprime TOUS les médias existants ET on n'ajoute AUCUN nouveau média ET on n'a PAS de texte
      // → INTERDIT: Le commentaire deviendrait complètement vide
      if (isDeletingAllExistingMedia && !hasNewMedia && !hasText) {
        console.log('❌ Cannot submit: Deleting all media, no new media, and no text');
        return false;
      }
      
      // 🔥 SCÉNARIO 2: Pas de média existant au départ, pas de nouveau média, pas de texte
      // → INTERDIT: Le commentaire serait vide
      if (!hasExistingMedia && !hasNewMedia && !hasText) {
        console.log('❌ Cannot submit: No existing media, no new media, and no text');
        return false;
      }
      
      // 🔥 SCÉNARIO 3: On garde AU MOINS un média existant → OK
      if (hasKeptExistingMedia) {
        console.log('✅ Can submit: Has kept at least one existing media');
        return true;
      }
      
      // 🔥 SCÉNARIO 4: On ajoute un nouveau média → OK
      if (hasNewMedia) {
        console.log('✅ Can submit: Has new media');
        return true;
      }
      
      // 🔥 SCÉNARIO 5: On a du texte → OK
      if (hasText) {
        console.log('✅ Can submit: Has text');
        return true;
      }
      
      // 🔥 SCÉNARIO 6: On supprime un média MAIS on a du texte → OK
      if (isDeletingMedia && hasText) {
        console.log('✅ Can submit: Deleting media but has text');
        return true;
      }
      
      // 🔥 SCÉNARIO 7: On supprime un média MAIS on ajoute un nouveau média → OK
      if (isDeletingMedia && hasNewMedia) {
        console.log('✅ Can submit: Deleting media but adding new media');
        return true;
      }
      
      // Tous les autres cas → PAS OK
      console.log('❌ Cannot submit: No valid content after all checks');
      return false;
    }
    
    // 🔥 EN MODE CRÉATION - LOGIQUE SIMPLE
    console.log('📝 Creation mode validation...');
    
    // Doit avoir soit du texte, soit un média
    const canSubmitCreation = hasText || hasNewMedia;
    
    console.log(canSubmitCreation ? '✅ Can submit creation' : '❌ Cannot submit creation');
    return canSubmitCreation;
  };

  const getPlaceholderText = () => {
    if (!isUserLoggedIn()) {
      return "Please login to post a comment...";
    }
    return placeholder;
  };

  const getSubmitButtonText = () => {
    if (submitting) {
      if (isEditing) return 'Updating...';
      if (isReply) return 'Replying...';
      return 'Posting...';
    }
    
    if (!isUserLoggedIn()) {
      return "Login to Comment";
    }
    
    if (isEditing) {
      return 'Update Comment';
    }
    
    if (isReply) {
      return 'Post Reply';
    }
    
    return 'Post Comment';
  };

  // Rendu des médias existants en mode édition
  const renderExistingMedia = () => {
    if (!isEditing) return null;
    
    const hasExistingMedia = initialImage || initialVideo || initialFile;
    if (!hasExistingMedia) return null;
    
    return (
      <div className="existing-media-section">
        <div className="existing-media-label">Current media:</div>
        
        {initialImage && !mediaToDelete.image && (
          <div className="media-preview-item existing">
            <div className="media-preview-header">
              <span className="media-type-badge">Image</span>
              <button 
                type="button"
                onClick={() => removeMedia('image')}
                className="remove-media-btn-comment"
                title="Remove this image"
              >
                <FaTimes />
              </button>
            </div>
            <img src={initialImage} alt="Current" className="existing-media-preview" />
          </div>
        )}
        
        {initialVideo && !mediaToDelete.video && (
          <div className="media-preview-item existing">
            <div className="media-preview-header">
              <span className="media-type-badge">Video</span>
              <button 
                type="button"
                onClick={() => removeMedia('video')}
                className="remove-media-btn-comment"
                title="Remove this video"
              >
                <FaTimes />
              </button>
            </div>
            <video src={initialVideo} muted autoPlay
  loop
  playsInline className="existing-media-preview" />
          </div>
        )}
        
        {initialFile && !initialImage && !initialVideo && !mediaToDelete.file && (
          <div className="file-preview existing">
            <div className="file-preview-header">
              <FaFile className="file-icon" />
              <span className="file-name">
                {initialFile.split('/').pop() || 'Attached file'}
              </span>
              <button 
                type="button"
                onClick={() => removeMedia('file')}
                className="remove-media-btn-comment"
                title="Remove this file"
              >
                <FaTimes />
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  // Rendu des nouveaux médias uploadés
  const renderNewMedia = () => {
    const hasNewMedia = previewImage || previewVideo || (file && !initialFile);
    if (!hasNewMedia) return null;
    
    return (
      <div className="new-media-section">
        <div className="new-media-label">New media to upload:</div>
        
        {previewImage && (
          <div className="media-preview-item new">
            <div className="media-preview-header">
              <span className="media-type-badge new">New Image</span>
              <button 
                type="button"
                onClick={() => removeMedia('image')}
                className="remove-media-btn-comment"
                title="Remove this image"
              >
                <FaTimes />
              </button>
            </div>
            <img src={previewImage} alt="Preview" className="new-media-preview" />
          </div>
        )}
        
        {previewVideo && (
          <div className="media-preview-item new">
            <div className="media-preview-header">
              <span className="media-type-badge new">New Video</span>
              <button 
                type="button"
                onClick={() => removeMedia('video')}
                className="remove-media-btn-comment"
                title="Remove this video"
              >
                <FaTimes />
              </button>
            </div>
            <video src={previewVideo} autoPlay muted
  loop
  playsInline  className="new-media-preview" />
          </div>
        )}
        
        {file && file instanceof File && !previewImage && !previewVideo && (
          <div className="file-preview new">
            <div className="file-preview-header">
              <FaFile className="file-icon" />
              <span className="file-name">{file.name}</span>
              <button 
                type="button"
                onClick={() => removeMedia('file')}
                className="remove-media-btn-comment"
                title="Remove this file"
              >
                <FaTimes />
              </button>
            </div>
            <div className="file-size">({Math.round(file.size / 1024)} KB)</div>
          </div>
        )}
      </div>
    );
  };

  // 🔥 Rendu de la liste des mentions
  const renderMentionList = () => {
    if (!showMentionList) return null;
    
    return (
      <div 
        ref={mentionListRef}
        className="mention-list"

      >
        <div className="mention-list-header">
          <FaSearch className="search-icon" />
          <span className="mention-search-text">
            {mentionSearch ? `Searching for: ${mentionSearch}` : 'Type to search users...'}
          </span>
          <span className="mention-count">
            {filteredUsers.length} {filteredUsers.length === 1 ? 'user' : 'users'}
          </span>
        </div>
        
        <div className="mention-list-content">
          {isLoadingUsers ? (
            <div className="loading-mentions">
              <div className="spinner-small"></div>
              Loading users...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="no-users-found">
              <FaUser className="no-users-icon" />
              <span>No users found "{mentionSearch}"</span>
            </div>
          ) : (
           filteredUsers.map((user, index) => (
    <MentionUserItem
      key={user.id}
      user={user}
      isSelected={index === selectedUserIndex}
      onClick={() => insertMention(user)}
      onMouseEnter={() => setSelectedUserIndex(index)}
    />
  ))
          )}
        </div>
        
        <div className="mention-list-footer">
          <span className="mention-help-text">
            ↑↓ to navigate • Enter/Tab to select • Esc to close
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="comment-form-wrapper">
      <form className="comment-form" onSubmit={handleSubmit} encType="multipart/form-data">
        {error && (
          <div className="comment-form-error">
            <div className="error-content">
              <span className="error-icon">⚠️</span>
              <span className="error-text">{error}</span>
            </div>
            <button 
              type="button"
              className="error-close-btn"
              onClick={() => setError('')}
            >
              <FaTimes />
            </button>
          </div>
        )}

        <div className="comment-form-input">
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            placeholder={getPlaceholderText()}
            rows="3"
            disabled={submitting || !isUserLoggedIn()}
            className={!isUserLoggedIn() ? 'disabled' : ''}
          />
          
          {/* 🔥 Aperçu des mentions en temps réel */}
{/*
          {content && (
            <div className="mention-preview">
              <div className="preview-label">Preview:</div>
              <div className="preview-content">
                <UserMentionRenderer
                  text={content}
                  users={users}
                  currentUserId={currentUser?.id}
                  onMentionClick={handleMentionClick}
                  className="mention-preview-text"
                />
              </div>
            </div>
          )}
*/}
        </div>
        
        {/* 🔥 Liste des mentions (pour la saisie) */}
        {renderMentionList()}
        
        {/* Médias existants (mode édition seulement) */}
        {renderExistingMedia()}
        
        {/* Nouveaux médias uploadés */}
        {renderNewMedia()}
        
        <div className="comment-form-footer">
          <div className="comment-form-actions">
            {isUserLoggedIn() && (
              <>
                <button 
                  type="button"
                  onClick={() => imageInputRef.current?.click()}
                  className={`comment-form-action-btn ${submitting ? 'disabled' : ''}`}
                  title="Add image"
                  disabled={submitting}
                >
                  <FaImage />
                  <input
                    type="file"
                    ref={imageInputRef}
                    onChange={handleImageChange}
                    accept="image/*"
                    className="hidden-input"
                    disabled={submitting}
                  />
                </button>
                
                <button 
                  type="button"
                  onClick={() => videoInputRef.current?.click()}
                  className={`comment-form-action-btn ${submitting ? 'disabled' : ''}`}
                  title="Add video"
                  disabled={submitting}
                >
                  <FaVideo />
                  <input
                    type="file"
                    ref={videoInputRef}
                    onChange={handleVideoChange}
                    accept="video/*"
                    className="hidden-input"
                    disabled={submitting}
                  />
                </button>
                
                <button 
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className={`comment-form-action-btn ${submitting ? 'disabled' : ''}`}
                  title="Add file"
                  disabled={submitting}
                >
                  <FaFile />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    className="hidden-input"
                    disabled={submitting}
                  />
                </button>
         <div className="emoji-picker-wrapper">
    <button 
      type="button"
      className={`comment-form-action-btn ${submitting ? 'disabled' : ''} ${showEmojiPicker ? 'active' : ''} emoji-sticker`}
      title="Add emoji"
      onClick={() => setShowEmojiPicker(!showEmojiPicker)}
      disabled={submitting}
    >
      {showEmojiPicker ? <FaTimes /> : <FaSmile />}
    </button>
    
    {showEmojiPicker && (
      <div className="emoji-picker-popup">
        <EmojiPicker
          onEmojiClick={(emojiData) => {
            setContent(prev => prev + emojiData.emoji);
            if (textareaRef.current) {
              textareaRef.current.focus();
            }
          }}
          autoFocusSearch={false}
          skinTonesDisabled
          searchDisabled={false}
          previewConfig={{
            showPreview: false
          }}
          width="300px"
          height="350px"
        />
      </div>
    )}
  </div>
                
                <button 
                  type="button"
                  className={`comment-form-action-btn ${submitting ? 'disabled' : ''}`}
                  title="Mention user"
                  onClick={() => {
                    const newText = content + '@';
                    setContent(newText);
                    if (textareaRef.current) {
                      textareaRef.current.focus();
                      // Positionner le curseur après le @
                      setTimeout(() => {
                        textareaRef.current.setSelectionRange(newText.length, newText.length);
                      }, 0);
                    }
                  }}
                  disabled={submitting}
                >
                  <FaAt />
                </button>
              </>
            )}
          </div>
          
          <div className="comment-form-submit">
            {onCancel && (
              <button
                type="button"
                onClick={onCancel}
                className="comment-form-cancel"
                disabled={submitting}
              >
                Cancel
              </button>
            )}
            
            <button
              type="submit"
              disabled={!canSubmit()}
              title={!isUserLoggedIn() ? "Please login to post a comment" : ""}
              className={`comment-form-submit-btn ${!canSubmit() ? 'disabled' : ''}`}
            >
              {submitting ? (
                <>
                  <span className="spinner"></span>
                  {getSubmitButtonText()}
                </>
              ) : (
                <>
                  <FaPaperPlane className="submit-icon" />
                  {getSubmitButtonText()}
                </>
              )}
            </button>
          </div>
        </div>
        
        {!isUserLoggedIn() && (
          <div className="comment-form-info login-required">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">You need to be logged in to post comments.</span>
          </div>
        )}
      </form>
    </div>
  );
};

export default CommentForm;