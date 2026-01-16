import React from 'react';
import { FaUser } from 'react-icons/fa';

const UserInfo = ({ userName, createdAt }) => {
  // Safe default values
  const safeUserName = userName || 'Unknown User';
  const safeCreatedAt = createdAt ? new Date(createdAt).toLocaleString() : 'Unknown date';

  return (
    <div className="user-info">
      <div className="user-avatar">
        {safeUserName?.charAt(0)?.toUpperCase() || <FaUser />}
      </div>
      <div className="user-details">
        <h3 className="username">@{safeUserName}</h3>
        <p className="post-date">
          {safeCreatedAt}
        </p>
      </div>
    </div>
  );
};

export default UserInfo;