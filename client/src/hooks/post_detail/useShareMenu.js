// hooks/post_detail/useShareMenu.js
import { useState } from 'react';

export const useSharing = (userId, postId, post) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copySuccess, setCopySuccess] = useState('');

  console.log('🔄 useSharing hook called with:', { userId, postId, post });

  const postUrl = `${window.location.origin}/user/${userId}/posts/${postId}`;

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
    twitter: `https://twitter.com/intent/tweet?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post?.title || 'Check this post!')}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`,
    whatsapp: `https://wa.me/?text=${encodeURIComponent(`${post?.title || 'Check this post!'} ${postUrl}`)}`,
    telegram: `https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(post?.title || 'Check this post!')}`
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(postUrl);
      setCopySuccess('Link copied!');
      setTimeout(() => setCopySuccess(''), 2000);
    } catch (err) {
      console.error('❌ Failed to copy:', err);
      setCopySuccess('Failed to copy');
      setTimeout(() => setCopySuccess(''), 2000);
    }
  };

  const shareOnSocial = (platform) => {
    console.log('📤 Sharing on:', platform);
    const width = 600, height = 400;
    const left = (window.innerWidth - width) / 2;
    const top = (window.innerHeight - height) / 2;
    
    if (shareLinks[platform]) {
      window.open(shareLinks[platform], 'share', `width=${width},height=${height},left=${left},top=${top}`);
    } else {
      console.error('❌ Unknown platform:', platform);
    }
    setShowShareMenu(false);
  };

  return {
    showShareMenu,
    setShowShareMenu,
    copySuccess,
    shareOnSocial,
    copyToClipboard
  };
};