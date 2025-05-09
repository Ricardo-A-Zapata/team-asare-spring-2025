import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useAuth } from '../../AuthContext';

import { BACKEND_URL, API_ENDPOINTS, STORAGE_KEYS, USER_ROLES } from '../../constants';
import Loading from '../Loading/Loading';
import './Manuscripts.css';
import ManuscriptWorkflow from './ManuscriptWorkflow';
import './ManuscriptWorkflow.css';
import ManuscriptStateFlow from './ManuscriptStateFlow';
import './ManuscriptStateFlow.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPTS_READ_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPTS_READ}`;
const USERS_READ_ENDPOINT = `${backendUrl}${API_ENDPOINTS.USERS_READ}`;

function StateDisplay({ state }) {
  const stateClass = state.toLowerCase().replace('_', '-');
  
  return (
    <span className={`state ${stateClass}`}>
      {state}
    </span>
  );
}

StateDisplay.propTypes = {
  state: PropTypes.string.isRequired
};

function ManuscriptDetails() {
  const { id } = useParams();
  const { userEmail } = useAuth();
  const [manuscript, setManuscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [localReviewData, setLocalReviewData] = useState(null);

  // Try to get review data from localStorage
  useEffect(() => {
    if (id) {
      try {
        const savedReview = localStorage.getItem(`${STORAGE_KEYS.MANUSCRIPT_REVIEW}${id}`);
        if (savedReview) {
          const parsedReview = JSON.parse(savedReview);
          console.log('Found saved review data in localStorage:', parsedReview);
          setLocalReviewData(parsedReview);
        }
      } catch (e) {
        console.warn('Error retrieving review from localStorage:', e);
      }
    }
  }, [id]);

  // Function to extract review data from the manuscript
  const getReviewData = (manuscript, userEmail) => {
    // Check direct properties first
    if (manuscript.referee_review || manuscript.review || manuscript.report || manuscript.review_report) {
      return {
        report: manuscript.referee_review || manuscript.review || manuscript.report || manuscript.review_report,
        verdict: manuscript.referee_verdict || manuscript.verdict
      };
    }
    
    // Check referees object next
    if (manuscript.referees && manuscript.referees[userEmail]) {
      const refereeData = manuscript.referees[userEmail];
      return {
        report: refereeData.report || refereeData.review || '',
        verdict: refereeData.verdict || ''
      };
    }
    
    return null;
  };

  // Fetch manuscript, users, and current user info
  const fetchAll = async () => {
    setLoading(true);
    setError('');
    try {
      // Manuscript
      const { data: mData } = await axios.get(MANUSCRIPTS_READ_ENDPOINT, {
        headers: { 'X-User-Email': userEmail }
      });
      if (mData && mData.manuscripts && mData.manuscripts[id]) {
        const manuscriptData = { id, ...mData.manuscripts[id] };
        console.log('Fetched manuscript data:', manuscriptData);
        console.log('Text content:', manuscriptData.text);
        console.log('Abstract content:', manuscriptData.abstract);
        
        // Log detailed information about review-related fields
        console.log('Review-related fields:');
        const reviewFields = [
          'referee_review', 'referee_verdict', 
          'review', 'verdict', 
          'report', 'review_report'
        ];
        
        reviewFields.forEach(field => {
          console.log(`${field}: ${manuscriptData[field] ? 'PRESENT' : 'missing'}`);
          if (manuscriptData[field]) {
            console.log(`${field} content:`, manuscriptData[field]);
          }
        });
        
        setManuscript(manuscriptData);
      } else {
        setError('Manuscript not found');
        setLoading(false);
        return Promise.reject(new Error('Manuscript not found'));
      }
      // Users
      const { data: uData } = await axios.get(USERS_READ_ENDPOINT, {
        headers: { 'X-User-Email': userEmail }
      });
      const userArr = uData && uData.Users ? Object.values(uData.Users) : [];
      setUsers(userArr);
      // Current user
      const me = userArr.find(u => u.email === userEmail);
      setCurrentUser(me);
      if (me) {
        console.log('Current user roles:', me.roleCodes);
      }
      setLoading(false);
      return Promise.resolve();
    } catch (err) {
      setError(`Error loading data: ${err.message}`);
      setLoading(false);
      return Promise.reject(err);
    }
  };

  useEffect(() => {
    fetchAll();
  }, [id, userEmail]);

  // Get referee users for dropdown
  const refereeUsers = users.filter(u => u.roleCodes && u.roleCodes.includes(USER_ROLES.REFEREE));

  if (loading) {
    return <Loading message="Loading manuscript details..." />;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/manuscripts">Back to Manuscripts</Link>
      </div>
    );
  }

  if (!manuscript) {
    return (
      <div className="not-found">
        <h2>Manuscript Not Found</h2>
        <p>The manuscript with ID {id} could not be found.</p>
        <Link to="/manuscripts">Back to Manuscripts</Link>
      </div>
    );
  }

  return (
    <div className="manuscript-detail-container">
      <div className="manuscript-detail-header">
        <h1>{manuscript.title}</h1>
        <Link to="/manuscripts" className="back-button">Back to Manuscripts</Link>
      </div>
      
      <div className="manuscript-detail-card">
        {/* Manuscript state flow visualization */}
        <ManuscriptStateFlow currentState={manuscript.state} />
        
        <div className="manuscript-detail-section">
          <h2>Author Information</h2>
          <p><strong>Author:</strong> {manuscript.author}</p>
          <p><strong>Email:</strong> {manuscript.author_email}</p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Manuscript Details</h2>
          <p><strong>Version:</strong> {manuscript.version || 1}</p>
          <p><strong>State:</strong> <StateDisplay state={manuscript.state} /></p>
          
          {/* Only show referees if needed for debugging - remove referee display here 
             since it's handled in the ManuscriptWorkflow component */}
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Abstract</h2>
          <p>{manuscript.abstract}</p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Full Text</h2>
          <p>{manuscript.text}</p>
        </div>
        
        {/* Force display of referee review section for testing */}
        <div className="manuscript-detail-section referee-review-section">
          <h3>Referee Review Report</h3>
          
          {/* Force display of review text */}
          <div>
            {(() => {
              // Get review data from manuscript or localStorage
              const reviewData = getReviewData(manuscript, userEmail) || localReviewData;
              
              if (reviewData && reviewData.report) {
                return (
                  <div className="review-notes">
                    <p><strong>Review Text:</strong> {reviewData.report}</p>
                    {reviewData.timestamp && (
                      <p style={{fontSize: '12px', color: '#666', marginTop: '5px'}}>
                        <em>Review submitted at: {new Date(reviewData.timestamp).toLocaleString()}</em>
                      </p>
                    )}
                  </div>
                );
              } else {
                return (
                  <p>No review has been submitted yet.</p>
                );
              }
            })()}
          </div>
        </div>
        
        {/* Manuscript Workflow */}
        {currentUser && (
          <ManuscriptWorkflow
            manuscript={manuscript}
            userEmail={userEmail}
            userRoles={currentUser.roleCodes || []}
            refreshManuscript={fetchAll}
            referees={refereeUsers}
          />
        )}
      </div>
    </div>
  );
}

export default ManuscriptDetails;