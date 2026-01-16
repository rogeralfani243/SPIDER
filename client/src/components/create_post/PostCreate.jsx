import React, { useState, useRef, useEffect } from 'react';
import '../../styles/create_post/create-post.css';
import URL from '../../hooks/useUrl';
import CategorySelector from './category/CategorySelector';
import FileUploadSection from './Files/FileUploadSection ';
import FileSummary from './Files/FileSummary';

const PostCreate = ({ onPostCreated, initialData = null, externalCategories = [] }) => {
  // Form states (exactement comme avant)
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category_id: '',
    link: '',
  });
  
  const [files, setFiles] = useState({
    images: [],
    videos: [],
    documents: [],
    audio: []
  });
  
  const [previews, setPreviews] = useState({
    images: [],
    videos: [],
    documents: [],
    audio: []
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Step management (nouveau)
  const [currentStep, setCurrentStep] = useState(1);
  const [stepCompleted, setStepCompleted] = useState({
    step1: false,
    step2: false,
    step3: false
  });

  // Refs for inputs
  const titleRef = useRef(null);
  const contentRef = useRef(null);

  // Vérification de l'authentification
  useEffect(() => {
    const token = localStorage.getItem('token');
    setIsAuthenticated(!!token);

    if (initialData) {
      console.log('🔍 [POST CREATE] Editing post:', initialData);
      setFormData({
        title: initialData.title || '',
        content: initialData.content || '',
        category_id: initialData.category?.id || initialData.category_id || '',
        link: initialData.link || '',
      });
      // Si on édite, toutes les étapes sont complétées
      setStepCompleted({
        step1: true,
        step2: true,
        step3: true
      });
    }
  }, [initialData]);

  // Vérifier si l'étape 1 est complète
  useEffect(() => {
    const isComplete = formData.title.trim() !== '' && 
                      formData.content.trim() !== '' && 
                      formData.category_id !== '';
    setStepCompleted(prev => ({
      ...prev,
      step1: isComplete
    }));
  }, [formData.title, formData.content, formData.category_id]);

  // Vérifier si l'étape 2 est complète (fichiers optionnels, donc toujours vrai)
  useEffect(() => {
    setStepCompleted(prev => ({
      ...prev,
      step2: true
    }));
  }, []);

  // Vos fonctions existantes (inchangées)
  const getToken = () => {
    const token = localStorage.getItem('token');
    return token;
  };

  const getCsrfToken = () => {
    const cookieValue = document.cookie
      .split('; ')
      .find(row => row.startsWith('csrftoken='))
      ?.split('=')[1];
    return cookieValue || '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCategoryChange = (categoryId) => {
    setFormData(prev => ({
      ...prev,
      category_id: categoryId
    }));
  };

  const handleFileSelect = (event, fileType) => {
    const selectedFiles = Array.from(event.target.files);
    
    // Basic validation
    const validFiles = selectedFiles.filter(file => {
      const extension = file.name.split('.').pop().toLowerCase();
      
      switch(fileType) {
        case 'images':
          return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(extension);
        case 'videos':
          return ['mp4', 'avi', 'mov', 'wmv', 'webm'].includes(extension);
        case 'documents':
          return ['pdf', 'doc', 'docx', 'txt', 'zip', 'rar', 'pptx', 'xlsx'].includes(extension);
        case 'audio':
          return ['mp3', 'wav', 'ogg', 'm4a', 'flac'].includes(extension);
        default:
          return false;
      }
    });
    
    if (validFiles.length === 0) {
      setError(`Unsupported file format for ${fileType}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Limit to 10 images maximum
    if (fileType === 'images' && files.images.length + validFiles.length > 10) {
      setError('Maximum 10 images allowed');
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Limit to 5 files maximum for other types
    if (fileType !== 'images' && files[fileType].length + validFiles.length > 5) {
      setError(`Maximum 5 files allowed for ${fileType}`);
      setTimeout(() => setError(''), 3000);
      return;
    }
    
    // Update files
    setFiles(prev => ({
      ...prev,
      [fileType]: [...prev[fileType], ...validFiles]
    }));
    
    // Create previews
    validFiles.forEach(file => {
      const reader = new FileReader();
      const fileId = Date.now() + Math.random();
      
      switch(fileType) {
        case 'images':
          reader.onloadend = () => {
            setPreviews(prev => ({
              ...prev,
              images: [...prev.images, { 
                url: reader.result, 
                name: file.name,
                id: fileId,
                type: 'image',
                size: file.size
              }]
            }));
          };
          reader.readAsDataURL(file);
          break;
          
        case 'videos':
          const videoUrl = window.URL.createObjectURL(file);
          reader.onloadend = () => {
            setPreviews(prev => ({
              ...prev,
              videos: [...prev.videos, { 
                url: videoUrl,
                blobUrl: videoUrl,
                name: file.name,
                id: fileId,
                type: 'video',
                size: file.size,
                extension: file.name.split('.').pop().toLowerCase()
              }]
            }));
          };
          reader.readAsDataURL(file);
          break;
          
        case 'audio':
          const audioUrl = window.URL.createObjectURL(file);
          reader.onloadend = () => {
            setPreviews(prev => ({
              ...prev,
              audio: [...prev.audio, { 
                url: audioUrl,
                blobUrl: audioUrl,
                name: file.name,
                id: fileId,
                type: 'audio',
                size: file.size,
                extension: file.name.split('.').pop().toLowerCase()
              }]
            }));
          };
          reader.readAsDataURL(file);
          break;
          
        case 'documents':
          setPreviews(prev => ({
            ...prev,
            documents: [...prev.documents, { 
              name: file.name,
              id: fileId,
              type: 'document',
              size: file.size,
              extension: file.name.split('.').pop().toLowerCase()
            }]
          }));
          break;
      }
    });
    
    event.target.value = '';
  };

  const removeFile = (fileType, index) => {
    // Revoke URLs to avoid memory leaks
    if (['videos', 'audio'].includes(fileType)) {
      const preview = previews[fileType][index];
      if (preview && preview.blobUrl) {
        window.URL.revokeObjectURL(preview.blobUrl);
      }
    }
    
    setFiles(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
    
    setPreviews(prev => ({
      ...prev,
      [fileType]: prev[fileType].filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log('🚀 [POST CREATE] Starting submit...');
    
    // Validation (inchangée)
    if (!formData.title.trim()) {
      setError('Title is required');
      setCurrentStep(1);
      titleRef.current?.focus();
      return;
    }
    
    if (!formData.content.trim()) {
      setError('Content is required');
      setCurrentStep(1);
      contentRef.current?.focus();
      return;
    }
    
    if (!formData.category_id) {
      setError('Please select a category');
      setCurrentStep(1);
      return;
    }
    
    const token = getToken();
    if (!token) {
      setError('You must be logged in to create a post');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const csrfToken = getCsrfToken();
      
      // Create FormData
      const formDataToSend = new FormData();
      formDataToSend.append('title', formData.title);
      formDataToSend.append('content', formData.content);
      formDataToSend.append('category_id', formData.category_id);
      
      if (formData.link) {
        formDataToSend.append('link', formData.link);
      }
      
      // Add all files
      const fileTypes = ['images', 'videos', 'audio', 'documents'];
      fileTypes.forEach(type => {
        files[type].forEach(file => {
          formDataToSend.append(type, file);
        });
      });
      
      // Send request
      const url = `${URL}/post/posts/`;
      console.log('🌐 [POST CREATE] URL:', url);
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Token ${token}`,
          'X-CSRFToken': csrfToken,
        },
        body: formDataToSend,
        credentials: 'include'
      });
      
      const responseText = await response.text();
      console.log('📨 [POST CREATE] Response status:', response.status);
      
      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch {
          errorData = { error: responseText || 'Unknown error' };
        }
        
        console.error('❌ [POST CREATE] Error:', errorData);
        
        if (response.status === 401) {
          setError('Session expired. Please log in again.');
          localStorage.removeItem('token');
          setTimeout(() => {
            window.location.href = '/login';
          }, 2000);
        } else {
          setError(errorData.error || errorData.detail || `Error ${response.status}`);
        }
        return;
      }
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { success: true };
      }
      
      console.log('✅ [POST CREATE] Success:', responseData);
      setSuccess('Post created successfully!');
      
      // Reset form
      setFormData({
        title: '',
        content: '',
        category_id: '',
        link: '',
      });
      setFiles({
        images: [],
        videos: [],
        audio: [],
        documents: []
      });
      setPreviews({
        images: [],
        videos: [],
        audio: [],
        documents: []
      });
      setCurrentStep(1);
      setStepCompleted({
        step1: false,
        step2: false,
        step3: false
      });
      
      // Callback
      if (onPostCreated) {
        onPostCreated(responseData);
      }
      
      setTimeout(() => setSuccess(''), 3000);
      
    } catch (error) {
      console.error('💥 [POST CREATE] Network error:', error);
      setError('Connection error with server');
    } finally {
      setLoading(false);
    }
  };

  // Navigation entre étapes
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Alert component (inchangé mais en anglais)
  const Alert = ({ type, message, onRetry = null }) => {
    const icons = {
      warning: 'fa-exclamation-triangle',
      error: 'fa-exclamation-circle',
      success: 'fa-check-circle',
      info: 'fa-info-circle'
    };

    return (
      <div className={`alert alert-${type}`}>
        <i className={`fas ${icons[type]}`}></i>
        <span>{message}</span>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="btn-retry"
            style={{ marginLeft: '10px', padding: '5px 10px' }}
          >
            Retry
          </button>
        )}
      </div>
    );
  };

  // Step indicator component (nouveau)
  const StepIndicator = () => (
    <div className="step-indicator">
      {[1, 2, 3].map((step) => (
        <React.Fragment key={step}>
          <div className="step-items">
            <div 
              className={`step-circle ${currentStep === step ? 'active' : ''} ${stepCompleted[`step${step}`] ? 'completed' : ''}`}
              onClick={() => {
                // Permet de revenir aux étapes précédentes si elles sont complétées
                if (step < currentStep && stepCompleted[`step${step}`]) {
                  setCurrentStep(step);
                }
              }}
            >
              {stepCompleted[`step${step}`] && step < currentStep ? (
                <i className="fas fa-check"></i>
              ) : (
                step
              )}
            </div>
            <div className="step-label">
              {step === 1 && 'Basic Info'}
              {step === 2 && 'Attachments'}
              {step === 3 && 'Review'}
            </div>
          </div>
          {step < 3 && (
            <div className={`step-line ${stepCompleted[`step${step}`] ? 'completed' : ''}`}></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  // Contenu de l'étape 1
  const renderStep1 = () => (
    <div className="step-content step-1">
      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          ref={titleRef}
          value={formData.title}
          onChange={handleInputChange}
          required
          placeholder="Post title"
          className="form-control"
          disabled={loading || !isAuthenticated}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="category">Category *</label>
        <CategorySelector
          selectedCategoryId={formData.category_id}
          onCategoryChange={handleCategoryChange}
          disabled={loading || !isAuthenticated}
          showOnlyActive={true}
          maxVisibleItems={4}
          showAllInitially={false}
        />
      </div>
      
      <div className="form-group">
        <label htmlFor="content">Content *</label>
        <textarea
          id="content"
          name="content"
          ref={contentRef}
          value={formData.content}
          onChange={handleInputChange}
          required
          rows={6}
          placeholder="Write your content here..."
          className="form-control"
          disabled={loading || !isAuthenticated}
        />
        <div className="content-tips">
          <small>
            <i className="fas fa-info-circle"></i>
            Use @mention to mention a user and #tag to create tags
          </small>
        </div>
      </div>
      
      <div className="form-group">
        <label htmlFor="link">Link (optional)</label>
        <input
          type="url"
          id="link"
          name="link"
          value={formData.link}
          onChange={handleInputChange}
          placeholder="https://example.com"
          className="form-control"
          disabled={loading || !isAuthenticated}
        />
      </div>
    </div>
  );

  // Contenu de l'étape 2
  const renderStep2 = () => (
    <div className="step-content step-2">
      <div className="step-description">
        <h4><i className="fas fa-paperclip"></i> Add Attachments</h4>
        <p>You can add images, videos, audio files, and documents to your post (optional).</p>
      </div>
      
      <FileUploadSection
        type="images"
        title="Images"
        icon="fas fa-images"
        files={files.images}
        previews={previews.images}
        onFileSelect={handleFileSelect}
        onRemoveFile={(index) => removeFile('images', index)}
        maxFiles={10}
        accept="image/*"
        loading={loading}
        disabled={!isAuthenticated}
      />
      
      <FileUploadSection
        type="videos"
        title="Videos"
        icon="fas fa-video"
        files={files.videos}
        previews={previews.videos}
        onFileSelect={handleFileSelect}
        onRemoveFile={(index) => removeFile('videos', index)}
        maxFiles={5}
        accept="video/*"
        loading={loading}
        disabled={!isAuthenticated}
      />
      
      <FileUploadSection
        type="audio"
        title="Audio"
        icon="fas fa-music"
        files={files.audio}
        previews={previews.audio}
        onFileSelect={handleFileSelect}
        onRemoveFile={(index) => removeFile('audio', index)}
        maxFiles={5}
        accept="audio/*"
        loading={loading}
        disabled={!isAuthenticated}
      />
      
      <FileUploadSection
        type="documents"
        title="Documents"
        icon="fas fa-file"
        files={files.documents}
        previews={previews.documents}
        onFileSelect={handleFileSelect}
        onRemoveFile={(index) => removeFile('documents', index)}
        maxFiles={5}
        accept=".pdf,.doc,.docx,.txt,.zip,.rar,.pptx,.xlsx"
        loading={loading}
        disabled={!isAuthenticated}
      />
      
      <FileSummary files={files} />
    </div>
  );

  // Contenu de l'étape 3
  const renderStep3 = () => (
    <div className="step-content step-3">
      <div className="step-description">
        <h4><i className="fas fa-check-circle"></i> Review Your Post</h4>
        <p>Please review all information before publishing.</p>
      </div>
      
      <div className="review-section">
        <h5><i className="fas fa-info-circle"></i> Basic Information</h5>
        <div className="review-grid">
          <div className="review-item">
            <label>Title:</label>
            <div className="review-value">{formData.title || <span className="text-muted">Not provided</span>}</div>
          </div>
          <div className="review-item">
            <label>Category ID:</label>
            <div className="review-value">{formData.category_id || <span className="text-muted">Not selected</span>}</div>
          </div>
          <div className="review-item">
            <label>Link:</label>
            <div className="review-value">{formData.link || <span className="text-muted">Not provided</span>}</div>
          </div>
        </div>
        
        <div className="review-item full-width">
          <label>Content:</label>
          <div className="review-value content-preview">
            {formData.content || <span className="text-muted">Not provided</span>}
          </div>
        </div>
      </div>
      
      <div className="review-section">
        <h5><i className="fas fa-paperclip"></i> Attachments Summary</h5>
        <FileSummary files={files}  previews={previews} />
        
      </div>
      
      <div className="confirmation-box">
        <div className="form-check">
          <input 
            type="checkbox" 
            id="confirmPost" 
            className="form-check-input"
            checked={stepCompleted.step3}
            onChange={(e) => setStepCompleted(prev => ({ ...prev, step3: e.target.checked }))}
          />
          <label htmlFor="confirmPost" className="form-check-label">
            <strong>I confirm that all information is correct</strong>
            <small>Please check this box before publishing</small>
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <div className="post-create-container">
      <div className="post-create-card">
        <div className="post-create-header">
          <h2 className="post-create-title">
            {initialData ? ' Edit Post' : ' Create New Post'}
          </h2>
          <div className="step-counter">
            Step {currentStep} of 3
          </div>
        </div>
        
        {!isAuthenticated && (
          <Alert 
            type="warning" 
            message="Please log in to create a post" 
          />
        )}
        
        {error && (
          <Alert type="error" message={error} />
        )}
        
        {success && (
          <Alert type="success" message={success} />
        )}
        
        <StepIndicator />
        
        <form onSubmit={handleSubmit} className="post-create-form">
          {/* Afficher le contenu de l'étape actuelle */}
          {currentStep === 1 && renderStep1()}
          {currentStep === 2 && renderStep2()}
          {currentStep === 3 && renderStep3()}
          
          {/* Navigation buttons */}
          <div className="step-navigation">
            {currentStep > 1 && (
              <button
                type="button"
                onClick={prevStep}
                className="btn-step btn-prev"
                disabled={loading}
              >
                <i className="fas fa-arrow-left"></i> Previous
              </button>
            )}
            
            {currentStep < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                className="btn-step btn-next"
                disabled={loading || (currentStep === 1 && !stepCompleted.step1)}
              >
                Next <i className="fas fa-arrow-right"></i>
              </button>
            ) : (
              <button
                type="submit"
                className="btn-step btn-submit"
                disabled={loading || !isAuthenticated || !formData.category_id || !stepCompleted.step3}
              >
                {loading ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    {initialData ? 'Updating...' : 'Publishing...'}
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    {initialData ? 'Update Post' : 'Publish Post'}
                  </>
                )}
              </button>
            )}
            
            {initialData && currentStep === 1 && (
              <button
                type="button"
                onClick={() => onPostCreated && onPostCreated(null)}
                className="btn-step btn-cancel"
                disabled={loading}
              >
                <i className="fas fa-times"></i> Cancel
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default PostCreate;