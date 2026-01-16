import React from 'react';
import { FaImages } from 'react-icons/fa';
import PostHeader from './PostHeader';
import PostActions from './PostAction';
import StarRating from '../ui/ratings';
import PlatformLink from '../ui/PlatformLink';
import MediaRenderer from '../media/MediaRenderer';

const PostCard = ({ 
  post, 
  isMobile, 
  onToggleExpand, 
  onToggleShowAllMedia, 
  onThumbnailClick, 
  onLike,
  onToggleComments,
  onRatingUpdate,
  getFileIcon,
  baseUrl
}) => {
  const getAllMediaFromPost = (post) => {
    const media = [];
    if (post.image) media.push(post.image);
    if (post.files) {
      if (Array.isArray(post.files)) {
        media.push(...post.files);
      } else {
        media.push(post.files);
      }
    }
    return media;
  };

  const renderGroupedMedia = (post) => {
    const allMedia = getAllMediaFromPost(post);
    if (allMedia.length === 0) return null;

    if (allMedia.length === 1) {
      return (
        <div className="files-container single-file">
          <MediaRenderer 
            fileUrl={allMedia[0]} 
            baseUrl={baseUrl}
            getFileIcon={getFileIcon}
          />
        </div>
      );
    }

    if (isMobile && !post.showAllMedia) {
      return (
        <div className="files-container mobile-preview">
          <div className="first-media">
            <MediaRenderer 
              fileUrl={allMedia[0]} 
              baseUrl={baseUrl}
              getFileIcon={getFileIcon}
            />
          </div>
          <button 
            className="show-more-media-btn"
            onClick={() => onToggleShowAllMedia(post.id)}
          >
            <FaImages />
            <span>View {allMedia.length - 1} more media</span>
          </button>
        </div>
      );
    }

    return (
      <div className={`files-container grouped-files ${isMobile ? 'mobile-full' : ''}`}>
        <div className="grouped-header">
          <h4>Shared Media ({allMedia.length})</h4>
          {isMobile && (
            <button 
              className="hide-media-btn"
              onClick={() => onToggleShowAllMedia(post.id)}
            >
              Collapse
            </button>
          )}
        </div>
        
        <div className="files-grid">
          {allMedia.map((fileUrl, index) => (
            <div 
              key={index} 
              className="file-thumbnail"
              onClick={() => onThumbnailClick(post.id, allMedia, index)}
            >
              <MediaRenderer 
                fileUrl={fileUrl} 
                baseUrl={baseUrl}
                getFileIcon={getFileIcon}
                isThumbnail={true}
              />
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="post-container">
      <PostHeader post={post} />

      <div
        className={`post-content ${post.expanded ? 'expanded' : ''}`}
        style={{
          maxHeight: post.expanded ? 'none' : '200px',
          overflow: post.expanded ? 'visible' : 'hidden',
        }}
      >
        {post.content}
      </div>

      {post.content && post.content.length > 300 && (
        <button
          className="see-more-btn"
          onClick={() => onToggleExpand(post.id)}
        >
          {post.expanded ? 'See less' : 'See more'}
        </button>
      )}

      {post.link && <PlatformLink url={post.link} />}

      {renderGroupedMedia(post)}

      <div className="rating-section">
        <StarRating
          postId={post.id}
          initialUserRating={post.user_rating}
          averageRating={post.average_rating}
          totalRatings={post.total_ratings}
          onRatingUpdate={(ratingData) => onRatingUpdate(post.id, ratingData)}
        />
      </div>

      <div className="post-stats">
        <div className="stats-info">
          <span>{post.like ? 1 : 0} likes</span>
          <span>{post.comments.length} comments</span>
        </div>
      </div>

      <PostActions 
        post={post} 
        onLike={onLike}
        onToggleComments={onToggleComments}
      />

     
    </div>
  );
};

export default PostCard;