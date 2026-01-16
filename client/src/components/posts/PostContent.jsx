import React, { useState, useRef, useEffect } from 'react';


const PostContent = ({ title, content, showReadMore = true, maxLines = 3 }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const contentRef = useRef(null);

  // Détecter si le contenu dépasse la hauteur maximum
  useEffect(() => {
    const checkOverflow = () => {
      if (contentRef.current && showReadMore) {
        const element = contentRef.current;
        const lineHeight = parseFloat(getComputedStyle(element).lineHeight) || 24;
        const maxHeight = lineHeight * maxLines;
        
        setIsOverflowing(element.scrollHeight > maxHeight);
      }
    };

    checkOverflow();
    
    // Re-vérifier au redimensionnement
    const resizeObserver = new ResizeObserver(checkOverflow);
    if (contentRef.current) {
      resizeObserver.observe(contentRef.current);
    }
    
    return () => {
      if (contentRef.current) {
        resizeObserver.unobserve(contentRef.current);
      }
    };
  }, [content, showReadMore, maxLines]);

  const toggleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const formatContent = (text) => {
    if (!text) return '';
    
    return text.split('\n').map((line, index) => (
      <React.Fragment key={index}>
        {line}
        {index < text.split('\n').length - 1 && <br />}
      </React.Fragment>
    ));
  };

  return (
    <div className="post-body">
      {title && <h2 className="post-title-content">{title}</h2>}
      
      <div 
        ref={contentRef}
        className={`post-text-content ${isOverflowing && !isExpanded ? 'truncated' : ''}`}
        style={isOverflowing && !isExpanded ? { 
          maxHeight: `${maxLines * 1.6}em` 
        } : {}}
      >
        {formatContent(content)}
      </div>
      
      {isOverflowing && showReadMore && (
        <button 
          className="read-more-btn"
          onClick={toggleExpand}
          aria-expanded={isExpanded}
        >
          {isExpanded ? 'See Less' : 'See More'}
        </button>
      )}
    </div>
  );
};

export default PostContent;