// Utility functions for comments
export const calculateBadges = (comments) => {
  console.log('🔍 Calculating badges for', comments.length, 'comments');
  
  if (comments.length === 0) {
    return { firstCommentId: null, trendingCommentId: null };
  }
  
  // 1. Find the FIRST comment (oldest)
  let firstComment = comments[0];
  let earliestDate = new Date(firstComment.created_at);
  
  for (let i = 1; i < comments.length; i++) {
    const comment = comments[i];
    const commentDate = new Date(comment.created_at);
    if (commentDate < earliestDate) {
      earliestDate = commentDate;
      firstComment = comment;
    }
  }
  
  const firstCommentId = firstComment.id;
  
  // 2. Find the TRENDING comment (most likes)
  let trendingComment = comments[0];
  let maxLikes = trendingComment.likes_count || 0;
  
  for (let i = 1; i < comments.length; i++) {
    const comment = comments[i];
    const commentLikes = comment.likes_count || 0;
    
    // If tied, take the most recent
    if (commentLikes > maxLikes || 
        (commentLikes === maxLikes && new Date(comment.created_at) > new Date(trendingComment.created_at))) {
      maxLikes = commentLikes;
      trendingComment = comment;
    }
  }
  
  // Only if comment has at least 2 likes
  const trendingCommentId = maxLikes >= 2 ? trendingComment.id : null;
  
  return { firstCommentId, trendingCommentId };
};

export const sortComments = (comments, sortBy) => {
  if (!comments.length) return [];
  
  const commentsToSort = [...comments];
  
  // Separate pinned and regular comments
  const pinned = commentsToSort.filter(comment => comment.is_pinned);
  const regular = commentsToSort.filter(comment => !comment.is_pinned);
  
  let sortedRegular = [...regular];
  
  switch (sortBy) {
    case 'newest':
      sortedRegular.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
      break;
    case 'oldest':
      sortedRegular.sort((a, b) => 
        new Date(a.created_at) - new Date(b.created_at)
      );
      break;
    case 'most_liked':
      sortedRegular.sort((a, b) => {
        const likesDiff = (b.likes_count || 0) - (a.likes_count || 0);
        if (likesDiff === 0) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return likesDiff;
      });
      break;
    case 'most_replied':
      sortedRegular.sort((a, b) => {
        const repliesDiff = (b.reply_count || 0) - (a.reply_count || 0);
        if (repliesDiff === 0) {
          return new Date(b.created_at) - new Date(a.created_at);
        }
        return repliesDiff;
      });
      break;
    default:
      sortedRegular.sort((a, b) => 
        new Date(b.created_at) - new Date(a.created_at)
      );
  }
  
  // Sort pinned comments by most recent
  const sortedPinned = pinned.sort((a, b) => 
    new Date(b.created_at) - new Date(a.created_at)
  );
  
  // Return combined array (pinned first, then regular)
  return [...sortedPinned, ...sortedRegular];
};