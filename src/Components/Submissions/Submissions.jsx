import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../../constants';
import './Submissions.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPTS_READ_ENDPOINT = `${backendUrl}/manuscripts`;

function Submissions() {
  const [manuscripts, setManuscripts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchManuscripts = async () => {
      try {
        console.log('Fetching manuscripts from:', MANUSCRIPTS_READ_ENDPOINT);
        const { data } = await axios.get(MANUSCRIPTS_READ_ENDPOINT);
        console.log('Response data:', data);
        
        if (data && data.manuscripts) {
          // Convert manuscripts object to array and filter for accepted ones
          const manuscriptsArray = Object.entries(data.manuscripts).map(([id, manuscript]) => ({
            id,
            ...manuscript
          }));
          const acceptedManuscripts = manuscriptsArray.filter(manuscript => manuscript.state === 'accepted');
          setManuscripts(acceptedManuscripts);
        } else {
          setError('Invalid response format from the server');
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching manuscripts:', err);
        setError('Failed to fetch manuscripts');
        setLoading(false);
      }
    };

    fetchManuscripts();
  }, []);

  if (loading) return <div className="loading">Loading...</div>;
  if (error) return <div className="error-message">{error}</div>;

  return (
    <div className="wrapper">
      <header>
        <h1>Accepted Submissions</h1>
      </header>

      <div className="manuscript-count">
        Showing {manuscripts.length} accepted submissions
      </div>

      {manuscripts.length > 0 ? (
        manuscripts.map((manuscript) => (
          <div key={manuscript.id} className="manuscript-container">
            <h2>{manuscript.title}</h2>
            <div className="manuscript-content">
              <p><strong>Author:</strong> {manuscript.author}</p>
              <p><strong>Email:</strong> {manuscript.author_email}</p>
              <p><strong>Submitted:</strong> {new Date(manuscript.submission_date).toLocaleDateString()}</p>
              <p><strong>Abstract:</strong> {manuscript.abstract}</p>
            </div>
            <div className="manuscript-controls">
              <button type="button" className="view-button">View Full Text</button>
            </div>
          </div>
        ))
      ) : (
        <p className="no-results">No accepted submissions available.</p>
      )}
    </div>
  );
}

export default Submissions;