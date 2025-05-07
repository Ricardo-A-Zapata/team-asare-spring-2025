import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';
import { useAuth } from '../../AuthContext';

import { BACKEND_URL } from '../../constants';
import Loading from '../Loading/Loading';
import './Manuscripts.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPTS_READ_ENDPOINT = `${backendUrl}/manuscripts`;
const USERS_READ_ENDPOINT = `${backendUrl}/user/read`;
// Ensure endpoints match the API documentation exactly
const MANUSCRIPT_STATE_ENDPOINT = `${backendUrl}/manuscript/state`;
const MANUSCRIPT_REFEREE_ENDPOINT = `${backendUrl}/manuscript/referee`;

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
  const [selectedReferee, setSelectedReferee] = useState('');
  const [operationLoading, setOperationLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [isReferee, setIsReferee] = useState(false);

  // Fetch manuscript, users, and current user info
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError('');
      try {
        // Manuscript
        const { data: mData } = await axios.get(MANUSCRIPTS_READ_ENDPOINT, {
          headers: { 'X-User-Email': userEmail }
        });
        if (mData && mData.manuscripts && mData.manuscripts[id]) {
          setManuscript({ id, ...mData.manuscripts[id] });
          console.log('Current manuscript:', { id, ...mData.manuscripts[id] });
          // Log referee info for debugging
          if (mData.manuscripts[id].referee_email) {
            console.log(`Referee assigned: ${mData.manuscripts[id].referee_email}`);
            console.log(`Current user email: ${userEmail}`);
            console.log(`Is current user the referee? ${mData.manuscripts[id].referee_email === userEmail}`);
          } else {
            console.log('No referee assigned to this manuscript');
          }
        } else {
          setError('Manuscript not found');
          setLoading(false);
          return;
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
      } catch (err) {
        setError(`Error loading data: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id, userEmail]);

  // First, clean up the email comparison debugging in the useEffect
  useEffect(() => {
    // Check if user is referee with simple case-insensitive comparison
    if (userEmail && manuscript?.referee_email) {
      // Use normalized comparison for setting isReferee
      const refereeCheck = userEmail.toLowerCase().trim() === manuscript.referee_email.toLowerCase().trim();
      setIsReferee(refereeCheck);
    } else {
      setIsReferee(false);
    }
  }, [manuscript, userEmail]);

  // Helper: is current user admin/editor?
  const isAdmin = currentUser && currentUser.roleCodes && currentUser.roleCodes.includes('ED');
  // Referee list for dropdown
  const refereeUsers = users.filter(u => u.roleCodes && u.roleCodes.includes('RE'));

  // Next, clean up the handleRefereeAction function - remove alerts and extensive debugging
  const handleRefereeAction = async (newState) => {
    setOperationLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      // Use uppercase state values as expected by backend
      const state = newState.toUpperCase();
      
      // Ensure correct manuscript ID
      const manuscriptId = manuscript?.id || id;
      
      // Ensure payload has exact format expected by backend 
      const payload = {
        state: state // Only include state as required by backend
      };
      
      const stateUpdateUrl = `${MANUSCRIPT_STATE_ENDPOINT}/${manuscriptId}`;
      
      try {
        // Set up a timeout to handle no response cases
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => {
            reject(new Error('Request timed out'));
          }, 10000); // 10 second timeout
        });
        
        // Race between the actual request and the timeout
        const response = await Promise.race([
          axios({
            method: 'PUT',
            url: stateUpdateUrl,
            data: payload,
            headers: {
              'X-User-Email': userEmail,
              'Content-Type': 'application/json',
              'Accept': 'application/json'
            },
            validateStatus: function () {
              // Consider all status codes valid for proper error handling
              return true; 
            }
          }),
          timeoutPromise
        ]);
        
        // Check for non-2xx responses
        if (response.status >= 200 && response.status < 300) {
          setSuccessMsg(`Manuscript ${state === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully.`);
          
          // Update manuscript immediately to show new state
          setManuscript(prev => ({
            ...prev,
            state: state
          }));
        } else {
          // Throw for 4xx/5xx responses to be caught by catch block
          throw {
            response: response,
            message: response.data?.message || `Server returned ${response.status}`
          };
        }
      } catch (reqError) {
        // Special handling for 403 errors - likely permission issues
        if (reqError.response?.status === 403) {
          if (reqError.response?.data?.message) {
            throw new Error(`Permission denied: ${reqError.response.data.message}`);
          } else {
            throw new Error('Permission denied: You must be the assigned referee to accept/reject this manuscript');
          }
        }
        
        // If it's a timeout error or "No response received" error, check if state changed
        if (reqError.message === 'Request timed out' || 
            (reqError.request && !reqError.response)) {
          // Wait a moment to give backend time to process
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // Try to refresh manuscript to see if state changed
          try {
            const { data: refreshData } = await axios.get(MANUSCRIPTS_READ_ENDPOINT, {
              headers: { 'X-User-Email': userEmail }
            });
            
            if (refreshData && refreshData.manuscripts && refreshData.manuscripts[manuscriptId]) {
              const updatedManuscript = { id: manuscriptId, ...refreshData.manuscripts[manuscriptId] };
              
              // If state changed, we know it worked despite no response
              if (updatedManuscript.state === state) {
                setManuscript(updatedManuscript);
                setSuccessMsg(`Manuscript ${state === 'ACCEPTED' ? 'accepted' : 'rejected'} successfully, but server did not send a response.`);
                setOperationLoading(false);
                return; // Exit early since we're handling it as success
              }
            }
          } catch (refreshErr) {
            // Fail silently if refresh check fails
          }
        }
        
        // For all other errors, or if the state didn't change, throw to the outer catch
        throw reqError;
      }
      
      // Refresh manuscript after successful update
      const { data: mData } = await axios.get(MANUSCRIPTS_READ_ENDPOINT, {
        headers: { 'X-User-Email': userEmail }
      });
      
      if (mData && mData.manuscripts && mData.manuscripts[manuscriptId]) {
        const updatedManuscript = { id: manuscriptId, ...mData.manuscripts[manuscriptId] };
        setManuscript(updatedManuscript);
      }
    } catch (err) {
      let errorMessage = 'Failed to update manuscript state';
      
      if (err.response) {
        // Handle specific HTTP error codes
        if (err.response.status === 403) {
          errorMessage = `Permission denied: ${err.response.data?.message || 'You must be the assigned referee to accept/reject this manuscript'}`;
        } else if (err.response.status === 404) {
          errorMessage = `Manuscript not found: ${err.response.data?.message || 'The manuscript may have been deleted'}`;
        } else {
          errorMessage += `: ${err.response.status} - ${err.response.data?.message || err.response.data?.error || err.response.statusText || 'Unknown error'}`;
        }
      } else if (err.request) {
        errorMessage += ': No response received from server. This may happen if the server is processing your request but not sending a response.';
      } else {
        errorMessage += `: ${err.message}`;
      }
      
      setError(errorMessage);
    } finally {
      setOperationLoading(false);
    }
  };

  // Admin assign referee
  const handleAssignReferee = async (e) => {
    e.preventDefault();
    if (!selectedReferee) return;
    setOperationLoading(true);
    setError('');
    setSuccessMsg('');
    try {
      // Make sure we're sending the right structure that the backend expects
      const payload = {
        referee_email: selectedReferee
      };
      
      console.log('Assigning referee:', selectedReferee);
      console.log('To manuscript:', id);
      
      const response = await axios({
        method: 'PUT',
        url: `${MANUSCRIPT_REFEREE_ENDPOINT}/${id}`,
        data: payload,
        headers: {
          'X-User-Email': userEmail,
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        }
      });
      
      console.log('Referee assignment response:', response.data);
      
      setSuccessMsg(`Referee ${selectedReferee} assigned successfully.`);
      
      // Refresh manuscript to show new referee
      const { data: mData } = await axios.get(MANUSCRIPTS_READ_ENDPOINT, {
        headers: { 'X-User-Email': userEmail }
      });
      
      if (mData && mData.manuscripts && mData.manuscripts[id]) {
        const updatedManuscript = { id, ...mData.manuscripts[id] };
        setManuscript(updatedManuscript);
        console.log('Updated manuscript:', updatedManuscript);
        
        // Log referee info for debugging
        if (updatedManuscript.referee_email) {
          console.log(`Referee now assigned: ${updatedManuscript.referee_email}`);
          console.log(`Is current user the referee? ${updatedManuscript.referee_email === userEmail}`);
        }
      }
    } catch (err) {
      console.error('Error assigning referee:', err);
      setError(`Failed to assign referee: ${err.response?.data?.message || err.message}`);
    } finally {
      setOperationLoading(false);
    }
  };

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
      
      {error && (
        <div className="error-message" style={{ 
          padding: '10px', 
          marginBottom: '20px', 
          backgroundColor: '#ffebee', 
          color: '#c62828', 
          borderRadius: '4px',
          border: '1px solid #ef9a9a'
        }}>
          {error}
        </div>
      )}
      
      {successMsg && (
        <div className="success-message" style={{ 
          padding: '15px', 
          marginBottom: '20px', 
          backgroundColor: '#e8f5e9', 
          color: '#2e7d32', 
          borderRadius: '4px',
          border: '1px solid #a5d6a7',
          fontWeight: 'bold',
          fontSize: '1.1em',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          <div>
            {successMsg}
            {manuscript.state && (
              <div style={{ marginTop: '5px', fontSize: '0.9em', fontWeight: 'normal' }}>
                Current manuscript state: <StateDisplay state={manuscript.state} />
              </div>
            )}
          </div>
          <button 
            onClick={() => setSuccessMsg('')} 
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#2e7d32',
              fontWeight: 'bold',
              fontSize: '1.2em'
            }}
          >
            ×
          </button>
        </div>
      )}
      
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
          <p>
            <strong>Referee:</strong> 
            {manuscript.referee_email ? (
              <span>
                {manuscript.referee_email}
                {manuscript.referee_email === userEmail && (
                  <span style={{
                    display: 'inline-block',
                    marginLeft: '10px',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#e3f2fd',
                    color: '#0d47a1',
                    fontSize: '0.85em',
                    fontWeight: 'bold'
                  }}>
                    You
                  </span>
                )}
              </span>
            ) : (
              <span style={{ color: '#888', fontStyle: 'italic' }}>None assigned</span>
            )}
          </p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Abstract</h2>
          <p>{manuscript.abstract}</p>
        </div>
        
        <div className="manuscript-detail-section">
          <h2>Full Text</h2>
          <p>{manuscript.text}</p>
        </div>
        
        {/* Referee Controls Section */}
        <div className="manuscript-detail-section">
          <h2>Manuscript Actions</h2>
          
          {/* Referee state change controls */}
          <div style={{ marginBottom: '20px' }}>
            <h3>Referee Actions</h3>
            {isReferee ? (
              <>
                <div style={{ 
                  marginBottom: '10px', 
                  padding: '8px', 
                  backgroundColor: '#e8f5e9', 
                  borderRadius: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <strong>You are the assigned referee for this manuscript.</strong>
                  <span style={{ 
                    fontSize: '0.9em', 
                    backgroundColor: '#2e7d32', 
                    color: 'white',
                    padding: '4px 8px',
                    borderRadius: '4px'
                  }}>
                    {userEmail}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: '10px', flexDirection: 'column' }}>
                  <p style={{ fontStyle: 'italic', marginBottom: '10px' }}>
                    Please review the manuscript carefully before making your decision.
                    Your decision will be final and cannot be changed.
                  </p>
                  
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to ACCEPT this manuscript? This action cannot be undone.')) {
                          handleRefereeAction('accepted');
                        }
                      }} 
                      disabled={operationLoading}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#4caf50',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Accept Manuscript
                    </button>
                    
                    <button 
                      onClick={() => {
                        if (window.confirm('Are you sure you want to REJECT this manuscript? This action cannot be undone.')) {
                          handleRefereeAction('rejected');
                        }
                      }} 
                      disabled={operationLoading}
                      style={{
                        padding: '12px 16px',
                        backgroundColor: '#f44336',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      Reject Manuscript
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div style={{ 
                color: '#666', 
                fontStyle: 'italic',
                padding: '15px',
                backgroundColor: '#f8f9fa',
                borderRadius: '6px'
              }}>
                {manuscript.referee_email ? (
                  <>
                    <p><strong>Current referee:</strong> {manuscript.referee_email}</p>
                    <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
                      Only the assigned referee can accept or deny this manuscript.
                    </p>
                    {userEmail && (
                      <p>Your email ({userEmail}) does not match the referee email.</p>
                    )}
                  </>
                ) : (
                  <p>No referee has been assigned to this manuscript yet.</p>
                )}
              </div>
            )}
          </div>
          
          {/* Admin referee assignment */}
          {isAdmin && (
            <div>
              <h3>Editor Actions</h3>
              <div style={{ marginTop: '10px' }}>
                <h4>
                  {manuscript.referee_email ? 'Change Assigned Referee' : 'Assign a Referee'}
                </h4>
                
                <form onSubmit={handleAssignReferee} style={{ marginTop: '10px' }}>
                  <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                    <select
                      value={selectedReferee}
                      onChange={e => setSelectedReferee(e.target.value)}
                      disabled={operationLoading}
                      required
                      style={{
                        padding: '8px',
                        borderRadius: '4px',
                        border: '1px solid #ddd',
                        minWidth: '250px'
                      }}
                    >
                      <option value="">-- Select a referee --</option>
                      {refereeUsers.map(u => (
                        <option key={u.email} value={u.email}>
                          {u.name} ({u.email})
                          {u.email === userEmail ? ' (You)' : ''}
                        </option>
                      ))}
                    </select>
                    
                    <button 
                      type="submit" 
                      disabled={operationLoading || !selectedReferee}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: selectedReferee ? '#2196f3' : '#e0e0e0',
                        color: selectedReferee ? 'white' : '#999',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: selectedReferee ? 'pointer' : 'not-allowed'
                      }}
                    >
                      {manuscript.referee_email ? 'Change Referee' : 'Assign Referee'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
        
        {operationLoading && (
          <div style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            bottom: 0, 
            backgroundColor: 'rgba(0,0,0,0.3)',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            zIndex: 1000
          }}>
            <div style={{ 
              backgroundColor: 'white', 
              padding: '20px',
              borderRadius: '8px',
              boxShadow: '0 2px 10px rgba(0,0,0,0.2)'
            }}>
              <Loading message="Processing..." />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManuscriptDetails; 