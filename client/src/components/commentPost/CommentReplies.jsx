import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Comment from './Comment';
import CommentForm from './CommentForm';
import '../../styles/comment_post/CommentReplies.css';
import URL from '../../hooks/useUrl';

const CommentReplies = ({ 
  commentId, 
  postId, 
  currentUser,
  onReplyUpdate,
  onReplyDelete,
  initialReplies = [],
  showForm = false
}) => {
  const [replies, setReplies] = useState(initialReplies);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [showReplyForm, setShowReplyForm] = useState(showForm);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const perPage = 10;

  useEffect(() => {
    console.log('CommentReplies mounted for comment:', commentId);
    if (initialReplies.length === 0) {
      loadReplies();
    }
  }, [commentId]);

  const loadReplies = async (pageNum = 1) => {
    if (loading) return;
    
    setLoading(true);
    try {
      console.log('Loading replies for comment:', commentId);
      // URL CORRECTE
      const response = await axios.get(`${URL}/comment/comments/${commentId}/replies/`, {
        params: {
          page: pageNum,
          per_page: perPage,
          order: 'created_at'
        }
      });
      
      console.log('Replies API response:', response.data);
      
      const newReplies = response.data.replies || response.data;
      
      if (pageNum === 1) {
        setReplies(newReplies);
      } else {
        setReplies(prev => [...prev, ...newReplies]);
      }
      
      setHasMore(response.data.has_next !== undefined ? response.data.has_next : newReplies.length === perPage);
      setPage(pageNum);
    } catch (error) {
      console.error('Error loading replies:', error);
      console.error('Error details:', error.response?.data);
    } finally {
      setLoading(false);
    }
  };
const handleReplySubmit = async (replyData) => {
  console.log('🚀 CommentReplies: Submitting reply...');
  console.log('📦 Reply data structure:', replyData);
  
  // 🔥 CORRECTION : replyData devrait être l'objet commentaire créé par CommentForm
  // PAS besoin de recréer FormData
  
  setIsSubmitting(true);
  
  try {
    // Vérifier que c'est bien un objet commentaire
    if (!replyData || !replyData.id) {
      console.error('❌ Invalid reply data:', replyData);
      
      // 🔥 OPTION : Si replyData est un objet avec des fichiers, créer FormData
      if (replyData.image || replyData.video || replyData.file) {
        console.log('🔄 replyData has files, creating FormData manually');
        
        const token = localStorage.getItem('token');
        if (!token) {
          alert('You must be logged in to reply');
          setIsSubmitting(false);
          return;
        }
        
        const formData = new FormData();
        formData.append('content', replyData.content || '');
        
        if (replyData.image && replyData.image instanceof File) {
          formData.append('image', replyData.image);
        }
        if (replyData.video && replyData.video instanceof File) {
          formData.append('video', replyData.video);
        }
        if (replyData.file && replyData.file instanceof File) {
          formData.append('file', replyData.file);
        }
        
        const csrfToken = document.cookie
          .split('; ')
          .find(row => row.startsWith('csrftoken='))
          ?.split('=')[1] || '';
        
        const response = await axios.post(
          `${URL}/comment/posts/${postId}/comments/`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Token ${token}`,
              'X-CSRFToken': csrfToken,
            },
            params: {
              parent_comment: commentId
            }
          }
        );
        
        // Utiliser la réponse du serveur
        await processReplyResponse(response.data);
      } else {
        throw new Error('Invalid reply data format');
      }
      
    } else {
      // 🔥 CORRECTION : replyData est déjà l'objet commentaire créé
      console.log('✅ replyData is complete comment object:', replyData);
      
      // Vérifier que c'est bien une réponse à ce commentaire
      if (replyData.parent_comment && replyData.parent_comment.id !== commentId) {
        console.warn('⚠️ Reply is for different parent comment');
      }
      
      await processReplyResponse(replyData);
    }
    
  } catch (error) {
    console.error('❌ Error in handleReplySubmit:', error);
    alert(`❌ Error: ${error.message}`);
  } finally {
    setIsSubmitting(false);
  }
};

// 🔥 FONCTION AIDANTE POUR TRAITER LA RÉPONSE
const processReplyResponse = async (newReply) => {
  console.log('📥 Processing reply response:', newReply);
  
  if (!newReply || !newReply.id) {
    throw new Error('Invalid reply response from server');
  }
  
  // Ajouter la nouvelle réponse à la liste
  setReplies(prev => [newReply, ...prev]);
  setShowReplyForm(false);
  
  // Notifier le parent
  if (onReplyUpdate) {
    onReplyUpdate({
      type: 'increment_reply',
      parentId: commentId
    });
  }
  
  // Recharger les réponses pour être sûr
  setTimeout(() => {
    loadReplies(1);
  }, 500);
};
  const loadMore = () => {
    loadReplies(page + 1);
  };


  const handleReplyUpdate = (updatedReply) => {
    setReplies(prev => 
      prev.map(reply => 
        reply.id === updatedReply.id ? updatedReply : reply
      )
    );
  };

  const handleReplyDelete = (replyId) => {
    setReplies(prev => prev.filter(reply => reply.id !== replyId));
    
    if (onReplyUpdate) {
      onReplyUpdate({ type: 'decrement_reply' });
    }
  };

  const handleToggleReplyForm = () => {
    console.log('🔄 Toggling reply form for comment:', commentId);
    setShowReplyForm(!showReplyForm);
  };

  return (
    <div className="comment-replies">
      {/* Bouton Reply */}
      <div style={{ marginBottom: '15px' }}>
        <button 
          className="show-reply-form-btn"
          onClick={handleToggleReplyForm}
          style={{ 
            border: '2px solid #2196f3',
            backgroundColor: showReplyForm ? '#bbdefb' : '#e3f2fd',
            color: '#0d47a1',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            fontWeight: 'bold',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            transition: 'all 0.3s'
          }}
        >
          {showReplyForm ? (
            <>✕ Cancel Reply</>
          ) : (
            <>↪️ Reply to this comment</>
          )}
        </button>
        
        {showReplyForm && (
          <div style={{ 
            marginTop: '10px', 
            padding: '15px',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px',
            border: '1px solid #dee2e6'
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              marginBottom: '10px',
              color: '#495057',
              fontSize: '14px'
            }}>
              <span style={{ 
                backgroundColor: '#e9ecef', 
                padding: '4px 8px', 
                borderRadius: '4px',
                marginRight: '8px'
              }}>
                ⚡
              </span>
              <span>Replying to comment </span>
            </div>
            
            <CommentForm
              postId={postId}
              parentCommentId={commentId}
              onSubmit={handleReplySubmit}
              onCancel={() => setShowReplyForm(false)}
              placeholder="Write your reply here..."
              autoFocus={true}
              isReply={true}
              isSubmitting={isSubmitting}
            />
          </div>
        )}
      </div>
      
      {/* Liste des réponses */}
      {replies.length > 0 && (
        <div className="replies-list">
          <h5 style={{ 
            margin: '15px 0 10px 0', 
            color: '#666',
            fontSize: '14px',
            fontWeight: '600',
            paddingBottom: '5px',
            borderBottom: '1px solid #eee'
          }}>
            Replies ({replies.length})
          </h5>
          {replies.map(reply => (
            <div key={reply.id} className="reply-item" style={{ marginBottom: '10px' }}>
              <Comment
                comment={reply}
                postId={postId}
                currentUser={currentUser}
                onUpdate={handleReplyUpdate}
                onDelete={handleReplyDelete}
              />
            </div>
          ))}
        </div>
      )}
      
      {/* Chargement */}
      {loading && (
        <div className="replies-loading" style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d'
        }}>
          <div className="spinner" style={{
            display: 'inline-block',
            width: '20px',
            height: '20px',
            border: '2px solid #f3f3f3',
            borderTop: '2px solid #3498db',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            marginRight: '10px'
          }}></div>
          <span>Loading replies...</span>
        </div>
      )}
      
      {/* Bouton pour charger plus */}
      {hasMore && !loading && replies.length > 0 && (
        <button 
          className="load-more-replies-btn"
          onClick={loadMore}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#f8f9fa',
            border: '1px solid #dee2e6',
            borderRadius: '5px',
            color: '#495057',
            cursor: 'pointer',
            marginTop: '10px',
            fontSize: '14px'
          }}
        >
          Load more replies
        </button>
      )}
      
      {/* Aucune réponse */}
      {!loading && replies.length === 0 && !showReplyForm && (
        <div className="no-replies" style={{
          padding: '20px',
          textAlign: 'center',
          color: '#6c757d',
          fontStyle: 'italic',
          backgroundColor: '#f8f9fa',
          borderRadius: '5px',
          marginTop: '10px'
        }}>
          No replies yet. Be the first to reply!
        </div>
      )}
    </div>
  );
};

export default CommentReplies;