import React from 'react';
import SoftwarePostItem from './SoftwarePostItem.jsx';

const SoftwarePostList = ({ posts, onTagClick, onRate, onDeleteRating }) => {
  const handleTagClick = (tag) => {
    if (onTagClick) {
      onTagClick(tag);
    }
  };

  const handleRate = async (postId, stars) => {
    try {
      await onRate(postId, stars);
      // You might want to refresh the posts list or update local state
    } catch (error) {
      console.error('Error rating post:', error);
      alert('Failed to rate post. Please try again.');
    }
  };

  const handleDeleteRating = async (postId) => {
    try {
      await onDeleteRating(postId);
      // Refresh or update local state
    } catch (error) {
      console.error('Error deleting rating:', error);
      alert('Failed to remove rating. Please try again.');
    }
  };

  if (posts.length === 0) {
    return null;
  }

  return (
    <div className="software-post-list">
      <div className="posts-grid">
        {posts.map(post => (
          <SoftwarePostItem
            key={post.id}
            post={post}
            onTagClick={handleTagClick}
            onRate={handleRate}
            onDeleteRating={handleDeleteRating}
          />
        ))}
      </div>
    </div>
  );
};

export default SoftwarePostList;