// components/post/PostMenu.jsx - Version avec BoostButton
import React, { useState, useRef, useEffect } from 'react';
import { 
  FaEllipsisV, FaEdit, FaTrash, FaFlag, FaShare, 
  FaUser, FaRocket, FaFire, FaCrown 
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import ConfirmationModal from '../shared/ConfirmationModal';
import { Download, TrendingUp, Zap } from 'lucide-react';
import DownloadMediaModal from './main_post/category/software/DownloadManager';
import ReportButton from '../reports/ReportButton';
import BoostPostDialog from './boosts/boostPost';// Import du nouveau composant
import '../../styles/main/post-menu.css';
import axiosAuth from 'axios';
import URL from '../../hooks/useUrl';
const PostMenu = ({ 
  post, 
  currentUser, 
  onEdit, 
  onDelete, 
  onReport,
  onShare,
  onClose,
  isOpen,
  isInstall,
  mediaList,
  isLoading,
  onBoostSuccess // Nouvelle prop pour le callback après boost
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showCustomReportModal, setShowCustomReportModal] = useState(false);
  const [showBoostDialog, setShowBoostDialog] = useState(false); // État pour le dialog boost
  const [reportReason, setReportReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isBoostLoading, setIsBoostLoading] = useState(false); // Loading pour le boost
  const menuRef = useRef(null);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const navigate = useNavigate();

  // Vérifier si le post est déjà boosté
  const isPostBoosted = () => {
    return   post?.is_boosted === true;
  };

  // Vérifier si l'utilisateur peut booster
  const canBoost = () => {
    // Seul l'auteur du post peut le booster
    const isAuthor = isCurrentUserPostAuthor();
    
    // Vérifier si le post n'est pas déjà boosté ou si le boost est expiré
    const isAlreadyBoosted = isPostBoosted();
    
    return isAuthor && !isAlreadyBoosted;
  };

  // Fonction pour obtenir l'icône de boost selon le niveau
  const getBoostIcon = () => {
    if (!post?.sponsored_type) return <FaRocket />;
    
    switch(post.sponsored_type) {
      case 'standard':
        return <TrendingUp size={16} />;
      case 'premium':
        return <Zap size={16} />;
      case 'featured':
        return <FaCrown />;
      case 'spotlight':
        return <FaFire />;
      default:
        return <FaRocket />;
    }
  };

  // Fonction pour obtenir le texte de boost
  const getBoostText = () => {
    if (isPostBoosted()) {
      const type = post?.is_boosted || 'boosted';
      const daysLeft = post?.sponsored_days_left || 0;
      
      if (daysLeft > 0) {
        return `Boosted (${type}) - ${daysLeft}d left`;
      }
      return `Boosted (${type})`;
    }
    return 'Boost Post';
  };

  // Fonction pour obtenir la classe CSS selon le niveau de boost
  const getBoostClass = () => {
    if (isPostBoosted()) {
      const type = post?.sponsored_type;
      switch(type) {
        case 'standard':
          return 'boost-item standard-boost';
        case 'premium':
          return 'boost-item premium-boost';
        case 'featured':
          return 'boost-item featured-boost';
        case 'spotlight':
          return 'boost-item spotlight-boost';
        default:
          return 'boost-item';
      }
    }
    return 'boost-item';
  };

  // Fonction pour ouvrir le dialog de boost
  const handleBoostClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (!canBoost()) {
      if (!isCurrentUserPostAuthor()) {
        alert("Only the post author can boost this post");
      } else if (isPostBoosted()) {
        alert("This post is already boosted");
      }
      return;
    }
    
    setShowBoostDialog(true);
  };

  // Fonction de callback après un boost réussi
  const handleBoostSuccess = () => {
    console.log('Post boosted successfully!');
    setShowBoostDialog(false);
    
    // Mettre à jour l'état local du post
    if (post) {
      post.is_sponsored = true;
      post.sponsored_type = 'standard'; // À adapter selon le package choisi
    }
    
    // Appeler le callback parent si fourni
    if (onBoostSuccess) {
      onBoostSuccess(post);
    }
    
    // Optionnel: Rafraîchir les données du post
    // fetchPostData();
    
    alert('🎉 Your post has been successfully boosted! It will now appear more prominently in feeds.');
  };

  // Fonction pour vérifier si l'utilisateur est l'auteur du post
  const isCurrentUserPostAuthor = () => {
    if (post?.is_owner !== undefined) {
      return post.is_owner;
    }
    
    if (!currentUser || !post) return false;
    
    const currentUserId = currentUser.id;
    const postUserId = post.user_id || post.user?.id;
    
    return currentUserId && postUserId && currentUserId == postUserId;
  };

  const canEdit = () => {
    const isAuthor = isCurrentUserPostAuthor();
    
    if (post?.user_can_edit !== undefined) {
      if (!post.user_can_edit) return false;
      return isAuthor;
    }
    
    return isAuthor;
  };

  const canDelete = () => {
    const isAuthor = isCurrentUserPostAuthor();
    
    if (post?.user_can_delete !== undefined) {
      if (!post.user_can_delete) return false;
      return isAuthor;
    }
    
    return isAuthor;
  };

  const canReport = () => {
    return !isCurrentUserPostAuthor();
  };

  const handleMenuToggle = (e) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleEdit = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (!canEdit()) {
      alert("You don't have permission to edit this post");
      return;
    }
    
    if (onEdit) {
      onEdit(post);
    } else {
      navigate(`/posts/${post.id}/edit`);
    }
  };

  const handleDeleteClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (!canDelete()) {
      alert("You don't have permission to delete this post");
      return;
    }
    
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!canDelete()) {
      alert("You don't have permission to delete this post");
      setShowDeleteModal(false);
      return;
    }
    
    try {
      if (onDelete) {
        await axiosAuth.delete(`${URL}/post/posts/${post.id}/`);
      }
    } catch (error) {
      console.error('Error deleting post:', error);
      alert('Failed to delete post. Please try again.');
    } finally {
      setShowDeleteModal(false);
      window.location.href=('/posts/')  
    }
  };

  const handleReportClick = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (!canReport()) {
      alert("You cannot report your own post");
      return;
    }
    
    setShowCustomReportModal(true);
  };

  const handleCustomReportSubmit = async () => {
    if (!reportReason.trim()) {
      alert("Please provide a reason for reporting");
      return;
    }
    
    if (!canReport()) {
      alert("You cannot report your own post");
      setShowCustomReportModal(false);
      return;
    }
    
    setIsSubmitting(true);
    try {
      if (onReport) {
        await onReport(post, reportReason);
        alert('Post reported successfully');
        setShowCustomReportModal(false);
        setReportReason('');
      }
    } catch (error) {
      console.error('Error reporting post:', error);
      alert('Failed to report post. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReportSuccess = (reportType = null) => {
    console.log(`Post ${post.id} reported successfully. Type: ${reportType}`);
    setIsMenuOpen(false);
    alert('Thank you for your report. Our moderation team will review this content.');
    
    if (onReport) {
      onReport(post, reportType || 'Reported via new system');
    }
  };

  const handleShare = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    if (onShare) {
      onShare(post);
    } else {
      if (navigator.share) {
        navigator.share({
          title: post.title || 'Post',
          text: post.content?.substring(0, 100) || '',
          url: `${window.location.origin}/user/${post.user_profile_id}/posts/${post.id}`,
        });
      } else {
        navigator.clipboard.writeText(`${window.location.origin}/user/${post.user_profile_id}/posts/${post.id}`);
        alert('Post link copied to clipboard!');
      }
    }
  };

  const handleViewProfile = (e) => {
    e.stopPropagation();
    setIsMenuOpen(false);
    
    const userId = post.user_id || post.user?.id || post.author?.id;
    if (userId) {
      navigate(`/profile/${userId}`);
    } else {
      alert('Could not find user profile');
    }
  };
useEffect(() => {
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      setIsMenuOpen(false);
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => {
    document.removeEventListener("keydown", handleKeyDown);
  };
}, []);


  return (
    <>
      <div className="post-menu-container" ref={menuRef}>
        {/* Bouton des trois points */}
        <button 
          className="post-menu-toggle"
          onClick={handleMenuToggle}
          aria-label="Post options"
          aria-expanded={isMenuOpen}
        >
          <FaEllipsisV />
        </button>

        {/* Menu contextuel */}
        {isMenuOpen && (
          <div className="post-menu-dropdown">
            {/* Options pour l'auteur et admins */}
            {(canEdit() || canDelete()) && (
              <>
                {canEdit() && (
                  <button 
                    className="menu-item edit-item"
                    onClick={handleEdit}
                  >
                    <FaEdit className="menu-icon" />
                    <span>Edit Post</span>
                  </button>
                )}
                
                {canDelete() && (
                  <button 
                    className="menu-item delete-item"
                    onClick={handleDeleteClick}
                  >
                    <FaTrash className="menu-icon" />
                    <span>Delete Post</span>
                  </button>
                )}
              </>
            )}

            {/* Bouton de Boost */}
            {(canBoost() || isPostBoosted()) && (
              <button 
                className={getBoostClass()}
                onClick={handleBoostClick}
                disabled={post.is_boosted === true}
              >
                <span className="menu-icon">
                  {isBoostLoading ? (
                    <div className="boost-loading-spinner"></div>
                  ) : (
                    getBoostIcon()
                  )}
                </span>
                <span className="boost-text">
                  {isBoostLoading ? 'Loading...' : getBoostText()}
                </span>
                {isPostBoosted() && (
                  <span className="boost-badge">✓</span>
                )}
              </button>
            )}

            {/* Option de partage (pour tous) */}
            <button 
              className="menu-item share-item"
              onClick={handleShare}
            >
              <FaShare className="menu-icon" />
              <span>Share</span>
            </button>
            
            <button 
              className="download-btn-simple-menu"
              onClick={isInstall}
              disabled={isLoading || mediaList.length === 0}
            >
              <Download size={18} /> Download
            </button>
            
            {/* Report Button */}
            {canReport() && (
              <div className="menu-item report-item" onClick={(e) => e.stopPropagation()}>
                <ReportButton
                  contentType="post"
                  contentId={post.id}
                  contentAuthorId={post.user_id || post.user?.id}
                  contentObject={post}
                  buttonVariant="text"
                  showIcon={false}
                  showText={false}
                  className="w-100 text-start p-0 border-0 bg-transparent"
                  onReported={handleReportSuccess}
                >
                  <FaFlag className="menu-icon" />
                  <span>Report</span>
                </ReportButton>
              </div>
            )}
          </div>
        )}

        {/* Modal de confirmation pour suppression */}
        <ConfirmationModal
          isOpen={showDeleteModal}
          onClose={() => setShowDeleteModal(false)}
          onConfirm={handleDeleteConfirm}
          title="Delete Post"
          message="Are you sure you want to delete this post? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          type="danger"
        />

        {/* Modal de signalement personnalisé */}
        {showCustomReportModal && (
          <div className="modal-overlay" onClick={() => setShowCustomReportModal(false)}>
            <div className="report-modal" onClick={(e) => e.stopPropagation()}>
              <div className="report-modal-header">
                <h3>Report Post</h3>
                <button 
                  className="close-modal"
                  onClick={() => setShowCustomReportModal(false)}
                >
                  ×
                </button>
              </div>
              
              <div className="report-modal-content">
                <p>Please provide a reason for reporting this post:</p>
                
                <div className="report-reasons">
                  <label>
                    <input 
                      type="radio" 
                      name="reason" 
                      value="spam"
                      checked={reportReason === 'spam'}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span>Spam</span>
                  </label>
                  
                  <label>
                    <input 
                      type="radio" 
                      name="reason" 
                      value="inappropriate"
                      checked={reportReason === 'inappropriate'}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span>Inappropriate Content</span>
                  </label>
                  
                  <label>
                    <input 
                      type="radio" 
                      name="reason" 
                      value="harassment"
                      checked={reportReason === 'harassment'}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span>Harassment</span>
                  </label>
                  
                  <label>
                    <input 
                      type="radio" 
                      name="reason" 
                      value="other"
                      checked={reportReason === 'other'}
                      onChange={(e) => setReportReason(e.target.value)}
                    />
                    <span>Other</span>
                  </label>
                </div>
                
                {reportReason === 'other' && (
                  <textarea
                    placeholder="Please specify the reason..."
                    value={reportReason === 'other' ? '' : reportReason}
                    onChange={(e) => setReportReason(e.target.value)}
                    className="report-textarea"
                    rows="3"
                  />
                )}
              </div>
              
              <div className="report-modal-footer">
                <button 
                  className="cancel-btn"
                  onClick={() => {
                    setShowCustomReportModal(false);
                    setReportReason('');
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </button>
                <button 
                  className="submit-btn"
                  onClick={handleCustomReportSubmit}
                  disabled={!reportReason.trim() || isSubmitting}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Dialog de Boost */}
      {showBoostDialog && (
        <BoostPostDialog
          postId={post.id}
          postTitle={post.title}
          isOpen={showBoostDialog}
          onClose={() => setShowBoostDialog(false)}
          onSuccess={handleBoostSuccess}
        />
      )}

      {/* MODAL DOWNLOAD */}
      {isOpen && (
        <DownloadMediaModal
          isOpen={isOpen}
          onClose={onClose}
          post={post}
          URL={URL}
          onDownloadSelected={(selectedItems) => {
            console.log('Downloading selected items:', selectedItems);
          }}
        />
      )}
    </>
  );
};

export default PostMenu;