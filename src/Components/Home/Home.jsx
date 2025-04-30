import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

import { BACKEND_URL } from '../../constants';
import AboutEdit from '../About/AboutEdit';
import './Home.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const RECENT_MANUSCRIPTS_ENDPOINT = `${backendUrl}/manuscripts/recent`;
const TEXT_READ_ENDPOINT = `${backendUrl}/text/read/HomePage`;
const TEXT_UPDATE_ENDPOINT = `${backendUrl}/text/update`;
const USERS_READ_ENDPOINT = `${backendUrl}/user/read`;

// Fallback endpoint if the dedicated recent endpoint doesn't exist
const ALL_MANUSCRIPTS_ENDPOINT = `${backendUrl}/manuscripts`;

// Helper function to convert manuscripts object to array
function manuscriptsToArray(manuscripts) {
  if (Array.isArray(manuscripts)) return manuscripts;
  
  return Object.entries(manuscripts).map(([id, manuscript]) => ({
    id,
    ...manuscript
  }));
}

function ErrorMessage({ message }) {
  return <div className="error-message">{message}</div>;
}

ErrorMessage.propTypes = {
  message: propTypes.string.isRequired,
};

function ActivityCard({ title, items, emptyMessage, linkPrefix }) {
  return (
    <div className="activity-card">
      <h3>{title}</h3>
      {items.length > 0 ? (
        <ul>
          {items.map((item) => (
            <li key={item.id}>
              <Link to={`${linkPrefix}/${item.id}`}>
                {item.title || item.name}
              </Link>
              <span className="activity-date">
                {new Date(item.date || item.updatedAt || item.createdAt || Date.now()).toLocaleDateString()}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="empty-message">{emptyMessage}</p>
      )}
    </div>
  );
}

ActivityCard.propTypes = {
  title: propTypes.string.isRequired,
  items: propTypes.array.isRequired,
  emptyMessage: propTypes.string.isRequired,
  linkPrefix: propTypes.string.isRequired,
};

function NavigationCard({ title, description, icon, linkTo }) {
  return (
    <Link to={linkTo} className="navigation-card">
      <div className="nav-card-icon">{icon}</div>
      <h3>{title}</h3>
      <p>{description}</p>
    </Link>
  );
}

NavigationCard.propTypes = {
  title: propTypes.string.isRequired,
  description: propTypes.string.isRequired,
  icon: propTypes.node,
  linkTo: propTypes.string.isRequired,
};

function Home() {
  const [recentManuscripts, setRecentManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [homeContent, setHomeContent] = useState({
    title: 'Welcome to the ASARE journal',
    text: 'Sign up to submit a manuscript.'
  });
  const [isEditing, setIsEditing] = useState(false);
  const { isLoggedIn, userEmail } = useAuth();
  const [isEditor, setIsEditor] = useState(false);

  // Check if user is an editor
  useEffect(() => {
    let isMounted = true;
    
    const checkIfEditor = async () => {
      if (!isLoggedIn || !userEmail) {
        if (isMounted) setIsEditor(false);
        return;
      }
      
      try {
        const response = await axios.get(USERS_READ_ENDPOINT);
        if (!isMounted) return;
        
        if (response.data && response.data.Users) {
          const users = Object.values(response.data.Users);
          const currentUser = users.find(user => user.email === userEmail);
          
          if (currentUser && currentUser.roleCodes) {
            const hasEditorRole = currentUser.roleCodes.includes('ED');
            console.log('Current user:', userEmail);
            console.log('User roles:', currentUser.roleCodes);
            console.log('Has editor role:', hasEditorRole);
            
            if (isMounted) setIsEditor(hasEditorRole);
          } else {
            if (isMounted) setIsEditor(false);
            console.log('User not found or has no roles');
          }
        }
      } catch (error) {
        console.error('Error checking editor status:', error);
        if (isMounted) setIsEditor(false);
      }
    };
    
    checkIfEditor();
    
    return () => {
      isMounted = false;
    };
  }, [isLoggedIn, userEmail]);

  // Fetch home content and manuscripts
  useEffect(() => {
    let isMounted = true;
    
    const fetchData = async () => {
      try {
        if (isMounted) setIsLoading(true);
        
        // Fetch home page content
        try {
          const homeContentResponse = await axios.get(TEXT_READ_ENDPOINT);
          if (!isMounted) return;
          
          if (homeContentResponse.data && homeContentResponse.data.Content) {
            console.log('Home content from API:', homeContentResponse.data.Content);
            setHomeContent(homeContentResponse.data.Content);
          } else {
            // Set default content if not available from API
            console.log('Setting default home content');
            setHomeContent({
              title: 'Welcome to the ASARE journal',
              text: 'Sign up to submit a manuscript.'
            });
          }
        } catch (error) {
          console.warn("Error fetching home content:", error);
          // Set default content on error
          if (isMounted) {
            setHomeContent({
              title: 'Welcome to the ASARE journal',
              text: 'Sign up to submit a manuscript.'
            });
          }
        }
        
        // Fetch recent manuscripts
        try {
          const recentResponse = await axios.get(RECENT_MANUSCRIPTS_ENDPOINT);
          if (!isMounted) return;
          
          if (recentResponse.data && recentResponse.data.manuscripts) {
            const processedManuscripts = manuscriptsToArray(recentResponse.data.manuscripts);
            setRecentManuscripts(processedManuscripts);
          }
        } catch (error) {
          console.warn("Dedicated recent manuscripts endpoint not available, trying fallback:", error);
          
          // Fallback: try to get all manuscripts and sort them ourselves
          try {
            const allManuscriptsResponse = await axios.get(ALL_MANUSCRIPTS_ENDPOINT);
            if (!isMounted) return;
            
            if (allManuscriptsResponse.data && allManuscriptsResponse.data.manuscripts) {
              // Convert from object to array if needed
              const processedManuscripts = manuscriptsToArray(allManuscriptsResponse.data.manuscripts);
              
              // Sort by date (if available) and take the 5 most recent
              processedManuscripts.sort((a, b) => {
                const dateA = new Date(a.date || a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.date || b.updatedAt || b.createdAt || 0);
                return dateB - dateA; // Sort descending (newest first)
              });
              
              if (isMounted) setRecentManuscripts(processedManuscripts.slice(0, 5));
            }
          } catch (fallbackError) {
            console.warn("Could not fetch manuscripts:", fallbackError);
            // Don't set an error state, just continue with empty manuscripts
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    fetchData();
    
    return () => {
      isMounted = false;
    };
  }, []);

  // Simple icons using unicode or text (can be replaced with actual icons)
  const icons = {
    users: "👥",
    manuscripts: "📄",
    about: "ℹ️"
  };

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleSave = async (updatedContent) => {
    try {
      setIsLoading(true);
      
      // Update the server with new content - using the correct format
      await axios.put(TEXT_UPDATE_ENDPOINT, {
        key: "HomePage",
        title: updatedContent.title,
        text: updatedContent.text
      });
      
      // Update local state
      setHomeContent(updatedContent);
      
      // Refetch to ensure we have the latest data
      try {
        const refreshResponse = await axios.get(TEXT_READ_ENDPOINT);
        if (refreshResponse.data && refreshResponse.data.Content) {
          setHomeContent(refreshResponse.data.Content);
        }
      } catch (refreshError) {
        console.warn("Error refreshing content after update:", refreshError);
        // We already updated the local state, so we can continue
      }
      
    } catch (error) {
      console.error("Error updating home content:", error);
      console.error("Error details:", error.response || error.message);
      alert("There was a problem saving the changes. Please try again.");
    } finally {
      setIsLoading(false);
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
  };

  if (isEditing) {
    return <AboutEdit 
      content={homeContent} 
      textKey="HomePage"
      onSave={handleSave} 
      onCancel={handleCancel}
      titleEditable={true}
    />;
  }

  return (
    <div className="home-container">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="home-header">
            <div>
              <h1 className="journal-title">{homeContent?.title || 'Welcome to the ASARE journal'}</h1>
              <p className="journal-description">
                {homeContent?.text || 'Sign up to submit a manuscript.'}
              </p>
            </div>
            {isEditor && (
              <button className="edit-button" onClick={handleEditClick}>
                Edit Home Page
              </button>
            )}
          </div>

          <div className="navigation-section">
            <h2>Quick Navigation</h2>
            <div className="navigation-cards">
              <NavigationCard 
                title="Users" 
                description="View and manage users of the journal system" 
                icon={icons.users}
                linkTo="/users" 
              />
              <NavigationCard 
                title="Manuscripts" 
                description="Browse all manuscripts in the system" 
                icon={icons.manuscripts}
                linkTo="/manuscripts" 
              />
              <NavigationCard 
                title="About" 
                description="Learn more about our journal" 
                icon={icons.about}
                linkTo="/about" 
              />
            </div>
          </div>

          <div className="activity-section">
            <h2>Recent Manuscripts</h2>
            <div className="activity-cards">
              <ActivityCard 
                title="Recently Submitted" 
                items={recentManuscripts} 
                emptyMessage="No recent manuscripts" 
                linkPrefix="/manuscripts"
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}

export default Home;
