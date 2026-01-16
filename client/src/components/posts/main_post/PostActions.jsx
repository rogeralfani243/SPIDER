// src/components/posts/main_post/PostActions.jsx
import React, { useState } from 'react';
import URL from '../../../hooks/useUrl';

const PostActions = ({ post, onClose, onUpdate }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Vérifier si l'utilisateur est propriétaire du post
  const isOwner = () => {
    const user_id = localStorage.getItem('user_id');
    return user_id && post.user?.toString() === user_id;
  };

  // Supprimer le post
  const handleDelete = async () => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer ce post ?')) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const csrfToken = document.cookie
        .split('; ')
        .find(row => row.startsWith('csrftoken='))
        ?.split('=')[1];

      const response = await fetch(`${URL}/post/posts/${post.id}/`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Token ${token}`,
          'X-CSRFToken': csrfToken || '',
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      onClose();
      onUpdate(); // Rafraîchir la liste des posts
      
    } catch (err) {
      setError(err.message);
      console.error('❌ [POST ACTIONS] Delete error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Signaler le post
  const handleReport = () => {
    const reason = prompt('Merci de préciser la raison du signalement :');
    if (reason) {
      alert('Post signalé. Merci pour votre vigilance.');
      onClose();
    }
  };

  // Sauvegarder le post
  const handleSave = async () => {
    // À implémenter si vous avez une fonctionnalité de sauvegarde
    alert('Fonctionnalité de sauvegarde à implémenter');
    onClose();
  };

  // Partager le post
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: post.content.substring(0, 100),
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Lien copié dans le presse-papier !');
    }
    onClose();
  };

  // Éditer le post (ouvrir l'éditeur)
  const handleEdit = () => {
    // Vous devrez implémenter cette fonction selon votre architecture
    alert('Fonctionnalité d\'édition à implémenter');
    onClose();
  };

  return (
    <div className="post-actions-menu" onClick={e => e.stopPropagation()}>
      {error && (
        <div className="action-error">
          <i className="fas fa-exclamation-circle"></i>
          {error}
        </div>
      )}

      <div className="action-list">
        {/* Actions pour tous */}
        <button 
          className="action-item"
          onClick={handleShare}
          disabled={loading}
        >
          <i className="fas fa-share"></i>
          <span>Partager</span>
        </button>

        <button 
          className="action-item"
          onClick={handleSave}
          disabled={loading}
        >
          <i className="far fa-bookmark"></i>
          <span>Sauvegarder</span>
        </button>

        <button 
          className="action-item action-report"
          onClick={handleReport}
          disabled={loading}
        >
          <i className="fas fa-flag"></i>
          <span>Signaler</span>
        </button>

        {/* Actions seulement pour le propriétaire */}
        {isOwner() && (
          <>
            <div className="action-divider"></div>
            
            <button 
              className="action-item action-edit"
              onClick={handleEdit}
              disabled={loading}
            >
              <i className="fas fa-edit"></i>
              <span>Modifier</span>
            </button>

            <button 
              className="action-item action-delete"
              onClick={handleDelete}
              disabled={loading}
            >
              {loading ? (
                <>
                  <i className="fas fa-spinner fa-spin"></i>
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <i className="fas fa-trash"></i>
                  <span>Supprimer</span>
                </>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default PostActions;