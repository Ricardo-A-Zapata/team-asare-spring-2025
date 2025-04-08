import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import { BACKEND_URL } from '../../constants';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPT_CREATE_ENDPOINT = `${backendUrl}/manuscripts/create`;

function AddManuscriptForm({
  visible,
  cancel,
  fetchManuscripts,
  setError,
  setIsOperationLoading
}) {
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [authorEmail, setAuthorEmail] = useState('');
  const [abstract, setAbstract] = useState('');
  const [text, setText] = useState('');
  const titleInputRef = useRef(null);

  // Focus the title input when the form becomes visible
  useEffect(() => {
    if (visible && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [visible]);

  const changeTitle = (event) => { setTitle(event.target.value); };
  const changeAuthor = (event) => { setAuthor(event.target.value); };
  const changeAuthorEmail = (event) => { setAuthorEmail(event.target.value); };
  const changeAbstract = (event) => { setAbstract(event.target.value); };
  const changeText = (event) => { setText(event.target.value); };

  const addManuscript = async (event) => {
    event.preventDefault();
    
    if (!title || !author || !authorEmail || !abstract || !text) {
      setError('All fields are required');
      return;
    }
    
    const newManuscript = {
      title,
      author,
      author_email: authorEmail,
      abstract,
      text
    };
    
    try {
      setIsOperationLoading(true);
      await axios.put(MANUSCRIPT_CREATE_ENDPOINT, newManuscript);
      await fetchManuscripts();
      cancel();
    } catch (error) {
      setError(`Error creating manuscript: ${error.response?.data?.message || error.message}`);
      console.error('Error creating manuscript:', error);
    } finally {
      setIsOperationLoading(false);
    }
  };

  if (!visible) return null;
  
  return (
    <div className="form-container">
      <h3>Submit New Manuscript</h3>
      
      <form className="manuscript-form">
        <div className="form-fields">
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input 
              required 
              type="text" 
              id="title" 
              value={title} 
              onChange={changeTitle}
              ref={titleInputRef}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="author">Author Name</label>
            <input 
              required 
              type="text" 
              id="author" 
              value={author} 
              onChange={changeAuthor}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="authorEmail">Author Email</label>
            <input 
              required 
              type="email" 
              id="authorEmail" 
              value={authorEmail} 
              onChange={changeAuthorEmail}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="abstract">Abstract</label>
            <textarea 
              required 
              id="abstract" 
              value={abstract} 
              onChange={changeAbstract}
              rows="4"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="text">Manuscript Text</label>
            <textarea 
              required 
              id="text" 
              value={text} 
              onChange={changeText}
              rows="8"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={cancel}>Cancel</button>
          <button type="submit" onClick={addManuscript}>Submit</button>
        </div>
      </form>
    </div>
  );
}

AddManuscriptForm.propTypes = {
  visible: PropTypes.bool.isRequired,
  cancel: PropTypes.func.isRequired,
  fetchManuscripts: PropTypes.func.isRequired,
  setError: PropTypes.func.isRequired,
  setIsOperationLoading: PropTypes.func.isRequired
};

export default AddManuscriptForm; 