import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

import { BACKEND_URL } from '../../constants';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
// const MANUSCRIPT_CREATE_ENDPOINT = `${backendUrl}/manuscripts`;
const MANUSCRIPT_CREATE_ENDPOINT = `${backendUrl}/manuscript/create`;
const USERS_READ_ENDPOINT = `${backendUrl}/user/read`;

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
  const [authors, setAuthors] = useState([]);
  const [isLoadingAuthors, setIsLoadingAuthors] = useState(false);
  const [selectedAuthorId, setSelectedAuthorId] = useState('');
  const titleInputRef = useRef(null);

  // Focus the title input when the form becomes visible
  useEffect(() => {
    if (visible && titleInputRef.current) {
      titleInputRef.current.focus();
    }
  }, [visible]);

  // Fetch users with the AU role when the form becomes visible
  useEffect(() => {
    if (visible) {
      fetchAuthors();
    }
  }, [visible]);

  const fetchAuthors = async () => {
    try {
      setIsLoadingAuthors(true);
      // First get all users
      const usersResponse = await axios.get(USERS_READ_ENDPOINT);
      if (usersResponse.data && usersResponse.data.Users) {
        // Convert from object to array if needed
        let users = usersResponse.data.Users;
        if (!Array.isArray(users) && typeof users === 'object') {
          users = Object.values(users);
        }
        
        // Filter users with the 'AU' role
        const authorUsers = users.filter(user => {
          // Check in both roleCodes and roles arrays for backward compatibility
          const roleCodes = user.roleCodes || [];
          const roles = user.roles || [];
          return roleCodes.includes('AU') || roles.includes('AU');
        });
        
        setAuthors(authorUsers);
      }
    } catch (error) {
      console.error('Error fetching authors:', error);
      setError('Could not load authors. Please try again later.');
    } finally {
      setIsLoadingAuthors(false);
    }
  };

  const handleAuthorChange = (e) => {
    const authorId = e.target.value;
    setSelectedAuthorId(authorId);
    
    if (authorId) {
      const selectedAuthor = authors.find(a => a.email === authorId);
      if (selectedAuthor) {
        setAuthor(selectedAuthor.name);
        setAuthorEmail(selectedAuthor.email);
      }
    } else {
      // Clear author fields if no selection
      setAuthor('');
      setAuthorEmail('');
    }
  };

  const handleSubmit = async (event) => {
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
      text,
      state: "SUBMITTED"
    };
    
    try {
      setIsOperationLoading(true);
      console.log('Sending manuscript to:', MANUSCRIPT_CREATE_ENDPOINT);
      console.log('Manuscript data:', newManuscript);
      const response = await axios.put(MANUSCRIPT_CREATE_ENDPOINT, newManuscript);
      console.log('Server response:', response);
      await fetchManuscripts();
      // Reset form
      setTitle('');
      setAuthor('');
      setAuthorEmail('');
      setAbstract('');
      setText('');
      setSelectedAuthorId('');
      // Close form
      cancel();
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      setError(`Error creating manuscript: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsOperationLoading(false);
    }
  };

  if (!visible) return null;
  
  return (
    <div className="form-container">
      <h3>Submit New Manuscript</h3>
      
      <form onSubmit={handleSubmit} className="manuscript-form">
        <div className="form-fields">
          <div className="form-field">
            <label htmlFor="authorSelect">Select Author</label>
            {isLoadingAuthors ? (
              <div className="loading-text">Loading authors...</div>
            ) : (
              <>
                <select
                  id="authorSelect"
                  value={selectedAuthorId}
                  onChange={handleAuthorChange}
                  required
                >
                  <option value="">-- Select an Author --</option>
                  {authors.map((author) => (
                    <option key={author.email} value={author.email}>
                      {author.name} ({author.email})
                    </option>
                  ))}
                </select>
                
                {selectedAuthorId && (
                  <div className="selected-author-info">
                    <p><strong>Name:</strong> {author}</p>
                    <p><strong>Email:</strong> {authorEmail}</p>
                  </div>
                )}
              </>
            )}
          </div>
          
          <div className="form-field">
            <label htmlFor="title">Title</label>
            <input 
              required 
              type="text" 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              ref={titleInputRef}
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="abstract">Abstract</label>
            <textarea 
              required 
              id="abstract" 
              value={abstract} 
              onChange={(e) => setAbstract(e.target.value)}
              rows="4"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="text">Manuscript Text</label>
            <textarea 
              required 
              id="text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              rows="8"
            />
          </div>
        </div>
        
        <div className="form-actions">
          <button type="button" onClick={cancel}>Cancel</button>
          <button type="submit" disabled={!selectedAuthorId}>Submit</button>
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