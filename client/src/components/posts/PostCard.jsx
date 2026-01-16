import React, { useState, useCallback, useEffect, useRef } from 'react';
import PostActions from './PostActions';
import PlatformLink from '../ui/PlatformLink';
import StaticStars from '../shared/StaticStars';
import StarRating from '../main/ui/ratings.jsx';
import UserInfo from './UserInfo';
import PostMenu from './PostMenu';
import '../../styles/main/post-card-main.css';
import { useNavigate } from 'react-router-dom';
import { Download, Calendar, User, Eye, MessageCircle, Share2, Image, Video, Music, File, Star, Package, Headphones, X, ChevronLeft, ChevronRight } from 'lucide-react';
import AudioPlayer from './media_section/AudioPlayer';

const PostCard = ({ 
  post: initialPost, 
  URL, 
  isMobile, 
  onToggleExpand, 
  onToggleShowAllMedia, 
  onThumbnailClick, 
  onOpenGallery, 
  onLike, 
  onToggleComments, 
  onAddComment, 
  onCommentChange, 
  onViewPost,
  onRatingUpdate,
  showUserBio = false,
  userBio = '',
  currentUserId,
  currentUser
}) => {
  const [localPost, setLocalPost] = useState(initialPost);
  const [isBioExpanded, setIsBioExpanded] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [mediaList, setMediaList] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    totalSize: '0 KB',
    images: 0,
    videos: 0,
    audio: 0,
    documents: 0
  });
  const [isLoading, setIsLoading] = useState(false);
  const [mainMedia, setMainMedia] = useState(null);
  const [mainMediaType, setMainMediaType] = useState('image');
  const [showFullDescription, setShowFullDescription] = useState(false);
  
  // Slider states - CORRIGÉ
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragOffset, setDragOffset] = useState(0);
  const [currentTranslate, setCurrentTranslate] = useState(0);
  
  // Refs
  const sliderRef = useRef(null);
  const slidesWrapperRef = useRef(null);
  
  // State to control AudioPlayer display
  const [showAudioPlayer, setShowAudioPlayer] = useState(false);
  
  // Audio references
  const audioRef = useRef(null);
  const volumeSliderRef = useRef(null);
  const progressBarRef = useRef(null);
  const volumeContainerRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  
  // Audio state
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isRepeating, setIsRepeating] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [waveformData, setWaveformData] = useState([]);
  const [isDraggingVolume, setIsDraggingVolume] = useState(false);
  const [isDraggingProgress, setIsDraggingProgress] = useState(false);
  
  const navigate = useNavigate();

  // Check if post belongs to Music category
  const isMusicCategory = () => {
    const categoryName = localPost.category_name?.toLowerCase() || '';
    const categorySlug = localPost.category_slug?.toLowerCase() || '';
    const categoryType = localPost.category_type?.toLowerCase() || '';
    
    return categoryName.includes('music') || 
           categorySlug.includes('music') || 
           categoryType.includes('music') ||
           localPost.category?.name?.toLowerCase().includes('music') ||
           localPost.category_details?.name?.toLowerCase().includes('music');
  };

  // ============ CORRECTION POUR UN SEUL AUDIO À LA FOIS ============
  useEffect(() => {
    const handleOtherAudioPlay = (event) => {
      const { audioId } = event.detail;
      if (audioId !== localPost.id && isPlaying) {
        setIsPlaying(false);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        }
      }
    };

    window.addEventListener('audio-played', handleOtherAudioPlay);
    
    return () => {
      window.removeEventListener('audio-played', handleOtherAudioPlay);
    };
  }, [isPlaying, localPost.id]);

  const notifyOtherPosts = useCallback(() => {
    const event = new CustomEvent('audio-played', { 
      detail: { audioId: localPost.id } 
    });
    window.dispatchEvent(event);
  }, [localPost.id]);

  const handleIsPlayingChange = useCallback((playing) => {
    setIsPlaying(playing);
    
    if (playing) {
      setTimeout(() => {
        notifyOtherPosts();
      }, 0);
    }
  }, [notifyOtherPosts]);

  // Update localPost when initialPost changes
  useEffect(() => {
    setLocalPost(initialPost);
  }, [initialPost]);

  // Fetch media data from API
  useEffect(() => {
    if (localPost && localPost.id) {
      fetchMediaData();
    }
  }, [localPost, URL]);

  const fetchMediaData = async () => {
    if (!localPost || !localPost.id || !URL) return;
    
    setIsLoading(true);
    try {
      const response = await fetch(`${URL}/post/posts/${localPost.id}/media-list/`);
      
      if (response.ok) {
        const data = await response.json();
        
        setMediaList(data.media || []);
        
        setStats({
          total: data.total_media || 0,
          totalSize: data.total_size || '0 KB',
          images: data.statistics?.images || 0,
          videos: data.statistics?.videos || 0,
          audio: data.statistics?.audio || 0,
          documents: data.statistics?.documents || 0
        });

        if (data.media && data.media.length > 0) {
          const firstMedia = data.media[0];
          setMainMedia(getDirectUrl(firstMedia.url));
          setMainMediaType(firstMedia.type);
        } else {
          extractMediaFromPost();
        }
      } else {
        extractMediaFromPost();
      }
    } catch (error) {
      console.error('Error fetching media data:', error);
      extractMediaFromPost();
    } finally {
      setIsLoading(false);
    }
  };

  const extractMediaFromPost = () => {
    const extractedMedia = [];
    let mainMediaFound = null;
    let mainMediaTypeFound = 'image';
    
    // Post images
    if (localPost.post_images && Array.isArray(localPost.post_images)) {
      localPost.post_images.forEach((img, index) => {
        if (img.image || img.image_url) {
          const imageUrl = img.image || img.image_url;
          const directUrl = getDirectUrl(imageUrl);
          
          extractedMedia.push({
            id: `image-${index}`,
            type: 'image',
            name: `Image ${index + 1}`,
            url: imageUrl,
            directUrl: directUrl,
            size: '500 KB',
            order: index
          });
          
          if (!mainMediaFound) {
            mainMediaFound = directUrl;
            mainMediaTypeFound = 'image';
          }
        }
      });
    }
    
    // Post files
    if (localPost.post_files && Array.isArray(localPost.post_files)) {
      localPost.post_files.forEach((file, index) => {
        const fileUrl = file.file || file.file_url || file.url;
        if (fileUrl) {
          const directUrl = getDirectUrl(fileUrl);
          const filename = getFilenameFromUrl(fileUrl) || file.name || `file-${index}`;
          const extension = getFileExtension(filename);
          const type = file.file_type || getTypeFromExtension(extension);
          
          extractedMedia.push({
            id: `file-${index}`,
            type: type,
            name: file.name || filename,
            url: fileUrl,
            directUrl: directUrl,
            size: '1 MB',
            extension: extension || 'file',
            order: 100 + index,
            file_type_display: file.file_type_display
          });
          
          if (!mainMediaFound) {
            mainMediaFound = directUrl;
            mainMediaTypeFound = type;
          }
        }
      });
    }
    
    // Calculate statistics
    const calculatedStats = {
      total: extractedMedia.length,
      totalSize: calculateTotalSize(extractedMedia),
      images: extractedMedia.filter(m => m.type === 'image').length,
      videos: extractedMedia.filter(m => m.type === 'video').length,
      audio: extractedMedia.filter(m => m.type === 'audio').length,
      documents: extractedMedia.filter(m => m.type === 'document').length
    };
    
    setMediaList(extractedMedia);
    setStats(calculatedStats);
    
    if (mainMediaFound && extractedMedia.length > 0) {
      setMainMedia(mainMediaFound);
      setMainMediaType(mainMediaTypeFound);
    } else {
      setMainMedia(null);
      setMainMediaType('image');
    }
  };

  // Utility functions
  const getFilenameFromUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    return url.split('/').pop().split('?')[0];
  };

  const getFileExtension = (filename) => {
    if (!filename || typeof filename !== 'string') return '';
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  };

  const getTypeFromExtension = (extension) => {
    const imageExts = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'];
    const videoExts = ['mp4', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'webm'];
    const audioExts = ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'flac'];
    const docExts = ['pdf', 'doc', 'docx', 'txt', 'rtf', 'odt', 'xls', 'xlsx', 'ppt', 'pptx'];
    
    if (imageExts.includes(extension)) return 'image';
    if (videoExts.includes(extension)) return 'video';
    if (audioExts.includes(extension)) return 'audio';
    if (docExts.includes(extension)) return 'document';
    return 'other';
  };

  const getDirectUrl = (url) => {
    if (!url || typeof url !== 'string') return '';
    
    if (url.startsWith('http') || url.startsWith('data:')) {
      return url;
    }
    
    if (url.startsWith('//')) {
      return `https:${url}`;
    }
    
    if (URL) {
      const base = URL.endsWith('/') ? URL.slice(0, -1) : URL;
      
      if (url.startsWith(base)) {
        return url;
      }
      
      let path = url;
      if (path.startsWith('/')) {
        path = path.substring(1);
      }
      
      return `${base}/${path}`;
    }
    
    return url;
  };

  const calculateTotalSize = (items) => {
    if (!items || items.length === 0) return '0 KB';
    
    const sizeMap = {
      'KB': 1024,
      'MB': 1024 * 1024,
      'GB': 1024 * 1024 * 1024
    };
    
    let totalBytes = 0;
    
    items.forEach(item => {
      if (item.size) {
        const sizeStr = String(item.size);
        const match = sizeStr.match(/(\d+\.?\d*)\s*(KB|MB|GB)/i);
        
        if (match) {
          const value = parseFloat(match[1]);
          const unit = match[2].toUpperCase();
          const multiplier = sizeMap[unit] || 1;
          totalBytes += value * multiplier;
        }
      }
    });
    
    if (totalBytes < 1024) {
      return `${totalBytes.toFixed(0)} B`;
    } else if (totalBytes < 1024 * 1024) {
      return `${(totalBytes / 1024).toFixed(1)} KB`;
    } else if (totalBytes < 1024 * 1024 * 1024) {
      return `${(totalBytes / (1024 * 1024)).toFixed(1)} MB`;
    } else {
      return `${(totalBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recently';
    
    try {
      const date = new Date(dateString);
      const now = new Date();
      const diffTime = Math.abs(now - date);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays} days ago`;
      if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
      return `${Math.floor(diffDays / 30)} months ago`;
    } catch (e) {
      return 'Recently';
    }
  };

  const handleRatingUpdate = useCallback((ratingData) => {
    const userRating = ratingData.userRating || ratingData.user_rating || 0;
    const averageRating = ratingData.averageRating || ratingData.average_rating || 0;
    const totalRatings = ratingData.totalRatings || ratingData.total_ratings || 0;
    
    setLocalPost(prev => ({
      ...prev,
      average_rating: averageRating,
      total_ratings: totalRatings,
      user_rating: userRating
    }));
    
    if (onRatingUpdate) {
      onRatingUpdate(localPost.id, ratingData);
    }
  }, [localPost.id, onRatingUpdate]);

  // Handle "Listen Music" button click
  const handleListenMusicClick = () => {
    setShowAudioPlayer(!showAudioPlayer);
    if (showAudioPlayer && isPlaying) {
      setIsPlaying(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
    }
  };

  // ============ CORRECTION DU SWIPE ============

  // Initialiser la position du slider
  useEffect(() => {
    if (slidesWrapperRef.current) {
      updateSliderPosition();
    }
  }, [currentSlideIndex, mediaList.length]);

  const updateSliderPosition = () => {
    if (!slidesWrapperRef.current) return;
    
    const translateX = -currentSlideIndex * 100;
    slidesWrapperRef.current.style.transform = `translateX(${translateX}%)`;
    setCurrentTranslate(translateX);
  };

  // Navigation functions
  const goToSlide = (index) => {
    if (isTransitioning || index === currentSlideIndex || mediaList.length <= 1) return;
    
    setIsTransitioning(true);
    setCurrentSlideIndex(index);
    
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const goToNextSlide = () => {
    if (isTransitioning || mediaList.length <= 1) return;
    
    const nextIndex = currentSlideIndex === mediaList.length - 1 ? 0 : currentSlideIndex + 1;
    goToSlide(nextIndex);
  };

  const goToPrevSlide = () => {
    if (isTransitioning || mediaList.length <= 1) return;
    
    const prevIndex = currentSlideIndex === 0 ? mediaList.length - 1 : currentSlideIndex - 1;
    goToSlide(prevIndex);
  };

  // Touch event handlers - CORRIGÉS
  const handleTouchStart = (e) => {
    if (mediaList.length <= 1) return;
    
    const touch = e.touches[0];
    setDragStartX(touch.clientX);
    setIsDragging(true);
    
    // Arrêter les transitions pendant le drag
    if (slidesWrapperRef.current) {
      slidesWrapperRef.current.style.transition = 'none';
    }
  };

  const handleTouchMove = (e) => {
    if (!isDragging || mediaList.length <= 1) return;
    
    const touch = e.touches[0];
    const currentX = touch.clientX;
    const diff = currentX - dragStartX;
    
    // Calculer le déplacement en pourcentage
    const slideWidth = sliderRef.current?.offsetWidth || 1;
    const dragPercent = (diff / slideWidth) * 100;
    setDragOffset(dragPercent);
    
    // Appliquer le déplacement en temps réel
    const newTranslate = (-currentSlideIndex * 100) + dragPercent;
    
    if (slidesWrapperRef.current) {
      slidesWrapperRef.current.style.transform = `translateX(${newTranslate}%)`;
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || mediaList.length <= 1) return;
    
    setIsDragging(false);
    
    // Réactiver les transitions
    if (slidesWrapperRef.current) {
      slidesWrapperRef.current.style.transition = 'transform 0.3s ease';
    }
    
    // Déterminer si on change de slide
    const slideWidth = sliderRef.current?.offsetWidth || 1;
    const threshold = slideWidth * 0.1; // 10% de seuil
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        // Swipe vers la droite → slide précédent
        goToPrevSlide();
      } else {
        // Swipe vers la gauche → slide suivant
        goToNextSlide();
      }
    } else {
      // Retour à la position actuelle
      updateSliderPosition();
    }
    
    setDragOffset(0);
  };

  // Mouse event handlers pour desktop
  const handleMouseDown = (e) => {
    if (mediaList.length <= 1) return;
    
    setDragStartX(e.clientX);
    setIsDragging(true);
    
    if (slidesWrapperRef.current) {
      slidesWrapperRef.current.style.transition = 'none';
    }
    
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || mediaList.length <= 1) return;
    
    const currentX = e.clientX;
    const diff = currentX - dragStartX;
    
    const slideWidth = sliderRef.current?.offsetWidth || 1;
    const dragPercent = (diff / slideWidth) * 100;
    setDragOffset(dragPercent);
    
    const newTranslate = (-currentSlideIndex * 100) + dragPercent;
    
    if (slidesWrapperRef.current) {
      slidesWrapperRef.current.style.transform = `translateX(${newTranslate}%)`;
    }
  };

  const handleMouseUp = () => {
    if (!isDragging || mediaList.length <= 1) return;
    
    setIsDragging(false);
    
    if (slidesWrapperRef.current) {
      slidesWrapperRef.current.style.transition = 'transform 0.3s ease';
    }
    
    const slideWidth = sliderRef.current?.offsetWidth || 1;
    const threshold = slideWidth * 0.15; // 15% de seuil pour desktop
    
    if (Math.abs(dragOffset) > threshold) {
      if (dragOffset > 0) {
        goToPrevSlide();
      } else {
        goToNextSlide();
      }
    } else {
      updateSliderPosition();
    }
    
    setDragOffset(0);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      handleMouseUp();
    }
  };

  // Render individual slide - CORRIGÉ
  const renderSlide = (media, index) => {
    const mediaUrl = getDirectUrl(media.directUrl || media.url);
    
    if (!mediaUrl || mediaUrl.trim() === '') {
      return (
        <div key={media.id} className="slide">
          <div className="slide-placeholder">
            <div className="placeholder-content">
              <span className="placeholder-icon">📄</span>
              <span className="placeholder-text">Media Error</span>
            </div>
          </div>
        </div>
      );
    }

    switch(media.type) {
      case 'image':
        return (
          <div key={media.id} className="slide">
            <img 
              src={mediaUrl}
              alt={media.name || `Slide ${index + 1}`}
              className="slide-image"
              onError={(e) => {
                e.target.style.display = 'none';
                e.target.parentElement.innerHTML = '<div class="slide-placeholder"><div class="placeholder-content"><span class="placeholder-icon">📄</span><span class="placeholder-text">Image Error</span></div></div>';
              }}
              onClick={handlePostView}
              draggable="false"
            />
          </div>
        );
      case 'video':
        return (
          <div key={media.id} className="slide">
  <video
              className="slide-video"
              src={mediaUrl}
              autoPlay
              muted
              loop
              playsInline
              poster="/video-placeholder.png"
               onClick={handlePostView}
            />

          </div>
        );
      case 'audio':
        return (
          <div key={media.id} className="slide">
            <div className="audio-overlay-card" >
                        <div className=" main-audio-card">
            <AudioPlayer
              media={mediaUrl}
              isPlaying={isPlaying}
              volume={volume}
              muted={muted}
              currentTime={currentTime}
              duration={duration}
              playbackRate={playbackRate}
              isRepeating={isRepeating}
              isShuffling={isShuffling}
              waveformData={waveformData}
              isDraggingVolume={isDraggingVolume}
              isDraggingProgress={isDraggingProgress}
              audioInitialized={audioInitialized}
              audioRef={audioRef}
              volumeSliderRef={volumeSliderRef}
              progressBarRef={progressBarRef}
              volumeContainerRef={volumeContainerRef}
              audioContextRef={audioContextRef}
              analyserRef={analyserRef}
              animationFrameRef={animationFrameRef}
              onIsPlayingChange={handleIsPlayingChange}
              onVolumeChange={setVolume}
              onMutedChange={setMuted}
              onCurrentTimeChange={setCurrentTime}
              onDurationChange={setDuration}
              onPlaybackRateChange={setPlaybackRate}
              onIsRepeatingChange={setIsRepeating}
              onIsShufflingChange={setIsShuffling}
              onWaveformDataChange={setWaveformData}
              onIsDraggingVolumeChange={setIsDraggingVolume}
              onIsDraggingProgressChange={setIsDraggingProgress}
              onAudioInitializedChange={setAudioInitialized}
            />
          </div>
            </div>
          </div>
        );
      case 'document':
        return (
          <div key={media.id} className="slide">
            <div className="document-slide-content" onClick={handlePostView}>
              <File size={48} />
              <span className="document-slide-badge">DOCUMENT</span>
              <p className="document-slide-name">{media.name}</p>
            </div>
          </div>
        );
      default:
        return (
          <div key={media.id} className="slide">
            <div className="other-slide-content" onClick={handlePostView}>
              <File size={48} />
              <span className="other-slide-badge">FILE</span>
              <p className="other-slide-name">{media.name}</p>
            </div>
          </div>
        );
    }
  };

  // Main media render function - CORRIGÉ
  const renderMainMedia = () => {

    // CASE 2: No media available
    if (mediaList.length === 0) {
      return (
        <div className="main-media-placeholder" style={{display:'none'}}>
          <div className="placeholder-content">
            <span className="placeholder-icon">📄</span>
            <span className="placeholder-text">No Media Available</span>
          </div>
        </div>
      );
    }

    // CASE 3: Slider avec swipe fonctionnel
    return (
      <div 
        ref={sliderRef}
        className="media-slider-container"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
      >
        <div 
          ref={slidesWrapperRef}
          className="slides-wrapper"
          style={{ 
            transform: `translateX(${currentTranslate}%)`,
            transition: isDragging ? 'none' : 'transform 0.3s ease'
          }}
        >
          {mediaList.map((media, index) => renderSlide(media, index))}
        </div>

        {/* Navigation arrows */}
        {mediaList.length > 1 && !isDragging && (
          <>
            <button 
              className="slider-nav-btn prev-btn"
              onClick={(e) => {
                e.stopPropagation();
                goToPrevSlide();
              }}
              aria-label="Previous slide"
                  onMouseDown={(e) => e.stopPropagation()}
            >
              <ChevronLeft size={24} />
            </button>
            <button 
              className="slider-nav-btn next-btn"
              onClick={(e) => {
                e.stopPropagation();
                goToNextSlide();
              }}
              aria-label="Next slide"
                  onMouseDown={(e) => e.stopPropagation()}
            >
              <ChevronRight size={24} />
            </button>
          </>
        )}

      {mediaList.length > 1 && (
  <div className="slider-dots">
    {(() => {
      const totalSlides = mediaList.length;
      const maxDots = 5; // Maximum 5 dots
      
      // Si on a 5 slides ou moins, afficher tous les dots
      if (totalSlides <= maxDots) {
        return mediaList.map((_, index) => (
          <span
            key={index}
            className={`slider-dot ${index === currentSlideIndex ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(index);
            }}
            aria-label={`Go to slide ${index + 1}`}
            title={`Slide ${index + 1}`}
          />
        ));
      }
      
      // Pour plus de 5 slides, afficher seulement 5 dots
      const dots = [];
      
      // Toujours afficher le premier dot
      dots.push(
        <span
          key="first"
          className={`slider-dot ${currentSlideIndex === 0 ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            goToSlide(0);
          }}
          aria-label="Go to first slide"
          title="First slide"
        />
      );
      
      // Calculer les indices des dots du milieu
      let startMid = Math.max(1, currentSlideIndex - 1);
      let endMid = Math.min(totalSlides - 2, currentSlideIndex + 1);
      
      // Ajuster si on est près du début
      if (currentSlideIndex <= 1) {
        startMid = 1;
        endMid = 3;
      }
      
      // Ajuster si on est près de la fin
      if (currentSlideIndex >= totalSlides - 2) {
        startMid = totalSlides - 4;
        endMid = totalSlides - 2;
      }
      
      // Ajouter les dots du milieu (maximum 3)
      for (let i = startMid; i <= endMid && i < totalSlides - 1; i++) {
        dots.push(
          <span
            key={i}
            className={`slider-dot ${currentSlideIndex === i ? 'active' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              goToSlide(i);
            }}
            aria-label={`Go to slide ${i + 1}`}
            title={`Slide ${i + 1}`}
          />
        );
      }
      
      // Toujours afficher le dernier dot
      dots.push(
        <span
          key="last"
          className={`slider-dot ${currentSlideIndex === totalSlides - 1 ? 'active' : ''}`}
          onClick={(e) => {
            e.stopPropagation();
            goToSlide(totalSlides - 1);
          }}
          aria-label="Go to last slide"
          title="Last slide"
        />
      );
      
      // Limiter à 5 dots exactement
      return dots.slice(0, maxDots);
    })()}
  </div>
)}

        {/* Slide counter */}
        {mediaList.length > 1 && (
          <div className="slide-counter">
            {currentSlideIndex + 1} / {mediaList.length}
          </div>
        )}

      </div>
    );
  };

  // Post menu functions
  const handleEditPost = useCallback((post) => {
    console.log('Editing post:', post.id);
    window.location.href = `/posts/edit/${post.id}/`;
  }, []);

  const handleDeletePost = useCallback((post) => {
    console.log('Deleting post:', post.id);
    if (window.confirm('Are you sure you want to delete this post? This action cannot be undone.')) {
      alert(`Delete post ${post.id}`);
    }
  }, []);

  const handleReportPost = useCallback((post) => {
    console.log('Reporting post:', post.id);
    alert(`Report post ${post.id}`);
  }, []);

  const handleSharePost = useCallback((post) => {
    console.log('Sharing post:', post.id);
    if (navigator.share) {
      navigator.share({
        title: post.title || 'Post',
        text: post.content?.substring(0, 100) || '',
        url: `${window.location.origin}/post/${post.id}`,
      });
    } else {
      navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
      alert('Post link copied to clipboard!');
    }
  }, []);

  const handleInstall = () => {
    setShowDownloadModal(true);
  };

  const handleCloseDownloadModal = () => {
    setShowDownloadModal(false);
  };

  if (!localPost) {
    return null;
  }

  const handlePostView = () => {
    window.location.href = (`/user/${localPost.user_id}/posts/${localPost.id}`)
  }

  const getUserInfo = () => {
    return {
      userName: localPost.user_name || 
                localPost.username || 
                localPost.user?.username || 
                localPost.author?.username ||
                'Unknown User',
      
      createdAt: localPost.created_at || localPost.createdAt || new Date().toISOString(),
      
      profileImage: localPost.user_profile_image || 
                   localPost.profile_image ||
                   localPost.user?.profile_image ||
                   localPost.author?.profile_image ||
                   localPost.user?.avatar ||
                   localPost.author?.avatar,
      
      profileId: localPost.user_profile_id || 
                localPost.user_profile_id || 
                localPost.profile_id ||
                localPost.user?.profile_id ||
                localPost.author?.profile_id ||
                localPost.user_id ||
                localPost.user?.id ||
                localPost.author?.id,
      
      userId: localPost.user_id || 
             localPost.user?.id || 
             localPost.author?.id
    };
  };

  const userInfo = getUserInfo();
  const description = localPost.content || 'No description available';
  const truncatedDescription = description.length > 120 
    ? `${description.substring(0, 120)}...` 
    : description;

  const musicCategory = isMusicCategory();

  return (
    <>
      <div className="software-card-post">
        {/* Rating badge */}
        <div className="rating-badge-absolute">
          <Star size={14} />
          <span className="rating-value">{localPost.average_rating?.toFixed(1) || '0.0'}</span>
          <span className="rating-count">({localPost.total_ratings || 0})</span>
        </div>
        
        {/* Profile link */}
        <a 
          href={`/profile/${userInfo.profileId}`} 
          className="profile-link-absolute"
          onClick={(e) => {
            if (!userInfo.profileId) e.preventDefault();
          }}
        >
          {userInfo.profileImage ? (
            <div className="">
              <img 
                src={getDirectUrl(userInfo.profileImage)}
                alt={userInfo.userName}
                className="profile-image"
                onError={(e) => {
                  e.target.style.display = 'none';
                  e.target.parentElement.innerHTML = '<div class="profile-placeholder"><User size={16} /></div>';
                }}
              />
            </div>
          ) : (
            <div className="profile-placeholder">
              <User size={16} />
            </div>
          )}
          <div className=''>
            <span className="profile-name-post">{userInfo.userName}</span>
          </div>
        </a>
        


        {/* Main media section with slider */}
        <div className="main-media-section">
          <div className="main-media-container" style={{backgroundColor:'white'}}>
            {renderMainMedia()}
               <div className="post-actions-overlay">
      <PostActions
        post={localPost}
        onLike={onLike}
        onToggleComments={onToggleComments}
        onViewPost={onViewPost}
      />
    </div>
          </div>
                   
        </div>

        {/* Content below media */}
        <div className="card-content-simple">
          {/* Title and Category */}
          <div className="title-section">
            <h3 className="app-title-simples" onClick={handlePostView}>
              {localPost.title || 'Untitled Post'}
            </h3>
              {/* Description */}
          {localPost.content && (
            <div className="description-section-simple">
              <p className="description-text-simple">
                {showFullDescription ? description : truncatedDescription}
              </p>
              {description.length > 120 && (
                <button 
                  className="read-more-btn-card"
                  onClick={() => setShowFullDescription(!showFullDescription)}
                >
                  {showFullDescription ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          )}
            <div className="category-meta">
              <div className="category-badge">
                {localPost.category?.image_url ? (
                  <img 
                    src={getDirectUrl(localPost.category.image_url)}
                    alt={localPost.category?.name || 'Category'}
                    className="category-icon-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const span = e.target.parentElement.querySelector('span');
                      const wrapper = document.createElement('span');
                      wrapper.innerHTML = '<Package size={12} />';
                      e.target.parentElement.insertBefore(wrapper.firstChild, span);
                    }}
                  />
                ) : localPost.category_details?.image_url ? (
                  <img 
                    src={getDirectUrl(localPost.category_details.image_url)}
                    alt={localPost.category_details?.name || 'Category'}
                    className="category-icon-image"
                    onError={(e) => {
                      e.target.style.display = 'none';
                      const span = e.target.parentElement.querySelector('span');
                      const wrapper = document.createElement('span');
                      wrapper.innerHTML = '<Package size={12} />';
                      e.target.parentElement.insertBefore(wrapper.firstChild, span);
                    }}
                  />
                ) : localPost.category_hierarchy && localPost.category_hierarchy.length > 0 ? (
                  localPost.category_hierarchy[0].image_url ? (
                    <img 
                      src={getDirectUrl(localPost.category_hierarchy[0].image_url)}
                      alt={localPost.category_hierarchy[0]?.name || 'Category'}
                      className="category-icon-image"
                      onError={(e) => {
                        e.target.style.display = 'none';
                        const span = e.target.parentElement.querySelector('span');
                        const wrapper = document.createElement('span');
                        wrapper.innerHTML = '<Package size={12} />';
                        e.target.parentElement.insertBefore(wrapper.firstChild, span);
                      }}
                    />
                  ) : (
                    <Package size={12} />
                  )
                ) : (
                  <Package size={12} />
                )}
                <span>{localPost.category_name || 'Post'}</span>
              </div>
              <div className="size-date-info">
                <div className="date-info">
                  <Calendar size={12} />
                  <span>{formatDate(localPost.updated_at || localPost.created_at)}</span>
                </div>
                <PostMenu
                  post={localPost}
                  currentUser={currentUser}
                  onEdit={handleEditPost}
                  onDelete={handleDeletePost}
                  onReport={handleReportPost}
                  onShare={handleSharePost}
                          isOpen={showDownloadModal}
        onClose={handleCloseDownloadModal}
     
        URL={URL}
        onDownloadSelected={(selectedItems) => {
          console.log('Downloading selected items:', selectedItems);
        }}
        isInstall={handleInstall}
        mediaList={mediaList}
        isLoading={isLoading}
                />
              </div>
            </div>
          </div>

        

          {/* External link */}
          {localPost.link && (
            <div className="platform-link-simple">
              <PlatformLink url={localPost.link} />
            </div>
          )}

          {/* Media stats */}
          {mediaList.length > 0 && (
            <div className="media-stats-simple">
           
              <div className="type-stats-simple">
                {stats.images > 0 && (
                  <div className="type-stat-simple">
                    <Image size={12} />
                    <span>{stats.images}</span>
                  </div>
                )}
                
                {stats.videos > 0 && (
                  <div className="type-stat-simple">
                    <Video size={12} />
                    <span>{stats.videos}</span>
                  </div>
                )}
                
                {stats.audio > 0 && (
                  <div className="type-stat-simple">
                    <Music size={12} />
                    <span>{stats.audio}</span>
                  </div>
                )}
                
                {stats.documents > 0 && (
                  <div className="type-stat-simple">
                    <File size={12} />
                    <span>{stats.documents}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Rating */}
          <div className="rating-interactive-simple">
            <StarRating
              key={`star-rating-${localPost.id}-${localPost.user_rating || 0}`}
              postId={localPost.id}
              initialUserRating={localPost.user_rating}
              averageRating={localPost.average_rating || 0}
              totalRatings={localPost.total_ratings || 0}
              onRatingUpdate={handleRatingUpdate}
              compact={true}
            />
          </div>

          {/* Action buttons */}
          <div className="action-buttons-simple">
            <div className="secondary-actions-card">
            
              <button 
                className="action-btn-simple"
                onClick={handlePostView}
                title="Comments"
              >
                <MessageCircle size={16} />
                <span className="action-count">{localPost.comments_count || 0}</span>
              </button>
          
              <button 
                className="action-btn-simple"
                onClick={() => handleSharePost(localPost)}
                title="Share"
              >
                <Share2 size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
  
    </>
  );
};

export default PostCard;