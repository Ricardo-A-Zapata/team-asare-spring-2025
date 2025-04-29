import React, { useState } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { BACKEND_URL } from '../../constants';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const TEXT_CREATE_ENDPOINT = `${backendUrl}/text/create`;
const TEXT_UPDATE_ENDPOINT = `${backendUrl}/text/update`;

function AboutEdit({ content, textKey, onSave, onCancel, titleEditable = true }) {
  const [title, setTitle] = useState(content?.title || 'Section Title');
  const [text, setText] = useState(content?.text || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTitleChange = (e) => setTitle(e.target.value);
  const handleTextChange = (e) => setText(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!text.trim()) {
      setError('Content is required.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Prepare payload for the text API
      const payload = {
        key: textKey,
        title: title.trim(),
        text: text.trim()
      };

      // Use update endpoint with PUT method if we already have content (edit mode)
      if (content) {
        await axios.put(TEXT_UPDATE_ENDPOINT, payload);
      } else {
        // Use create endpoint with POST method for new content
        await axios.post(TEXT_CREATE_ENDPOINT, payload);
      }
      
      onSave({ title: title.trim(), text: text.trim() });
    } catch (error) {
      console.error('Error saving content:', error);
      setError(`Failed to save: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  // Determine title based on the section being edited
  const getEditTitle = () => {
    switch(textKey) {
      case 'MissionPage':
        return 'Edit Mission Statement';
      case 'HomePage':
        return 'Edit Home Page';
      case 'MastheadPage':
        return 'Edit Editorial Board Introduction';
      case 'AboutPage':
      default:
        return 'Edit About Page';
    }
  };

  return (
    <div className="about-edit-container">
      <h2>{getEditTitle()}</h2>
      
      <form onSubmit={handleSubmit} className="about-edit-form">
        {titleEditable && (
          <div className="form-group">
            <label htmlFor="title">Section Title</label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={handleTitleChange}
              disabled={isLoading}
              required
            />
          </div>
        )}
        
        <div className="form-group">
          <label htmlFor="content">Content</label>
          <textarea
            id="content"
            value={text}
            onChange={handleTextChange}
            rows={10}
            disabled={isLoading}
            required
          />
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="save-button"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}

AboutEdit.propTypes = {
  content: PropTypes.shape({
    title: PropTypes.string,
    text: PropTypes.string
  }),
  textKey: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  titleEditable: PropTypes.bool
};

export default AboutEdit; 