import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/main//main.css';
import {
  FaFileAlt,
  FaFilePdf,
  FaFileWord,
  FaFileExcel,
  FaFileImage,
  FaFileVideo,
  FaFileAudio,
  FaFileArchive,
} from 'react-icons/fa';
import MediaGallery from './main/media/MediaGallery';
import PostCard from './main/posts/PostCard';
import MediaRenderer from './main/media/MediaRenderer';

const Main = () => {
  const [posts, setPosts] = useState([]);
  const [activeGallery, setActiveGallery] = useState(null);
  const [isMobile, setIsMobile] = useState(false);
  const BASE_URL = 'http://127.0.0.1:8000';

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth <= 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    axios
      .get(`${BASE_URL}/api/main/`)
      .then((response) => {
        const postsWithInteractions = response.data.posts.map((post) => ({
          ...post,
          isLiked: false,
          likesCount: Math.floor(Math.random() * 50),
          showComments: false,
          comments: [],
          newComment: '',
          expanded: false,
          showAllMedia: false,
          user_rating: post.user_rating || null,
          average_rating: post.average_rating || 0,
          total_ratings: post.total_ratings || 0
        }));
        setPosts(postsWithInteractions);
      })
      .catch((error) => {
        console.error('Error loading posts:', error);
      });
  }, []);

  // File icon utility function
  const getFileIcon = (fileUrl) => {
    if (!fileUrl) return <FaFileAlt color="#6c757d" />;
    const extension = fileUrl.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension))
      return <FaFileImage color="#ff9800" />;
    if (['mp4', 'mov', 'avi', 'mkv'].includes(extension))
      return <FaFileVideo color="#03a9f4" />;
    if (['mp3', 'wav', 'ogg'].includes(extension))
      return <FaFileAudio color="#8bc34a" />;
    if (['pdf'].includes(extension)) return <FaFilePdf color="#e53935" />;
    if (['doc', 'docx'].includes(extension))
      return <FaFileWord color="#2196f3" />;
    if (['xls', 'xlsx'].includes(extension))
      return <FaFileExcel color="#4caf50" />;
    if (['zip', 'rar', '7z'].includes(extension))
      return <FaFileArchive color="#ffb300" />;
    return <FaFileAlt color="#6c757d" />;
  };

  // Event handlers
const handleRatingUpdate = (postId, ratingData) => {
  setPosts(posts.map((post) =>
    post.id === postId
      ? {
          ...post,
          user_rating: ratingData.userRating > 0 ? { 
            stars: ratingData.userRating 
          } : null, // ✅ Important : null si suppression
          average_rating: ratingData.averageRating,
          total_ratings: ratingData.totalRatings
        }
      : post
  ));
};

  const toggleExpand = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, expanded: !post.expanded } : post
    ));
  };

  const toggleShowAllMedia = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, showAllMedia: !post.showAllMedia } : post
    ));
  };

  const openGallery = (postId, files, startIndex = 0) => {
    setActiveGallery({ postId, files, startIndex });
  };

  const closeGallery = () => {
    setActiveGallery(null);
  };

  const handleThumbnailClick = (postId, files, clickedIndex) => {
    openGallery(postId, files, clickedIndex);
  };

  const handleLike = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId
        ? { ...post, like: !post.like }
        : post
    ));
  };

  const toggleComments = (postId) => {
    setPosts(posts.map((post) =>
      post.id === postId
        ? { ...post, showComments: !post.showComments }
        : post
    ));
  };

  const handleAddComment = (postId, e) => {
    e.preventDefault();
    const post = posts.find((p) => p.id === postId);
    if (post && post.newComment.trim()) {
      const newComment = {
        id: Date.now(),
        user: { username: 'You', avatar: '👤' },
        text: post.newComment,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      };

      setPosts(
        posts.map((p) =>
          p.id === postId
            ? { ...p, comments: [...p.comments, newComment], newComment: '' }
            : p
        )
      );
    }
  };

  const handleCommentChange = (postId, value) => {
    setPosts(posts.map((post) =>
      post.id === postId ? { ...post, newComment: value } : post
    ));
  };

  const renderFile = (fileUrl) => (
    <MediaRenderer 
      fileUrl={fileUrl} 
      baseUrl={BASE_URL}
      getFileIcon={getFileIcon}
    />
  );

  return (
    <div className="main-div">
      {activeGallery && (
        <MediaGallery 
          files={activeGallery.files} 
          onClose={closeGallery}
          renderFile={renderFile}
          startIndex={activeGallery.startIndex}
        />
      )}
      
      {posts.length === 0 ? (
        <p className="no-posts">No posts at the moment.</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            post={post}
            isMobile={isMobile}
            onToggleExpand={toggleExpand}
            onToggleShowAllMedia={toggleShowAllMedia}
            onThumbnailClick={handleThumbnailClick}
            onOpenGallery={openGallery}
            onLike={handleLike}
            onToggleComments={toggleComments}
            onAddComment={handleAddComment}
            onCommentChange={handleCommentChange}
            onRatingUpdate={handleRatingUpdate}
            getFileIcon={getFileIcon}
            baseUrl={BASE_URL}
          />
        ))
      )}
    </div>
  );
};

export default Main;