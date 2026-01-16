import React, { useState, useRef } from 'react';
import { FaHeart } from 'react-icons/fa';
import axios from 'axios';
import URL from '../../../hooks/useUrl';
import '../../../styles/comment_post/comment_likes.css'

const CommentLikes = ({ commentId, isLiked: initialIsLiked, likesCount: initialLikesCount, onUpdate, disabled }) => {
  const [isLiking, setIsLiking] = useState(false);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const [particles, setParticles] = useState([]);
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [likesCount, setLikesCount] = useState(initialLikesCount);
  const heartRef = useRef(null);

  const createParticles = () => {
    const newParticles = [];
    for (let i = 0; i < 12; i++) {
      const angle = (i * 360) / 12;
      const radius = 30 + Math.random() * 20;
      newParticles.push({
        id: Date.now() + i,
        tx: radius * Math.cos((angle * Math.PI) / 180),
        ty: radius * Math.sin((angle * Math.PI) / 180),
        delay: Math.random() * 0.3,
        size: 4 + Math.random() * 4,
        color: `hsl(${340 + Math.random() * 20}, 100%, 65%)`
      });
    }
    setParticles(newParticles);
    setTimeout(() => setParticles([]), 800);
  };

  const handleLike = async () => {
    if (disabled) {
      alert("You must be logged in to like comments");
      return;
    }

    setIsLiking(true);
    setLikeAnimation(true);
    createParticles();
    
    const token = localStorage.getItem('token');
    const axiosAuth = axios.create({
      baseURL: URL,
      headers: { Authorization: token ? `Token ${token}` : '' }
    });

    try {
      const response = await axiosAuth.post(`/comment/comments/${commentId}/like/`);
      
      setIsLiked(response.data.has_liked || response.data.liked);
      setLikesCount(response.data.likes_count);
      
      if (onUpdate) onUpdate(response.data);
    } catch (error) {
      console.error("Error liking comment:", error);
      alert(error.response?.data?.error || "Error liking comment");
    } finally {
      setTimeout(() => setLikeAnimation(false), 600);
      setIsLiking(false);
    }
  };

  return (
    <button 
      className={`comment-like-btn ${isLiked ? "liked" : ""}`}
      onClick={handleLike}
      disabled={isLiking || disabled}
      title={isLiked ? "Unlike" : "Like"}
    >
      <div className="heart-container">
        <div className="heart-fill"></div>
        <FaHeart 
          ref={heartRef}
          className="heart-icon" 
          style={{
            transform: isLiked && likeAnimation ? 'scale(1.2)' : 'scale(1)',
            transition: 'transform 0.2s ease'
          }}
        />
      </div>
      
      <span className={`like-count ${likeAnimation ? "like-count-pop" : ""}`}>
        {likesCount || 0}
      </span>
      
      {likeAnimation && !isLiked && <div className="new-like-indicator"></div>}
      
      {particles.length > 0 && (
        <div className="heart-particles">
          {particles.map((particle) => (
            <div
              key={particle.id}
              className="heart-particle"
              style={{
                '--tx': `${particle.tx}px`,
                '--ty': `${particle.ty}px`,
                width: `${particle.size}px`,
                height: `${particle.size}px`,
                backgroundColor: particle.color,
                animation: `particleExplosion 0.8s ease ${particle.delay}s forwards`
              }}
            />
          ))}
        </div>
      )}
    </button>
  );
};

export default CommentLikes;