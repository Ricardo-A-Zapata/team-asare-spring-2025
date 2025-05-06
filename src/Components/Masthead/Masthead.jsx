import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../constants';
import AboutEdit from '../About/AboutEdit';
import './Masthead.css';
import { useAuth } from '../../AuthContext';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const TEXT_READ_ENDPOINT = `${backendUrl}/text/read`;
const TEXT_UPDATE_ENDPOINT = `${backendUrl}/text/update`;
const USERS_READ_ENDPOINT = `${backendUrl}/user/read`;

// Text keys for different sections
const TEXT_KEYS = {
  INTRO: 'MastheadPage',
  ADMINISTRATORS_INTRO: 'MastheadAdministratorsIntro',
  EDITORS_INTRO: 'MastheadEditorsIntro',
  REFEREES_INTRO: 'MastheadRefereesIntro',
  ADMIN_1: 'MastheadAdmin1',
  ADMIN_2: 'MastheadAdmin2',
  EDITOR_1: 'MastheadEditor1',
  EDITOR_2: 'MastheadEditor2',
  REFEREE_1: 'MastheadReferee1'
};

// Default content in case API requests fail
const DEFAULT_CONTENT = {
  [TEXT_KEYS.INTRO]: {
    title: 'Editorial Board',
    text: 'Our editorial board consists of distinguished faculty and researchers who are committed to maintaining the highest standards of academic excellence.'
  },
  [TEXT_KEYS.ADMINISTRATORS_INTRO]: {
    title: 'Administrators',
    text: 'Our administrative team oversees the journal operations and ensures smooth functioning of all processes.'
  },
  [TEXT_KEYS.EDITORS_INTRO]: {
    title: 'Editorial Staff',
    text: 'Our editors are responsible for reviewing and selecting manuscripts for publication.'
  },
  [TEXT_KEYS.REFEREES_INTRO]: {
    title: 'Referees',
    text: 'Our referees provide expert evaluation of submitted manuscripts.'
  },
  [TEXT_KEYS.ADMIN_1]: {
    title: 'Lead Administrator',
    text: 'Aayush Daftary\nNew York University\nasd572@nyu.edu'
  },
  [TEXT_KEYS.ADMIN_2]: {
    title: 'System Administrator',
    text: 'Aurora Cruci\nNew York University\naac9988@nyu.edu'
  },
  [TEXT_KEYS.EDITOR_1]: {
    title: 'Editor',
    text: 'Eli Edme\nNew York University\neae8374@nyu.edu'
  },
  [TEXT_KEYS.EDITOR_2]: {
    title: 'Editor',
    text: 'Ricky Zapata\nNew York University\nraz6675@nyu.edu'
  },
  [TEXT_KEYS.REFEREE_1]: {
    title: 'Lead Referee',
    text: 'Sam Huppert\nNew York University\nsjh9967@nyu.edu'
  }
};

