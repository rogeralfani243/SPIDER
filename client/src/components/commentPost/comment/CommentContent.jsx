import React,{useState,useRef,useEffect} from 'react';


const CommentContent = ({ comment, renderContentWithMentionsAsync }) => {
  
  const [expanded, setExpanded] = useState(false);
const [isOverflowing, setIsOverflowing] = useState(false);
const contentRef = React.useRef(null);
useEffect(() => {
  const el = contentRef.current;
  if (!el) return;

  if (el.scrollHeight > 200) {
    setIsOverflowing(true);
  } else {
    setIsOverflowing(false);
  }
}, [comment.content]);

  return (
    <div className="comment-content">
      {/* Utiliser la version async des mentions */}
      <div
    ref={contentRef}
    style={{
      maxHeight: expanded ? 'none' : '200px',
      overflow: 'hidden',
      transition: 'max-height 0.3s ease',
      wordBreak: 'keep-all',
    }}
  >
    {renderContentWithMentionsAsync()}
  </div>
   {isOverflowing && (
    <span
      onClick={() => setExpanded(!expanded)}
      style={{
        color: '#0457aaaf',
        cursor: 'pointer',
        fontWeight: 500,
        display: 'inline-block',
        marginTop: '8px'
      }}
    >
      {expanded ? 'See less' : 'See more'}
    </span>
  )}
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