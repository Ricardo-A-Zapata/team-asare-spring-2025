import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Loading.css';

function Loading({ message = "Loading..." }) {
  useEffect(() => {
    // Cleanup function
    return () => {
      // Empty cleanup to ensure proper unmounting
    };
  }, []);

  return (
    <div className="loading">
      <div className="spinner"></div>
      <p>{message}</p>
    </div>
  );
}

Loading.propTypes = {
  message: PropTypes.string
};

export default Loading;
