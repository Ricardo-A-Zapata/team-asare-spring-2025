import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../constants';
import AboutEdit from './AboutEdit';
import './About.css';
import { useAuth } from '../../AuthContext';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const TEXT_READ_ENDPOINT = `${backendUrl}/text/read/AboutPage`;
const TEXT_READ_MISSION_ENDPOINT = `${backendUrl}/text/read/MissionPage`;

function About() {
  const [isEditing, setIsEditing] = useState(false);
  const [editSection, setEditSection] = useState(null); // 'main', 'mission'
  const [content, setContent] = useState(null);
  const [missionContent, setMissionContent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn } = useAuth();

  useEffect(() => {
    const fetchContent = async () => {
      try {
        setIsLoading(true);
        // Fetch main about content
        try {
          const response = await axios.get(TEXT_READ_ENDPOINT);
          if (response.data && response.data.Content) {
            setContent(response.data.Content);
          }
        } catch (error) {
          console.error('Error fetching about content:', error);
          // If there's an error, we'll use the static content
        }

        // Fetch mission statement content
        try {
          const missionResponse = await axios.get(TEXT_READ_MISSION_ENDPOINT);
          if (missionResponse.data && missionResponse.data.Content) {
            setMissionContent(missionResponse.data.Content);
          }
        } catch (error) {
          console.error('Error fetching mission content:', error);
          // If there's an error, we'll use the static content
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchContent();
  }, []);

  const handleEditClick = (section) => {
    setEditSection(section);
    setIsEditing(true);
  };

  const handleSave = (updatedContent) => {
    if (editSection === 'main') {
      setContent(updatedContent);
    } else if (editSection === 'mission') {
      setMissionContent(updatedContent);
    }
    setIsEditing(false);
    setEditSection(null);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditSection(null);
  };

  if (isEditing) {
    const editContent = editSection === 'main' ? content : missionContent;
    const textKey = editSection === 'main' ? 'AboutPage' : 'MissionPage';
    return <AboutEdit 
      content={editContent} 
      textKey={textKey}
      onSave={handleSave} 
      onCancel={handleCancel}
      titleEditable={false}
    />;
  }

  return (
    <div className="about-container">
      <div className="about-hero">
        <div className="about-header">
          <h1>{content?.title || 'About Our Journal'}</h1>
          {isLoggedIn && (
            <button
              className="edit-button"
              onClick={() => handleEditClick('main')}
            >
              Edit Page
            </button>
          )}
        </div>
        
        {isLoading ? (
          <p>Loading content...</p>
        ) : (
          <div className="about-content">
            <p>
              {content?.text || 
                'Welcome to our academic journal, a collaborative project by NYU students dedicated to advancing knowledge and fostering scholarly discourse in our field. Our journal serves as a platform for researchers, scholars, and practitioners to share their findings and contribute to the ongoing development of our discipline.'}
            </p>
          </div>
        )}
      </div>

      <section className="about-section mission-section">
        <div className="section-header">
          <h2>Mission Statement</h2>
          {isLoggedIn && (
            <button
              className="edit-button"
              onClick={() => handleEditClick('mission')}
            >
              Edit Mission
            </button>
          )}
        </div>
        
        {isLoading ? (
          <p>Loading mission statement...</p>
        ) : (
          <div className="mission-content">
            <p>
              {missionContent?.text || 
                'Our mission is to publish high-quality, peer-reviewed research that contributes to the advancement of knowledge in our field. We are committed to maintaining the highest standards of academic integrity and providing a platform for diverse perspectives and innovative research.'}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

export default About; 