// UserListPopup.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';


const UserListPopup = ({ users, title, onClose }) => {

  return (
    <div className="popup-overlay" onClick={onClose}>
      <div className="users-popup" onClick={(e) => e.stopPropagation()}>
        <div className="popup-header">
          <h3>{title}</h3>
          <button className="close-popup" onClick={onClose}>×</button>
        </div>
        <div className="users-list">
          {users.length === 0 ? (
            <p className="no-users">No {title.toLowerCase()} found</p>
          ) : (
            users.map(user => (
              <UserListItem key={user.id} user={user} />
            ))
          )}
        </div>
      </div>
    </div>
  );
};

// Sous-composant pour chaque item utilisateur
const UserListItem = ({ user }) => {
      const handleClickProfile = () => {
        window.location.href =  `/profile/${user.id}/`
    }
    const handleAvatarClick = (e) => {
    e.stopPropagation(); // Empêche le déclenchement du click parent
    handleClickProfile();
  };
  return (
    <div className="user-item" onClick={handleClickProfile}>
      <div className=" user-avatar-profile" onClick={handleAvatarClick} >
        {user.image ? (
          <img src={user.image} alt={user.username}  />
        ) : (
          <div className="avatar-placeholder">
            {user.username.charAt(0).toUpperCase()}
          </div>
        )}
      </div>
      <div className="user-infos-profile">
        <h4 className='profile-infos-h4'>
          {user.first_name && user.last_name 
            ? `${user.first_name} ${user.last_name}`
            : user.username
          }
        </h4>
      </div>
      {user.is_following_back && (
        <span className="mutual-badge">Follows you</span>
      )}
    </div>
  );
};

export default UserListPopup;