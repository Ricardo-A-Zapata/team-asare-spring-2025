import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';

import { BACKEND_URL } from '../../constants';
import Loading from '../Loading/Loading';
import './Manuscripts.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPTS_READ_ENDPOINT = `${backendUrl}/manuscripts`;

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
  const [manuscript, setManuscript] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchManuscriptDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(MANUSCRIPTS_READ_ENDPOINT);
        
        if (data && data.manuscripts && data.manuscripts[id]) {
          setManuscript({ id, ...data.manuscripts[id] });
        } else {
          setError('Manuscript not found');
        }
      } catch (err) {
        setError(`Error fetching manuscript details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchManuscriptDetails();
  }, [id]);

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
        <div className="manuscript-detail-section">
          <h2>Author Information</h2>
          <p><strong>Author:</strong> {manuscript.author}</p>
          <p><strong>Email:</strong> {manuscript.author_email}</p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Manuscript Details</h2>
          <p><strong>Version:</strong> {manuscript.version}</p>
          <p><strong>State:</strong> <StateDisplay state={manuscript.state} /></p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Abstract</h2>
          <p>{manuscript.abstract}</p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Full Text</h2>
          <p>{manuscript.text}</p>
        </div>
      </div>
    </div>
  );
}

export default ManuscriptDetails; 