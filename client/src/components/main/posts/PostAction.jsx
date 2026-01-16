import React from 'react';
import {  FaShare } from 'react-icons/fa';

const PostActions = ({ post, onLike, onToggleComments }) => {
  return (
    <div className="post-actions">
  
 

      <button className="action-button">
        <FaShare />
        <span>Share</span>
      </button>
    </div>
  );
};

export default PostActions;