function Masthead() {
  const [isEditing, setIsEditing] = useState(false);
  const [currentEditKey, setCurrentEditKey] = useState('');
  const [contents, setContents] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const { isLoggedIn, userEmail } = useAuth();
  const [isEditor, setIsEditor] = useState(false);

  useEffect(() => {
    const checkIfEditor = async () => {
      if (!isLoggedIn || !userEmail) {
        setIsEditor(false);
        return;
      }
      
      try {
        const response = await axios.get(USERS_READ_ENDPOINT);
        if (response.data && response.data.Users) {
          const users = Object.values(response.data.Users);
          const currentUser = users.find(user => user.email === userEmail);
          
          if (currentUser && currentUser.roleCodes) {
            setIsEditor(currentUser.roleCodes.includes('ED'));
          }
        }
      } catch (error) {
        console.error('Error checking editor status:', error);
      }
    };
    
    checkIfEditor();
  }, [isLoggedIn, userEmail]);

  useEffect(() => {
    const fetchAllContent = async () => {
      try {
        setIsLoading(true);
        
        // Initialize contents with default values
        const initialContents = { ...DEFAULT_CONTENT };
        
        // Fetch content for each text key and create if missing
        for (const key of Object.values(TEXT_KEYS)) {
          try {
            // Try to fetch the existing content
            const response = await axios.get(`${TEXT_READ_ENDPOINT}/${key}`);
            if (response.data && response.data.Content) {
              initialContents[key] = response.data.Content;
            }
          } catch (error) {
            console.warn(`Error fetching content for ${key}:`, error);
            
            // If it's a 404 Not Found error, create the text entry
            if (error.response && error.response.status === 404) {
              try {
                console.log(`Creating missing text entry for ${key}`);
                await axios.post(`${backendUrl}/text/create`, {
                  key: key,
                  title: DEFAULT_CONTENT[key].title,
                  text: DEFAULT_CONTENT[key].text
                });
                
                // After creating, set the content to our default
                initialContents[key] = DEFAULT_CONTENT[key];
              } catch (createError) {
                console.error(`Failed to create text entry for ${key}:`, createError);
                // Keep using the default content for this key
              }
            }
          }
        }
        
        setContents(initialContents);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAllContent();
  }, []);

  const handleEditClick = (textKey) => {
    setCurrentEditKey(textKey);
    setIsEditing(true);
  };

  const handleSave = async (updatedContent) => {
    if (!currentEditKey) return;
    
    try {
      setIsLoading(true);
      
      // First try to update the existing entry
      try {
        await axios.put(TEXT_UPDATE_ENDPOINT, {
          key: currentEditKey,
          title: updatedContent.title,
          text: updatedContent.text
        });
      } catch (updateError) {
        // If update fails with 406 (Not Acceptable) or 404 (Not Found), try to create a new entry
        if (updateError.response && 
           (updateError.response.status === 406 || updateError.response.status === 404)) {
          console.log(`Creating new text entry for ${currentEditKey} since update failed`);
          await axios.post(`${backendUrl}/text/create`, {
            key: currentEditKey,
            title: updatedContent.title,
            text: updatedContent.text
          });
        } else {
          // Rethrow if it's not a 406/404 error
          throw updateError;
        }
      }
      
      // Update local state
      setContents(prev => ({
        ...prev,
        [currentEditKey]: updatedContent
      }));
      
      // Refetch to ensure we have the latest data
      try {
        const refreshResponse = await axios.get(`${TEXT_READ_ENDPOINT}/${currentEditKey}`);
        if (refreshResponse.data && refreshResponse.data.Content) {
          setContents(prev => ({
            ...prev,
            [currentEditKey]: refreshResponse.data.Content
          }));
        }
      } catch (refreshError) {
        console.warn(`Error refreshing content for ${currentEditKey} after update:`, refreshError);
        // We already updated the local state, so we can continue
      }
      
    } catch (error) {
      console.error("Error updating content:", error);
      let errorMessage = "There was a problem saving the changes. Please try again.";
      if (error.response && error.response.data && error.response.data.message) {
        errorMessage = error.response.data.message;
      }
      alert(errorMessage);
    } finally {
      setIsLoading(false);
      setIsEditing(false);
      setCurrentEditKey('');
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setCurrentEditKey('');
  };

  // Helper function to format person card content
  const formatPersonContent = (content) => {
    if (!content) return ['', '', ''];
    
    // Use default if no text or empty text
    const text = (content.text && content.text.trim()) ? content.text : '';
    
    if (!text) return ['', '', ''];
    
    const lines = text.split('\n');
    return [
      lines[0] || '', // Name
      lines[1] || '', // Affiliation
      lines[2] || ''  // Email
    ];
  };

  if (isEditing && currentEditKey) {
    return <AboutEdit 
      content={contents[currentEditKey]} 
      textKey={currentEditKey}
      onSave={handleSave} 
      onCancel={handleCancel}
      titleEditable={true}
    />;
  }

  return (
    <div className="masthead-container">
      <div className="masthead-header">
        <h1>{contents[TEXT_KEYS.INTRO]?.title || DEFAULT_CONTENT[TEXT_KEYS.INTRO].title}</h1>
        {isEditor && (
          <button
            className="edit-button"
            onClick={() => handleEditClick(TEXT_KEYS.INTRO)}
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
            {contents[TEXT_KEYS.INTRO]?.text || DEFAULT_CONTENT[TEXT_KEYS.INTRO].text}
          </p>
        )}
      </section>

      <section className="masthead-section masthead">
        <h2>Editorial Board Members</h2>
        
        <div className="role-section">
          <div className="section-header">
            <h3>{contents[TEXT_KEYS.ADMINISTRATORS_INTRO]?.title || DEFAULT_CONTENT[TEXT_KEYS.ADMINISTRATORS_INTRO].title}</h3>
            {isEditor && (
              <button
                className="edit-button small"
                onClick={() => handleEditClick(TEXT_KEYS.ADMINISTRATORS_INTRO)}
              >
                Edit
              </button>
            )}
          </div>
          {isLoading ? (
            <p>Loading content...</p>
          ) : (
            <p className="section-intro">
              {contents[TEXT_KEYS.ADMINISTRATORS_INTRO]?.text || DEFAULT_CONTENT[TEXT_KEYS.ADMINISTRATORS_INTRO].text}
            </p>
          )}
          <div className="editors-grid">
            <div className="editor-card admin">
              {isEditor && (
                <button
                  className="edit-button small corner"
                  onClick={() => handleEditClick(TEXT_KEYS.ADMIN_1)}
                >
                  Edit
                </button>
              )}
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <h4>{formatPersonContent(contents[TEXT_KEYS.ADMIN_1])[0]}</h4>
                  <p className="title">{contents[TEXT_KEYS.ADMIN_1]?.title || DEFAULT_CONTENT[TEXT_KEYS.ADMIN_1].title}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.ADMIN_1])[1]}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.ADMIN_1])[2]}</p>
                </>
              )}
            </div>
            
            <div className="editor-card admin">
              {isEditor && (
                <button
                  className="edit-button small corner"
                  onClick={() => handleEditClick(TEXT_KEYS.ADMIN_2)}
                >
                  Edit
                </button>
              )}
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <h4>{formatPersonContent(contents[TEXT_KEYS.ADMIN_2])[0]}</h4>
                  <p className="title">{contents[TEXT_KEYS.ADMIN_2]?.title || DEFAULT_CONTENT[TEXT_KEYS.ADMIN_2].title}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.ADMIN_2])[1]}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.ADMIN_2])[2]}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="role-section">
          <div className="section-header">
            <h3>{contents[TEXT_KEYS.EDITORS_INTRO]?.title || DEFAULT_CONTENT[TEXT_KEYS.EDITORS_INTRO].title}</h3>
            {isEditor && (
              <button
                className="edit-button small"
                onClick={() => handleEditClick(TEXT_KEYS.EDITORS_INTRO)}
              >
                Edit
              </button>
            )}
          </div>
          {isLoading ? (
            <p>Loading content...</p>
          ) : (
            <p className="section-intro">
              {contents[TEXT_KEYS.EDITORS_INTRO]?.text || DEFAULT_CONTENT[TEXT_KEYS.EDITORS_INTRO].text}
            </p>
          )}
          <div className="editors-grid">
            <div className="editor-card">
              {isEditor && (
                <button
                  className="edit-button small corner"
                  onClick={() => handleEditClick(TEXT_KEYS.EDITOR_1)}
                >
                  Edit
                </button>
              )}
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <h4>{formatPersonContent(contents[TEXT_KEYS.EDITOR_1])[0]}</h4>
                  <p className="title">{contents[TEXT_KEYS.EDITOR_1]?.title || DEFAULT_CONTENT[TEXT_KEYS.EDITOR_1].title}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.EDITOR_1])[1]}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.EDITOR_1])[2]}</p>
                </>
              )}
            </div>

            <div className="editor-card">
              {isEditor && (
                <button
                  className="edit-button small corner"
                  onClick={() => handleEditClick(TEXT_KEYS.EDITOR_2)}
                >
                  Edit
                </button>
              )}
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <h4>{formatPersonContent(contents[TEXT_KEYS.EDITOR_2])[0]}</h4>
                  <p className="title">{contents[TEXT_KEYS.EDITOR_2]?.title || DEFAULT_CONTENT[TEXT_KEYS.EDITOR_2].title}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.EDITOR_2])[1]}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.EDITOR_2])[2]}</p>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="role-section">
          <div className="section-header">
            <h3>{contents[TEXT_KEYS.REFEREES_INTRO]?.title || DEFAULT_CONTENT[TEXT_KEYS.REFEREES_INTRO].title}</h3>
            {isEditor && (
              <button
                className="edit-button small"
                onClick={() => handleEditClick(TEXT_KEYS.REFEREES_INTRO)}
              >
                Edit
              </button>
            )}
          </div>
          {isLoading ? (
            <p>Loading content...</p>
          ) : (
            <p className="section-intro">
              {contents[TEXT_KEYS.REFEREES_INTRO]?.text || DEFAULT_CONTENT[TEXT_KEYS.REFEREES_INTRO].text}
            </p>
          )}
          <div className="editors-grid">
            <div className="editor-card referee">
              {isEditor && (
                <button
                  className="edit-button small corner"
                  onClick={() => handleEditClick(TEXT_KEYS.REFEREE_1)}
                >
                  Edit
                </button>
              )}
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <>
                  <h4>{formatPersonContent(contents[TEXT_KEYS.REFEREE_1])[0]}</h4>
                  <p className="title">{contents[TEXT_KEYS.REFEREE_1]?.title || DEFAULT_CONTENT[TEXT_KEYS.REFEREE_1].title}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.REFEREE_1])[1]}</p>
                  <p>{formatPersonContent(contents[TEXT_KEYS.REFEREE_1])[2]}</p>
                </>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Masthead; 