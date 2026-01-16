import React, { useState, useEffect, useCallback, useMemo, forwardRef } from 'react';
import axios from 'axios';
import Comment from './Comment';
import CommentForm from './CommentForm';
import CommentSorter from './comment/CommentSort';
import PinnedCommentsSection from './comment/PinnedComment';
import RegularCommentsSection from './comment/RegularComment';
import CommentsLoading from './comment/CommentLoading';
import ErrorMessage from './comment/ErrorMessage';
import CommentSectionHeader from './CommentSectionHeader';
import { calculateBadges, sortComments } from './comment/utils/commentsUtils';
import { loadComments } from './comment/utils/commentsApi';
import '../../styles/comment_post/CommentSection.css';
import URL from '../../hooks/useUrl';

const CommentsSection = ({ postId, currentUser, totalComments }) => {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('newest');
  const [showPinned, setShowPinned] = useState(true);
  const [error, setError] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState(null);

  const perPage = 20;

  // Calculate badges
  const { firstCommentId, trendingCommentId } = useMemo(() => 
    calculateBadges(comments), 
  [comments]);

  // Sort comments
  const sortedComments = useMemo(() => 
    sortComments(comments, sortBy), 
  [comments, sortBy]);

  // Separate pinned and regular comments
  const pinnedComments = sortedComments.filter(comment => comment.is_pinned);
  const regularComments = sortedComments.filter(comment => !comment.is_pinned);
  const otherComments = sortedComments.filter(comment => comment.total_replies_count);
  const repliesComments = sortedComments.filter(comment => comment.total_comments_count);

  // Check if there are no comments - DÉPLACÉ APRÈS les déclarations de variables
  const hasNoComments = useMemo(() => 
    !loading && sortedComments.length === 0 && pinnedComments.length === 0,
  [loading, sortedComments, pinnedComments]);

  // Load comments function
  const loadCommentsHandler = useCallback(async (pageNum = 1, reset = false) => {
    const result = await loadComments({
      postId,
      page: pageNum,
      perPage,
      showPinned,
      setLoading,
      setError,
      setComments,
      setHasMore,
      setPage,
      reset
    });
  }, [postId, showPinned, perPage]);

  // Initial load
  useEffect(() => {
    console.log('🚀 CommentsSection mounted for post:', postId);
    loadCommentsHandler(1, true);
  }, [postId, showPinned]);

  // Handle reply scrolling
  useEffect(() => {
    window.scrollToReplyForm = (commentId) => {
      console.log('🎯 scrollToReplyForm called with commentId:', commentId);
      setReplyToCommentId(commentId);
      
      const commentElement = document.getElementById(`comment-${commentId}`);
      if (commentElement) {
        setTimeout(() => {
          commentElement.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'center' 
          });
        }, 100);
      }
    };
    
    return () => {
      delete window.scrollToReplyForm;
    };
  }, []);

  const handleLoadMore = () => {
    loadCommentsHandler(page + 1);
  };

  const handleCommentSubmit = async (newComment) => {
    console.log('✅ CommentsSection: Received new comment:', newComment);
    
    if (!newComment || !newComment.id) {
      console.error('❌ Invalid comment received');
      return;
    }
    
    if (replyToCommentId && newComment.parent_comment === replyToCommentId) {
      console.log(`📌 This is a reply to comment ${replyToCommentId}`);
      
      setComments(prev => {
        const findAndAddReply = (comments) => {
          return comments.map(comment => {
            if (comment.id === replyToCommentId) {
              const updatedReplies = [...(comment.replies || []), newComment];
              return {
                ...comment,
                replies: updatedReplies,
                reply_count: updatedReplies.length
              };
            }
            
            if (comment.replies && comment.replies.length > 0) {
              return {
                ...comment,
                replies: findAndAddReply(comment.replies)
              };
            }
            
            return comment;
          });
        };
        
        return findAndAddReply(prev);
      });
      
      setReplyToCommentId(null);
    } else {
      console.log('📝 Adding new top-level comment');
      setComments(prev => [newComment, ...prev]);
    }
    
    setError('');
  };

  const handleCommentUpdate = (updatedComment) => {
    setComments(prev => 
      prev.map(comment => 
        comment.id === updatedComment.id ? updatedComment : comment
      )
    );
  };

  const handleCommentDelete = (commentId) => {
    setComments(prev => prev.filter(comment => comment.id !== commentId));
  };

  return (
    <div className="comments-section">
      {/* Error Message */}
      <ErrorMessage error={error} onClose={() => setError('')} />
      
      {/* Header */}
      <CommentSectionHeader 
        totalComments={totalComments}
        sortBy={sortBy}
        onSortChange={setSortBy}
        showPinned={showPinned}
        onTogglePinned={() => setShowPinned(!showPinned)}
      />
      
      {/* Main comment form */}
      <div className="main-comment-form">
        <CommentForm
          postId={postId}
          onSubmit={handleCommentSubmit}
          placeholder="Share your thoughts..."
          autoFocus={hasNoComments} // Auto-focus le champ s'il n'y a pas de commentaires
        />
      </div>
      
      {/* Comments list */}
      <div className="comments-list">
        {/* Message "Be the first to comment" */}
        {hasNoComments && (
          <div className="no-comments-message">
            <div className="no-comments-icon">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v10z" />
                <path d="M8 10h8" strokeLinecap="round" />
                <path d="M8 14h4" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="no-comments-title">Be the first to comment</h3>
            <p className="no-comments-subtitle">
              Start the conversation. Your comment could inspire others to join in!
            </p>
            <div className="no-comments-tips">
              <div className="tip">
                <span className="tip-icon">💡</span>
                <span>Share your perspective</span>
              </div>
              <div className="tip">
                <span className="tip-icon">👋</span>
                <span>Ask questions</span>
              </div>
              <div className="tip">
                <span className="tip-icon">✨</span>
                <span>Add value to the discussion</span>
              </div>
            </div>
          </div>
        )}
        
        {/* Pinned comments section */}
        {!hasNoComments && (
          
          <>
            <PinnedCommentsSection 
              showPinned={showPinned}
              pinnedComments={pinnedComments}
              postId={postId}
              currentUser={currentUser}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              firstCommentId={firstCommentId}
              trendingCommentId={trendingCommentId}
            />
            
            {/* Regular comments section */}
            <RegularCommentsSection 
              regularComments={regularComments}
              showPinned={showPinned}
              pinnedComments={pinnedComments}
              onShowPinned={() => setShowPinned(true)}
              postId={postId}
              currentUser={currentUser}
              onUpdate={handleCommentUpdate}
              onDelete={handleCommentDelete}
              firstCommentId={firstCommentId}
              trendingCommentId={trendingCommentId}
            />
          </>
        )}
      </div>
      
      {/* Loading */}
      <CommentsLoading loading={loading} />
      
      {/* Load More button - seulement s'il y a des commentaires */}
      {!hasNoComments && hasMore && !loading && sortedComments.length > 0 && (
        <button 
          className="load-more-comments-btn"
          onClick={handleLoadMore}
        >
          Load more comments
        </button>
      )}
    </div>
  );
};

export default CommentsSection;