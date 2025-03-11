import React from 'react';
import PropTypes from 'prop-types';

function Loading({ message = "Loading..." }) {
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
