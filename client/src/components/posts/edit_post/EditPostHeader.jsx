// src/components/post/components/EditPostHeader.jsx
import React from 'react';
import { FaArrowLeft, FaSave } from 'react-icons/fa';
import PropTypes from 'prop-types';

const EditPostHeader = ({ onBack, saving }) => {
  return (
    <div className="edit-post-header">
      <button 
        className="back-button"
        onClick={onBack}
        disabled={saving}
      >
        <FaArrowLeft /> Back
      </button>
      
      <h1>
        <FaSave /> Edit Post
      </h1>
    </div>
  );
};

EditPostHeader.propTypes = {
  onBack: PropTypes.func.isRequired,
  saving: PropTypes.bool.isRequired
};

export default EditPostHeader;