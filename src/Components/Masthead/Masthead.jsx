import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../constants';
import AboutEdit from '../About/AboutEdit';
import './Masthead.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const TEXT_READ_ENDPOINT = `${backendUrl}/text/read/MastheadPage`;

function Masthead() {
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        // Fetch masthead content
        try {
          const response = await axios.get(TEXT_READ_ENDPOINT);
          if (response.data && response.data.Content) {
            setContent(response.data.Content);
          }
        } catch (error) {
          console.error('Error fetching masthead content:', error);
          // If there's an error, we'll use the static content
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = (updatedContent) => {
    setContent(updatedContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return <AboutEdit 
      content={content} 
      textKey="MastheadPage"
      onSave={handleSave} 
      onCancel={handleCancel}
      titleEditable={false}
    />;
  }

  return (
    <div className="masthead-container">
      <div className="masthead-header">
        <h1>Editorial Board</h1>
        {isLoggedIn && (
          <button
            className="edit-button"
            onClick={handleEditClick}
          >
            Edit Introduction
          </button>
        )}
      </div>

      <section className="masthead-section introduction">
        {isLoading ? (
          <p>Loading content...</p>
        ) : (
          <p>
            {content?.text || 
              'Our editorial board consists of distinguished faculty and researchers who are committed to maintaining the highest standards of academic excellence.'}
          </p>
        )}
      </section>

      <section className="masthead-section masthead">
        <h2>Editorial Board Members</h2>
        
        <div className="role-section">
          <h3>Administrators</h3>
          <div className="editors-grid">
            <div className="editor-card admin">
              <h4>Aayush Daftary</h4>
              <p className="title">Lead Administrator</p>
              <p>New York University</p>
              <p>asd572@nyu.edu</p>
            </div>
            
            <div className="editor-card admin">
              <h4>Aurora Cruci</h4>
              <p className="title">System Administrator</p>
              <p>New York University</p>
              <p>aac9988@nyu.edu</p>
            </div>
          </div>
        </div>

        <div className="role-section">
          <h3>Editorial Staff</h3>
          <div className="editors-grid">
            <div className="editor-card">
              <h4>Eli Edme</h4>
              <p className="title">Editor</p>
              <p>New York University</p>
              <p>eae8374@nyu.edu</p>
            </div>

            <div className="editor-card">
              <h4>Ricky Zapata</h4>
              <p className="title">Editor</p>
              <p>New York University</p>
              <p>raz6675@nyu.edu</p>
            </div>
          </div>
        </div>

        <div className="role-section">
          <h3>Referees</h3>
          <div className="editors-grid">
            <div className="editor-card referee">
              <h4>Sam Huppert</h4>
              <p className="title">Lead Referee</p>
              <p>New York University</p>
              <p>sjh9967@nyu.edu</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Masthead; 