import React, { useState, useRef } from 'react';
import { 
  FaEllipsisH, 
  FaShare,
  FaTimes,
  FaCopy,
  FaFacebook,
  FaTwitter,
  FaLinkedin,
  FaWhatsapp,
  FaTelegram,
  FaLink
} from 'react-icons/fa';
import '../../styles/post_detail/modules/share_menu.css'
const ShareMenu = ({ 
  post, 
  onViewPost 
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');
  const shareMenuRef = useRef(null);
  // URL pour le partage
    const handleSharePost = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Post',
        text: post.content?.substring(0, 100) || '',
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      alert('Post link copied to clipboard!');
    }
  };



  return (
    <div className="post-actions">
      {/* Menu de partage */}
      <div className="share-container" ref={shareMenuRef}>
        <button 
          className="download-btn-post-detail"
          onClick={handleSharePost}
        >
          <FaShare />
          <span>Share</span>
        </button>

          </div>
        
    

   
    </div>
  );
};

export default ShareMenu;