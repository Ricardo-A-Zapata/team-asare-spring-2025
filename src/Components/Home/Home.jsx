import React, { useEffect, useState } from 'react';
import propTypes from 'prop-types';
import axios from 'axios';
import { Link } from 'react-router-dom';

import { BACKEND_URL } from '../../constants';
import './Home.css';

const JOURNAL_NAME_ENDPOINT = `${BACKEND_URL}/journalname`;
const RECENT_MANUSCRIPTS_ENDPOINT = `${BACKEND_URL}/manuscripts/recent`;
const RECENT_SUBMISSIONS_ENDPOINT = `${BACKEND_URL}/submissions/recent`;

// Fallback endpoints if the dedicated recent endpoints don't exist
const ALL_MANUSCRIPTS_ENDPOINT = `${BACKEND_URL}/manuscripts`;
const ALL_SUBMISSIONS_ENDPOINT = `${BACKEND_URL}/submissions/read`;

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
  const [journalName, setJournalName] = useState('');
  const [recentManuscripts, setRecentManuscripts] = useState([]);
  const [recentSubmissions, setRecentSubmissions] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch journal name
        const journalResponse = await axios.get(JOURNAL_NAME_ENDPOINT);
        if (journalResponse.data && journalResponse.data["Journal Name"]) {
          setJournalName(journalResponse.data["Journal Name"]);
        }
        
        // Try to fetch recent manuscripts
        try {
          // First try the dedicated endpoint for recent manuscripts
          const manuscriptsResponse = await axios.get(RECENT_MANUSCRIPTS_ENDPOINT);
          if (manuscriptsResponse.data && manuscriptsResponse.data.manuscripts) {
            const processedManuscripts = manuscriptsToArray(manuscriptsResponse.data.manuscripts);
            setRecentManuscripts(processedManuscripts.slice(0, 5));
          }
        } catch (error) {
          console.warn("Dedicated recent manuscripts endpoint not available, trying fallback:", error);
          
          // Fallback: try to get all manuscripts and sort them ourselves
          try {
            const allManuscriptsResponse = await axios.get(ALL_MANUSCRIPTS_ENDPOINT);
            if (allManuscriptsResponse.data && allManuscriptsResponse.data.manuscripts) {
              // Convert from object to array if needed
              const processedManuscripts = manuscriptsToArray(allManuscriptsResponse.data.manuscripts);
              
              // Sort by date (if available) and take the 5 most recent
              processedManuscripts.sort((a, b) => {
                const dateA = new Date(a.date || a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.date || b.updatedAt || b.createdAt || 0);
                return dateB - dateA; // Sort descending (newest first)
              });
              
              setRecentManuscripts(processedManuscripts.slice(0, 5));
            }
          } catch (fallbackError) {
            console.warn("Could not fetch manuscripts:", fallbackError);
            // Don't set an error state, just continue with empty manuscripts
          }
        }
        
        // Try to fetch recent submissions
        try {
          // First try the dedicated endpoint for recent submissions
          const submissionsResponse = await axios.get(RECENT_SUBMISSIONS_ENDPOINT);
          if (submissionsResponse.data && submissionsResponse.data.submissions) {
            setRecentSubmissions(submissionsResponse.data.submissions.slice(0, 5));
          }
        } catch (error) {
          console.warn("Dedicated recent submissions endpoint not available, trying fallback:", error);
          
          // Fallback: try to get all submissions and sort them ourselves
          try {
            const allSubmissionsResponse = await axios.get(ALL_SUBMISSIONS_ENDPOINT);
            if (allSubmissionsResponse.data && allSubmissionsResponse.data.Submissions) {
              // Convert from object to array if needed
              let submissions = allSubmissionsResponse.data.Submissions;
              if (!Array.isArray(submissions) && typeof submissions === 'object') {
                submissions = Object.values(submissions);
              }
              
              // Sort by date (if available) and take the 5 most recent
              submissions.sort((a, b) => {
                const dateA = new Date(a.date || a.updatedAt || a.createdAt || 0);
                const dateB = new Date(b.date || b.updatedAt || b.createdAt || 0);
                return dateB - dateA; // Sort descending (newest first)
              });
              
              setRecentSubmissions(submissions.slice(0, 5));
            }
          } catch (fallbackError) {
            console.warn("Could not fetch submissions:", fallbackError);
            // Don't set an error state, just continue with empty submissions
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("There was a problem loading the homepage data.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Simple icons using unicode or text (can be replaced with actual icons)
  const icons = {
    users: "👥",
    submissions: "📝",
    manuscripts: "📄",
    about: "ℹ️"
  };

  return (
    <div className="home-container">
      {isLoading ? (
        <div className="loading">Loading...</div>
      ) : (
        <>
          <div className="home-header">
            <h1 className="journal-title">Welcome to {journalName || 'our Journal'}</h1>
            <p className="journal-description">
              This is the official journal website where scholars and researchers share their work.
            </p>
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
                title="Submissions" 
                description="Track and manage paper submissions" 
                icon={icons.submissions}
                linkTo="/submissions" 
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
            <h2>Recent Activity</h2>
            <div className="activity-cards">
              <ActivityCard 
                title="Recent Manuscripts" 
                items={recentManuscripts} 
                emptyMessage="No recent manuscripts. Submit a new manuscript to see it here."
                linkPrefix="/manuscripts" 
              />
              <ActivityCard 
                title="Recent Submissions" 
                items={recentSubmissions} 
                emptyMessage="No recent submissions"
                linkPrefix="/submissions" 
              />
            </div>
          </div>
        </>
      )}
      {error && <ErrorMessage message={error} />}
    </div>
  );
}

export default Home;
