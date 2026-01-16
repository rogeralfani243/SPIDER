import axios from 'axios';
import URL from '../../../../hooks/useUrl';

export const loadComments = async ({
  postId,
  page,
  perPage,
  showPinned,
  setLoading,
  setError,
  setComments,
  setHasMore,
  setPage,
  reset = false
}) => {
  if (setLoading(true) && !reset) return;
  
  setLoading(true);
  setError('');
  
  try {
    console.log(`📥 Loading comments page ${page}, show_pinned: ${showPinned}`);
    
    const timestamp = new Date().getTime();
    
    const response = await axios.get(`${URL}/comment/posts/${postId}/comments/`, {
      params: {
        page,
        per_page: perPage,
        order: '-created_at',
        show_pinned: showPinned ? 'true' : 'false',
        _t: timestamp
      }
    });
    
    console.log(`✅ Loaded ${response.data?.length || 0} comments`);
    
    const newComments = response.data || [];
    const pinnedCount = newComments.filter(c => c.is_pinned).length;
    console.log(`📌 Found ${pinnedCount} pinned comments in response`);
    
    if (reset || page === 1) {
      setComments(newComments);
    } else {
      setComments(prev => [...prev, ...newComments]);
    }
    
    setHasMore(newComments.length === perPage);
    setPage(page);
  } catch (error) {
    console.error('❌ Error loading comments:', error);
    setError('Failed to load comments. Please try again.');
  } finally {
    setLoading(false);
  }
};