import React from 'react';

const PostHeader = ({ post }) => {
  return (
    <div className="post-header">
      <div className="user-info-container">
        <div className="user-avatar">👨‍💻</div>
        <div className="user-details">
          <p className="username">@{post.user.username}</p>
          <p className="post-time">
            {new Date(post.created_at).toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default PostHeader;