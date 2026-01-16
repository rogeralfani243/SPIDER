import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { format } from 'date-fns';
import { FaCrown, FaFire, FaThumbtack, FaRegCommentDots } from 'react-icons/fa';
import CommentHeader from './comment/CommentHeader.jsx';
import CommentContent from './comment/CommentContent.jsx';
import CommentFooter from './comment/CommentFooter.jsx';
import CommentReportModal from './comment/CommentReportModal.jsx';
import CommentForm from './CommentForm.jsx';
import CommentReplies from './CommentReplies.jsx';
import '../../styles/comment_post/Comment.css';
import URL from '../../hooks/useUrl.js';
import ConfirmationModal from '../shared/ConfirmationModal.jsx';
import useConfirmation from '../../hooks/useConfirmation.js';
const Comment = ({ 
  comment, 
  postId, 
  onUpdate, 
  onDelete, 
  currentUser, 
  isFirstComment = false, 
  isTrending = false,
  postAuthorId // KEEP THIS FOR BACKUP
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [localCurrentUser, setLocalCurrentUser] = useState(null);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [particles, setParticles] = useState([]);
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    // Confirmation modal hook
  const { confirmationState, askConfirmation, closeConfirmation } = useConfirmation();
  
  // États pour les mentions
  const [mentionedUsers, setMentionedUsers] = useState([]);
  const [userProfiles, setUserProfiles] = useState({});
  
  // Références
  const optionsMenuRef = useRef(null);
  const optionsButtonRef = useRef(null);
  const reportModalRef = useRef(null);
  const heartRef = useRef(null);
  const likeBtnRef = useRef(null);

  // 🔥 DEBUG: Check what fields are coming from backend
  useEffect(() => {
    console.log('🔍 Comment Permission Fields from Backend:', {
      commentId: comment.id,
      // Fields from serializer
      is_owner: comment.is_owner,
      is_post_owner: comment.is_post_owner, // Should come from serializer
      user_can_pin: comment.user_can_pin,   // Should come from serializer
      has_liked: comment.has_liked,
      is_pinned: comment.is_pinned,
      // User info
      commentUserId: comment.user?.id,
      currentUserId: localCurrentUser?.id,
      // Post author info
      postAuthorId,
      // Check if serializer fields exist
      hasIsPostOwnerField: 'is_post_owner' in comment,
      hasUserCanPinField: 'user_can_pin' in comment
    });
  }, [comment, localCurrentUser, postAuthorId]);

  // Get token and current user
  const token = localStorage.getItem("token");
  
  const getCurrentUserFromLocalStorage = () => {
    try {
      const userData = localStorage.getItem('currentUser');
      return userData ? JSON.parse(userData) : null;
    } catch (error) {
      console.error("Error parsing currentUser from localStorage:", error);
      return null;
    }
  };

  useEffect(() => {
    if (currentUser) {
      setLocalCurrentUser(currentUser);
    } else {
      const userFromStorage = getCurrentUserFromLocalStorage();
      if (userFromStorage) {
        setLocalCurrentUser(userFromStorage);
      }
    }
  }, [currentUser]);

  const axiosAuth = axios.create({
    baseURL: URL,
    headers: {
      Authorization: token ? `Token ${token}` : '',
      'Content-Type': 'application/json',
    }
  });

  // 🔥 FONCTIONS POUR LES MENTIONS
  const fetchProfileIdByUsername = async (username) => {
    if (!username || userProfiles[username]) return userProfiles[username];
    
    try {
      const token = localStorage.getItem("token");
      if (!token) return null;
      
      const response = await axios.get(`${URL}/comment/users/profile/by-username/${username}/`, {
        headers: {
          Authorization: token ? `Token ${token}` : '',
        }
      });
      
      if (response.data && response.data.id) {
        const profileInfo = {
          id: response.data.id,
          username: response.data.username,
          full_name: response.data.full_name,
          profile_picture: response.data.profile_picture
        };
        
        setUserProfiles(prev => ({
          ...prev,
          [username]: profileInfo
        }));
        
        return profileInfo;
      }
    } catch (error) {
      console.error(`Error fetching profile for username ${username}:`, error);
    }
    
    return null;
  };

  // Détecter les mentions
  useEffect(() => {
    const extractMentions = (text) => {
      if (!text) return [];
      
      const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
      const mentions = [];
      let match;
      
      while ((match = mentionRegex.exec(text)) !== null) {
        const username = match[1];
        mentions.push({
          username: username,
          index: match.index,
          length: match[0].length
        });
        
        if (!userProfiles[username]) {
          fetchProfileIdByUsername(username);
        }
      }
      
      return mentions;
    };
    
    const mentions = extractMentions(comment.content);
    setMentionedUsers(mentions);
  }, [comment.content, userProfiles]);

  // Fonction pour obtenir l'URL du profil
// Dans Comment.jsx
const getProfileUrl = (userInfo) => {
  if (!userInfo) {
    console.warn('❌ No userInfo provided');
    return '/profile/0';
  }
  
  console.log('🔍 getProfileUrl received:', userInfo);
  
  let profileId = null;
  
  // Essayer dans cet ordre (du plus spécifique au plus général)
  
  // 1. Si userInfo a directement un ID de profil
  if (userInfo.profile_id) {
    profileId = userInfo.profile_id;
    console.log('✅ Using profile_id:', profileId);
  }
  
  // 2. Si userInfo a un objet profile avec ID
  else if (userInfo.profile && userInfo.profile.id) {
    profileId = userInfo.profile.id;
    console.log('✅ Using profile.id:', profileId);
  }
  
  // 3. Si c'est l'ID utilisateur (mais attention, différent de l'ID profil !)
  else if (userInfo.id) {
    // ATTENTION : user.id est souvent différent de profile.id !
    // Vous devriez plutôt utiliser l'API pour convertir user.id en profile.id
    profileId = userInfo.id;
    console.log('⚠️ Using user.id (might be wrong):', profileId);
  }
  
  // 4. Si c'est un username, essayer de trouver le profile
  else if (typeof userInfo === 'string') {
    const cachedProfile = userProfiles[userInfo];
    if (cachedProfile && cachedProfile.id) {
      profileId = cachedProfile.id;
      console.log('✅ Using cached profile for username:', profileId);
    }
  }
  
  console.log('🎯 Final profileId for URL:', profileId);
  
  // Si toujours null, essayez d'appeler l'API pour convertir user_id en profile_id
  if (!profileId && userInfo.id) {
    console.log('🔄 Need to fetch profile ID from user ID:', userInfo.id);

    return '/profile/loading'; // URL temporaire
  }
  
  return `/profile/${profileId || '0'}`;
};
  // Fonction pour obtenir le nom d'affichage
  const getDisplayName = (userInfo) => {
    if (!userInfo) return 'Anonymous';
    
    if (typeof userInfo === 'object') {
      return userInfo.username || userInfo.full_name || 'User';
    }
    
    if (typeof userInfo === 'string') {
      return userInfo;
    }
    
    return 'User';
  };

  // Rendu du contenu avec les mentions
  const renderContentWithMentionsAsync = () => {
    if (!comment.content) return '';
    
    const content = comment.content;
    
    return content.split(/(@[a-zA-Z0-9_.-]+)/g).map((part, idx) => {
      if (part.startsWith('@')) {
        const username = part.substring(1);
        const profileInfo = userProfiles[username];
        const profileUrl = profileInfo ? getProfileUrl(profileInfo) : '';
        
        return (
          <a
            key={idx}
            href={profileUrl}
            className="comment-mention-link"
            title={`View ${username}'s profile`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              window.location.href = profileUrl;
            }}
          >
            @{username}
          </a>
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  // Détecter les clics en dehors
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showOptions && 
          optionsMenuRef.current && 
          optionsButtonRef.current &&
          !optionsMenuRef.current.contains(event.target) &&
          !optionsButtonRef.current.contains(event.target)) {
        setShowOptions(false);
      }
      
      if (showReportModal && 
          reportModalRef.current && 
          !reportModalRef.current.contains(event.target)) {
        setShowReportModal(false);
        setReportReason('');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [showOptions, showReportModal]);

  // Heart animation functions
  const createParticles = () => {
    const newParticles = [];
    const particleCount = 12;
    
    for (let i = 0; i < particleCount; i++) {
      const angle = (i * 360) / particleCount;
      const radius = 30 + Math.random() * 20;
      const tx = radius * Math.cos((angle * Math.PI) / 180);
      const ty = radius * Math.sin((angle * Math.PI) / 180);
      
      newParticles.push({
        id: Date.now() + i,
        tx,
        ty,
        delay: Math.random() * 0.3,
        size: 4 + Math.random() * 4,
        color: `hsl(${340 + Math.random() * 20}, 100%, 65%)`
      });
    }
    
    setParticles(newParticles);
    
    setTimeout(() => {
      setParticles([]);
    }, 800);
  };

  const isLiked = () => {
    if (comment.has_liked !== undefined) {
      return comment.has_liked;
    }
    if (comment.liked !== undefined) {
      return comment.liked;
    }
    return false;
  };

  // Like handler
  const handleLike = async () => {
    if (!token) {
      alert("You must be logged in to like comments");
      return;
    }

    setIsLiking(true);
    
    setLikeAnimation(true);
    createParticles();
    
    try {
      const response = await axiosAuth.post(`/comment/comments/${comment.id}/like/`);

      if (onUpdate) {
        onUpdate({
          ...comment,
          likes_count: response.data.likes_count,
          has_liked: response.data.has_liked !== undefined 
            ? response.data.has_liked 
            : response.data.liked,
          liked: undefined
        });
      }
      
      setTimeout(() => {
        setLikeAnimation(false);
      }, 600);
      
    } catch (error) {
      console.error("Error liking comment:", error);
      alert(error.response?.data?.error || "Error liking comment");
      setLikeAnimation(false);
    } finally {
      setIsLiking(false);
    }
  };

  // 🔥 UPDATED PERMISSION CHECKING FUNCTIONS - USE SERIALIZER FIELDS FIRST
  const isCurrentUserCommentAuthor = () => {
    // Use serializer field first
    if (comment.is_owner !== undefined) {
      return comment.is_owner;
    }
    
    // Fallback
    if (!localCurrentUser?.id) return false;
    
    if (comment.user && comment.user.id === localCurrentUser.id) return true;
    if (comment.user_id === localCurrentUser.id) return true;
    
    return false;
  };

  // CHECK IF CURRENT USER IS POST AUTHOR
  const isCurrentUserPostAuthor = () => {
    // 🔥 FIRST: Try to use serializer field
    if (comment.is_post_owner !== undefined) {
      return comment.is_post_owner;
    }
    
    // 🔥 SECOND: Fallback to prop
    if (!localCurrentUser?.id || !postAuthorId) return false;
    return localCurrentUser.id === postAuthorId;
  };

  const canEdit = () => {
    if (!token) return false;
    
    if (isCurrentUserCommentAuthor()) return true;
    
    if (localCurrentUser?.is_staff || localCurrentUser?.is_superuser) return true;
    
    if (comment.user_can_edit !== undefined) return comment.user_can_edit;
    
    return false;
  };

  const canDelete = () => {
    if (!token) return false;
    
    if (isCurrentUserCommentAuthor()) return true;
    
    if (localCurrentUser?.is_staff || localCurrentUser?.is_superuser) return true;
    
    if (isCurrentUserPostAuthor()) return true; // Post author can delete
    
    if (comment.user_can_delete !== undefined) return comment.user_can_delete;
    
    return false;
  };

  // 🔥 UPDATED PIN PERMISSION - USE SERIALIZER FIELD FIRST
  const canPin = () => {
    // 🔥 FIRST: Try to use serializer field
    if (comment.user_can_pin !== undefined) {
      return comment.user_can_pin;
    }
    
    // 🔥 SECOND: Fallback logic
    if (!token) return false;
    
    if (localCurrentUser?.is_staff || localCurrentUser?.is_superuser) return true;
    
    if (isCurrentUserPostAuthor()) return true; // Post author can pin
    
    return false;
  };

  // Other handlers
  const handleReply = () => {
    if (!token) {
      alert("You must be logged in to reply");
      return;
    }

    if (!showReplies) setShowReplies(true);

    const event = new CustomEvent("openReplyForm", { 
      detail: { commentId: comment.id }
    });
    window.dispatchEvent(event);

    if (window.scrollToReplyForm) {
      window.scrollToReplyForm(comment.id);
    }
  };

  const handleEdit = () => {
    if (!canEdit()) {
      alert("You do not have permission to edit this comment");
      return;
    }
    setIsEditing(true);
    setShowOptions(false);
  };

  const handleEditSubmit = async (updatedData) => {
    if (!token) {
      alert("You must be logged in to edit a comment");
      return;
    }

    if (!canEdit()) {
      alert("You do not have permission to edit this comment");
      return;
    }

    try {
      const response = await axiosAuth.put(`/comment/comments/${comment.id}/`, updatedData);

      if (onUpdate) onUpdate(response.data);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating comment:", error);
      if (error.response?.status === 403) {
        alert("You don't have permission to edit this comment");
      } else {
        alert(error.response?.data?.error || "Error updating comment");
      }
    }
  };

  const handleDelete = async () => {
    if (!canDelete()) {
      alert("You do not have permission to delete this comment");
      return;
    }

   // Use custom confirmation modal
      const confirmed = await askConfirmation({
        title: "Delete Review",
        message: "Are you sure you want to delete this review? This action cannot be undone.",
        type: "danger",
        confirmText: "Delete",
        cancelText: "Cancel"
      });

      if (!confirmed) return;
    try {
      await axiosAuth.delete(`/comment/comments/${comment.id}/`);

      if (onDelete) onDelete(comment.id);
    } catch (error) {
      console.error("Error deleting comment:", error);
      if (error.response?.status === 403) {
        alert("You don't have permission to delete this comment");
      } else {
        alert(error.response?.data?.error || "Error deleting comment");
      }
    }
  };

  // 🔥 UPDATED PIN HANDLER WITH BETTER FEEDBACK
  const handlePin = async () => {
    if (!canPin()) {
      alert("You do not have permission to pin this comment. Only post authors and admins can pin comments.");
      return;
    }

    try {
      console.log(`📌 ${comment.is_pinned ? 'Unpinning' : 'Pinning'} comment ${comment.id}`);
      
      const response = await axiosAuth.post(`/comment/comments/${comment.id}/pin/`);
      
      console.log('✅ Pin response:', response.data);
      
      if (onUpdate) {
        onUpdate({
          ...comment,
          is_pinned: !comment.is_pinned
        });
      }
      setShowOptions(false);
      
      // Show feedback
      alert(`Comment ${comment.is_pinned ? 'unpinned' : 'pinned'} successfully!`);
    } catch (error) {
      console.error('❌ Error pinning comment:', error);
      
      if (error.response?.status === 403) {
        alert("You do not have permission to pin this comment. Only post authors and admins can pin comments.");
      } else {
        alert(error.response?.data?.error || "Error pinning comment. Please try again.");
      }
    }
  };

  const handleReport = (reportType = null) => {
    console.log(`Post ${comment.id} reported successfully. Type: ${reportType}`);
    setIsMenuOpen(false); // Fermer le menu après signalement
    
    // Optionnel: Afficher une notification
    alert('Thank you for your report. Our moderation team will review this content.');
    
    // Optionnel: Appeler l'ancienne fonction onReport si fournie
   
  };
  const handleReportSubmit = async () => {
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting");
      return;
    }

    setIsReporting(true);
    try {
      await axiosAuth.post(`/comment/comments/${comment.id}/report/`, {
        reason: reportReason
      });

      alert("Comment reported successfully");
      setShowReportModal(false);
      setReportReason('');
      
      if (onUpdate) {
        onUpdate({
          ...comment,
          reported: true
        });
      }
    } catch (error) {
      console.error("Error reporting comment:", error);
      alert(error.response?.data?.error || "Error reporting comment");
    } finally {
      setIsReporting(false);
    }
  };

  const formatDate = (dateString) => {
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diff = (now - date) / (1000 * 60 * 60);

      if (diff < 1) {
        const mins = diff * 60;
        return mins < 1 ? "Just now" : `${Math.floor(mins)}m ago`;
      }
      if (diff < 24) return `${Math.floor(diff)}h ago`;
      if (diff < 168) return `${Math.floor(diff / 24)}d ago`;

      return format(date, "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  // Render mode edit
  if (isEditing) {
    return (
      <div className="comment editing">
        <CommentForm
          postId={postId}
          parentCommentId={comment.parent_comment || comment.id}
          initialContent={comment.content}
          initialImage={comment.image}
          initialVideo={comment.video}
          initialFile={comment.file}
          commentId={comment.id}
          onSubmit={handleEditSubmit}
          onCancel={() => setIsEditing(false)}
          isEditing={true}
        />
      </div>
    );
  }

  // Render normal
  return (
    <div className={`comment ${comment.is_pinned ? "pinned" : ""} ${isTrending ? "trending-highlight" : ""} ${isFirstComment ? "first-highlight" : ""}`}>
      {/* Special badges */}
      {isFirstComment && (
        <div className="comment-special-badge first-comment">
          <FaCrown /> First Comment
        </div>
      )}
      
      {isTrending && (
        <div className="comment-special-badge trending-comment">
          <FaFire /> Trending
        </div>
      )}
      
      {comment.is_pinned && (
        <div className="comment-special-badge pinned-comment">
          <FaThumbtack /> Pinned
        </div>
      )}

      <CommentHeader
        comment={comment}
        localCurrentUser={localCurrentUser}
        formatDate={formatDate}
        getProfileUrl={getProfileUrl}
        getDisplayName={getDisplayName}
        isCurrentUserCommentAuthor={isCurrentUserCommentAuthor()}
        isCurrentUserPostAuthor={isCurrentUserPostAuthor()} // PASS THIS
        optionsButtonRef={optionsButtonRef}
        showOptions={showOptions}
        setShowOptions={setShowOptions}
        optionsMenuRef={optionsMenuRef}
        canEdit={canEdit()}
        canDelete={canDelete()}
        canPin={canPin()} // PASS canPin
        handleEdit={handleEdit}
        handleDelete={handleDelete}
        handlePin={handlePin}
        handleReport={handleReport}
      />

      <CommentContent
        comment={comment}
        renderContentWithMentionsAsync={renderContentWithMentionsAsync}
      />

      <CommentFooter
        isLiked={isLiked()}
        likeAnimation={likeAnimation}
        isLiking={isLiking}
        token={token}
        comment={comment}
        showReplies={showReplies}
        handleLike={handleLike}
        handleReply={handleReply}
        setShowReplies={setShowReplies}
        heartRef={heartRef}
        likeBtnRef={likeBtnRef}
        particles={particles}
      />

      {/* Replies section */}
      {showReplies && (
        <div className="comment-replies-section">
          <div className="replies-header">
            <FaRegCommentDots className="replies-icon" />
            <span className="replies-title">
              {comment.reply_count} {comment.reply_count === 1 ? 'Reply' : 'Replies'}
            </span>
          </div>
          <CommentReplies
            commentId={comment.id}
            postId={postId}
            currentUser={localCurrentUser}
            onReplyUpdate={onUpdate}
            onReplyDelete={onDelete}
            initialReplies={comment.replies || []}
          />
        </div>
      )}

      <CommentReportModal
        showReportModal={showReportModal}
        setShowReportModal={setShowReportModal}
        reportReason={reportReason}
        setReportReason={setReportReason}
        isReporting={isReporting}
        handleReportSubmit={handleReportSubmit}
        reportModalRef={reportModalRef}
      />
       <ConfirmationModal
        isOpen={confirmationState.isOpen}
        onClose={closeConfirmation}
        onConfirm={confirmationState.onConfirm}
        title={confirmationState.title}
        message={confirmationState.message}
        confirmText={confirmationState.confirmText}
        cancelText={confirmationState.cancelText}
        type={confirmationState.type}
      />
    </div>
  );
};

export default Comment;