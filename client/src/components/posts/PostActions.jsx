import React, { useState, useRef } from 'react';
import { 
  FaEllipsisH, 
  FaShare,
  FaTimes,
  FaCopy,
  FaEye,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaTelegram,
  FaLink
} from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import '../../styles/profile_details/post_actions.css'
import URL from '../../hooks/useUrl';
const PostActions = ({ 
  post, 
  onViewPost 
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const shareMenuRef = useRef(null);
  const navigate = useNavigate();

  // Navigation vers le post avec React Router
  const handleViewPost = () => {
    if (!post || !post.id) {
      console.error('❌ Post ou ID manquant');
      return;
    }

    // Récupérer l'ID utilisateur
   const userId =
  typeof post.user === "object"
    ? post.user.id
    : post.user_id
    ? post.user_id
    : post.user;

if (!userId) {
  console.error("❌ userId manquant dans le post:", post);
  return;
}

    const postId = post.id;

    console.log('🚀 Navigation vers le post:', { userId, postId });
    
    // ✅ CORRECTION: Utiliser navigate() au lieu de window.location.href
      window.location.href = `/user/${userId}/posts/${postId}`;

  };

  // URL pour le partage
  const getPostUrl = () => {
    if (!post || !post.id) return '#';
    const userId = post.user?.id || post.user_id || post.user || null          ;
    return `${window.location.origin}/user/${userId}/posts/${post.id}`;
  };

  const postUrl = getPostUrl();

  // Copier le lien
  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopySuccess('Link copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  // Partage sur les réseaux sociaux
  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post?.title || 'Check this post!')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${post?.title || 'Check this post!'} ${postUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post?.title || 'Check this post!')}`
  };

  const shareOnSocial = (platform) => {
    window.open(shareLinks[platform], 'share', 'width=600,height=400');
    setShowShareMenu(false);
  };

  // Fermer le menu en cliquant dehors
  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (shareMenuRef.current && !shareMenuRef.current.contains(event.target)) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="post-actions-card">
      {/* Menu de partage */}
     
      {/* View Post Button */}
      <button 
        className="action-button-fa"
        onClick={handleViewPost}
        title='view Post '
      >
        <FaEye />
     
      </button>
    </div>
  );
};

export default PostActions;