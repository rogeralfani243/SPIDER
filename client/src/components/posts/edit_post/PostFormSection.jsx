// src/components/post/components/PostFormSection.jsx
import React from 'react';
import PropTypes from 'prop-types';

const PostFormSection = ({ title, children, className = '' }) => {
  return (
    <div className={`form-section ${className}`}>
      <h3>{title}</h3>
      {children}
    </div>
  );
};

PostFormSection.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default PostFormSection;