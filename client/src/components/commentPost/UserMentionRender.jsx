// components/comments/UserMentionRenderer.jsx
import React from 'react';
import { Link } from 'react-router-dom';


/**
 * Composant pour identifier et afficher les mentions @username dans le texte
 * Transforme les @username en liens cliquables vers les profils
 */
const UserMentionRenderer = ({ 
  text, 
  users = [],  // Liste des utilisateurs mentionnés (optionnel pour les infos supplémentaires)
  className = '',
  onMentionClick = null,
  currentUserId = null
}) => {
  if (!text) return null;

  // Regex pour détecter les mentions @username
  const mentionRegex = /@([a-zA-Z0-9_.-]+)/g;
  
  // Si pas d'utilisateurs fournis, créer un tableau simple
  const userMap = {};
  if (users && users.length > 0) {
    users.forEach(user => {
      if (user.username) {
        userMap[user.username.toLowerCase()] = user;
      }
    });
  }

  const parts = [];
  let lastIndex = 0;
  let match;

  // Parcourir le texte pour trouver toutes les mentions
  while ((match = mentionRegex.exec(text)) !== null) {
    const mentionStart = match.index;
    const mentionEnd = mentionRegex.lastIndex;
    const username = match[1];
    const fullMention = match[0]; // "@username"

    // Ajouter le texte avant la mention
    if (mentionStart > lastIndex) {
      parts.push(
        <span key={`text-${lastIndex}`}>
          {text.substring(lastIndex, mentionStart)}
        </span>
      );
    }

    // Vérifier si l'utilisateur existe dans la liste fournie
    const userInfo = userMap[username.toLowerCase()];
    const isCurrentUser = currentUserId && userInfo && userInfo.id === currentUserId;

    // Créer le composant pour la mention
    parts.push(
      <UserMention 
        key={`mention-${mentionStart}`}
        username={username}
        userInfo={userInfo}
        isCurrentUser={isCurrentUser}
        onMentionClick={onMentionClick}
      />
    );

    lastIndex = mentionEnd;
  }

  // Ajouter le texte restant après la dernière mention
  if (lastIndex < text.length) {
    parts.push(
      <span key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </span>
    );
  }

  return (
    <div className={`user-mention-content ${className}`}>
      {parts.length > 0 ? parts : text}
    </div>
  );
};

/**
 * Sous-composant pour une mention individuelle
 */
const UserMention = ({ username, userInfo, isCurrentUser, onMentionClick }) => {
  const handleClick = (e) => {
    e.preventDefault();
    if (onMentionClick) {
      onMentionClick(username, userInfo);
    }
  };

  // Si l'utilisateur existe dans notre base de données
  {/*
    if (userInfo) {
    return (
      <Link
        to={`/user/${userInfo.profile_id}`}
        className={`user-mention ${isCurrentUser ? 'current-user' : ''}`}
        onClick={handleClick}
        title={`Profil de ${userInfo.full_name || username}`}
      >

        <span className="mention-prefix">@</span>
        <span className="mention-username">{username}</span>
        {isCurrentUser && (
          <span className="mention-badge">(vous)</span>
        )}
      </Link>
    );
  }

    */}
  // Si l'utilisateur n'est pas trouvé dans notre base
  return (
    <span 
      className="user-mention unknown-user"
      title={`Utilisateur @${username} non trouvé`}
    >
      <span className="mention-prefix">@</span>
      <span className="mention-username">{username}</span>
    </span>
  );
};

export default UserMentionRenderer;