import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { useAuth } from '../../AuthContext';
import { useNavigate } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';
import './AddManuscriptForm.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
// const MANUSCRIPT_CREATE_ENDPOINT = `${backendUrl}/manuscripts`;
const MANUSCRIPT_CREATE_ENDPOINT = `${backendUrl}/manuscript/create`;
const USERS_READ_ENDPOINT = `${backendUrl}/user/read`;

function AddManuscriptForm() {
  const [title, setTitle] = useState('');
  const [abstract, setAbstract] = useState('');
  const [text, setText] = useState('');
  const [userInfo, setUserInfo] = useState(null);
  const [guestAuthor, setGuestAuthor] = useState('');
  const [guestEmail, setGuestEmail] = useState('');
  const [guestAffiliation, setGuestAffiliation] = useState('');
  const [error, setError] = useState('');
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const titleInputRef = useRef(null);
  const { userEmail } = useAuth();
  const navigate = useNavigate();

  // Focus the title input when the form becomes visible
  useEffect(() => {
    if (titleInputRef.current) {
      setTimeout(() => {
        titleInputRef.current.focus();
      }, 100);
    }
  }, []);

  // Fetch user info if user is logged in
  useEffect(() => {
    if (userEmail) {
      fetchUserInfo();
    }
  }, [userEmail]);

  const fetchUserInfo = async () => {
    try {
      const { data } = await axios.get(USERS_READ_ENDPOINT);
      if (data && data.Users) {
        const users = Object.values(data.Users);
        const currentUser = users.find(user => user.email === userEmail);
        if (currentUser) {
          setUserInfo(currentUser);
        } else {
          setError('Could not find user information. Please try again later.');
        }
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setError('Could not load user information. Please try again later.');
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    
    if (!title || !abstract || !text) {
      setError('Title, abstract, and text are required');
      return;
    }

    if (!userInfo && (!guestAuthor || !guestEmail)) {
      setError('Author name and email are required for guest submissions');
      return;
    }
    
    const newManuscript = {
      title,
      author: userInfo ? userInfo.name : guestAuthor,
      author_email: userInfo ? userInfo.email : guestEmail,
      author_affiliation: userInfo ? userInfo.affiliation : guestAffiliation,
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
      
      // Show success message and redirect
      alert('Manuscript submitted successfully!');
      navigate('/');
    } catch (error) {
      console.error('Full error object:', error);
      console.error('Error response:', error.response);
      console.error('Error request:', error.request);
      setError(`Error creating manuscript: ${error.response?.data?.message || error.message}`);
    } finally {
      setIsOperationLoading(false);
    }
  };

  return (
    <div className="form-container">
      <h3>
        Submit New Manuscript
        {!userInfo && <span className="guest-badge">Guest Submission</span>}
      </h3>
      
      <form onSubmit={handleSubmit} className="manuscript-form">
        <div className="form-fields">
          {userInfo ? (
            <div className="form-field">
              <label>Author Information (Logged In)</label>
              <div className="selected-author-info">
                <p><strong>Name:</strong> {userInfo.name}</p>
                <p><strong>Email:</strong> {userInfo.email}</p>
                {userInfo.affiliation && (
                  <p><strong>Affiliation:</strong> {userInfo.affiliation}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="form-field">
              <label>Author Information (Guest Submission)</label>
              <div className="guest-author-fields">
                <div className="form-field">
                  <label htmlFor="guestAuthor">Name *</label>
                  <input
                    type="text"
                    id="guestAuthor"
                    value={guestAuthor}
                    onChange={(e) => setGuestAuthor(e.target.value)}
                    required
                    placeholder="Enter your name"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="guestEmail">Email *</label>
                  <input
                    type="email"
                    id="guestEmail"
                    value={guestEmail}
                    onChange={(e) => setGuestEmail(e.target.value)}
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-field">
                  <label htmlFor="guestAffiliation">Affiliation (Optional)</label>
                  <input
                    type="text"
                    id="guestAffiliation"
                    value={guestAffiliation}
                    onChange={(e) => setGuestAffiliation(e.target.value)}
                    placeholder="Enter your affiliation"
                  />
                </div>
              </div>
            </div>
          )}
          
          <div className="form-field">
            <label htmlFor="title">Title *</label>
            <input 
              required 
              type="text" 
              id="title" 
              value={title} 
              onChange={(e) => setTitle(e.target.value)}
              ref={titleInputRef}
              placeholder="Enter manuscript title"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="abstract">Abstract *</label>
            <textarea 
              required 
              id="abstract" 
              value={abstract} 
              onChange={(e) => setAbstract(e.target.value)}
              rows="4"
              placeholder="Provide a brief summary of your manuscript"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="text">Manuscript Text *</label>
            <textarea 
              required 
              id="text" 
              value={text} 
              onChange={(e) => setText(e.target.value)}
              rows="8"
              placeholder="Enter the full text of your manuscript"
            />
          </div>
        </div>
        
        {error && <div className="error-message">{error}</div>}
        
        <div className="form-actions">
          <button type="button" onClick={() => navigate('/')}>Cancel</button>
          <button 
            type="submit" 
            disabled={isOperationLoading}
            title="Submit manuscript"
          >
            {isOperationLoading ? 'Submitting...' : 'Submit'}
          </button>
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