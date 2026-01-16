import React from 'react';


const CommentContent = ({ comment, renderContentWithMentionsAsync }) => {
  return (
    <div className="comment-content">
      {/* Utiliser la version async des mentions */}
      {renderContentWithMentionsAsync()}

      {(comment.image || comment.video || comment.file) && (
        <div className="comment-media">
          {comment.image && (
            <img 
              src={comment.image}
              className="comment-image"
              onClick={() => window.open(comment.image)}
              alt='img'
            />
          )}

          {comment.video && (
            <video controls className="comment-video" src={comment.video}      controlsList="nodownload"/>
          )}


          {comment.file && !comment.image && !comment.video && (
            <a href={comment.file} target="_blank" rel="noopener noreferrer" className="comment-file">
              📎 Attached file
            </a>
          )}
        </div>
      )}
    </div>
  );
};

export default CommentContent;