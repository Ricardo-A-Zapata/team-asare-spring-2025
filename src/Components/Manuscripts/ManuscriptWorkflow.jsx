import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';
import { BACKEND_URL, API_ENDPOINTS, MANUSCRIPT_STATES, USER_ROLES, STORAGE_KEYS, VERDICT_TYPES } from '../../constants';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPT_STATE_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPT_STATE}`;
const MANUSCRIPT_REFEREE_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPT_REFEREE}`;
const MANUSCRIPT_REVIEW_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPT_REVIEW}`;
const MANUSCRIPT_WITHDRAW_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPT_WITHDRAW}`;
const MANUSCRIPT_TEXT_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPT_TEXT}`;

// State display component
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

const ACTION_EDIT = 'EDIT';

// Add a new ManuscriptEditor component
function ManuscriptEditor({ manuscript, userEmail, onSave, onCancel }) {
  const [newText, setNewText] = useState(manuscript.text || '');
  const [newAbstract, setNewAbstract] = useState(manuscript.abstract || '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Log initial values
  useEffect(() => {
    console.log('ManuscriptEditor initial values:');
    console.log('manuscript.text:', manuscript.text);
    console.log('manuscript.abstract:', manuscript.abstract);
    console.log('newText state:', newText);
    console.log('newAbstract state:', newAbstract);
  }, []);

  // Log when values change
  useEffect(() => {
    console.log('Text value changed to:', newText);
  }, [newText]);
  
  useEffect(() => {
    console.log('Abstract value changed to:', newAbstract);
  }, [newAbstract]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    try {
      console.log('Sending update to server:', {
        id: manuscript.id,
        new_text: newText,
        new_abstract: newAbstract,
        author_email: userEmail
      });
      
      // Log the endpoint being used
      console.log('Endpoint URL:', `${MANUSCRIPT_TEXT_ENDPOINT}/${manuscript.id}`);
      
      // Try direct manuscript update first
      try {
        const response = await axios.put(
          `${MANUSCRIPT_TEXT_ENDPOINT}/${manuscript.id}`,
          {
            new_text: newText,
            new_abstract: newAbstract,
            author_email: userEmail
          },
          {
            headers: {
              'X-User-Email': userEmail,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Server response after update:', response.data);
        onSave();
      } catch (endpointErr) {
        console.error('Manuscript text endpoint failed, trying direct manuscript update', endpointErr);
        
        // Fallback: Update the manuscript directly
        console.log('Trying direct manuscript update');
        const directUpdateResponse = await axios.put(
          `${backendUrl}/manuscripts/${manuscript.id}`,
          {
            ...manuscript,
            text: newText,
            abstract: newAbstract
          },
          {
            headers: {
              'X-User-Email': userEmail,
              'Content-Type': 'application/json'
            }
          }
        );
        
        console.log('Direct update response:', directUpdateResponse.data);
        onSave();
      }
    } catch (err) {
      console.error('Full error:', err);
      setError(`Error saving manuscript: ${err.response?.data?.error || err.message}`);
      console.error('Error saving manuscript:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="manuscript-editor">
      <h4>Edit Manuscript</h4>
      {error && <div className="error-message">{error}</div>}
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="abstract">Abstract</label>
          <textarea
            id="abstract"
            value={newAbstract}
            onChange={(e) => setNewAbstract(e.target.value)}
            rows={5}
            disabled={saving}
            required
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="text">Full Text</label>
          <textarea
            id="text"
            value={newText}
            onChange={(e) => setNewText(e.target.value)}
            rows={12}
            disabled={saving}
            required
          />
        </div>
        
        <div className="editor-actions">
          <button 
            type="button" 
            onClick={onCancel} 
            disabled={saving}
            className="cancel-button"
          >
            Cancel
          </button>
          <button 
            type="submit" 
            disabled={saving}
            className="save-button"
          >
            Save Changes
          </button>
        </div>
      </form>
      
      {saving && <div className="loading-overlay">Saving changes...</div>}
    </div>
  );
}

ManuscriptEditor.propTypes = {
  manuscript: PropTypes.object.isRequired,
  userEmail: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

// Continue with the original ManuscriptWorkflow component
function ManuscriptWorkflow({ 
  manuscript, 
  userEmail, 
  userRoles = [], 
  refreshManuscript,
  referees = []
}) {
  // Debug log to verify manuscript data structure
  console.log('Manuscript in workflow:', manuscript);
  console.log('Referees from manuscript:', manuscript.referees);
  console.log('Referee email from manuscript:', manuscript.referee_email);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedReferee, setSelectedReferee] = useState('');
  const [reviewData, setReviewData] = useState({ report: '', verdict: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [editCompleted, setEditCompleted] = useState(false);
  
  // Effect to handle successful edit completion
  useEffect(() => {
    if (editCompleted) {
      // Reset the flag
      setEditCompleted(false);
      
      // Refresh to get the updated content
      refreshManuscript().catch(err => {
        console.error('Error refreshing after edit:', err);
      });
    }
  }, [editCompleted, refreshManuscript]);
  
  // Check user roles
  const isEditor = userRoles.includes(USER_ROLES.EDITOR);
  const isAuthor = manuscript.author_email === userEmail;
  
  // Handle both cases where backend might send referee_email or referees object
  const isReferee = (manuscript.referees && Object.keys(manuscript.referees).includes(userEmail)) || 
                   (manuscript.referee_email && manuscript.referee_email === userEmail);
  
  // Get referees from either data structure
  const getReferees = () => {
    if (manuscript.referees && Object.keys(manuscript.referees).length > 0) {
      return Object.keys(manuscript.referees);
    } else if (manuscript.referee_email) {
      return [manuscript.referee_email];
    }
    return [];
  };
  
  const manuscriptReferees = getReferees();
  
  // Helper to determine which actions are available based on state and user role
  const getAvailableActions = () => {
    const currentState = manuscript.state;
    const actions = [];
    
    switch(currentState) {
      case MANUSCRIPT_STATES.SUBMITTED:
        if (isEditor) {
          actions.push({ 
            label: 'Move to Referee Review', 
            action: MANUSCRIPT_STATES.REFEREE_REVIEW,
            color: '#2196f3'
          });
          actions.push({ 
            label: 'Reject', 
            action: MANUSCRIPT_STATES.REJECTED,
            color: '#f44336'
          });
        }
        if (isAuthor) {
          actions.push({ 
            label: 'Withdraw', 
            action: MANUSCRIPT_STATES.WITHDRAWN,
            color: '#ff9800'
          });
        }
        break;
        
      case MANUSCRIPT_STATES.REFEREE_REVIEW:
        if (isEditor) {
          actions.push({ 
            label: 'Move back to Submitted', 
            action: MANUSCRIPT_STATES.SUBMITTED,
            color: '#607d8b'
          });
          actions.push({ 
            label: 'Reject', 
            action: MANUSCRIPT_STATES.REJECTED,
            color: '#f44336'
          });
          actions.push({ 
            label: 'Request Author Revisions', 
            action: MANUSCRIPT_STATES.AUTHOR_REVISIONS,
            color: '#ff9800'
          });
        }
        if (isAuthor) {
          actions.push({ 
            label: 'Withdraw', 
            action: MANUSCRIPT_STATES.WITHDRAWN,
            color: '#ff9800'
          });
        }
        // Referee specific actions are handled separately in the review form
        break;
        
      case MANUSCRIPT_STATES.AUTHOR_REVISIONS:
        if (isAuthor) {
          // Don't show Submit Revisions button while in edit mode
          if (!isEditing) {
            actions.push({
              label: 'Edit Manuscript',
              action: ACTION_EDIT,
              color: '#2196f3'
            });
            actions.push({ 
              label: 'Submit Revisions', 
              action: MANUSCRIPT_STATES.EDITOR_REVIEW,
              color: '#4caf50'
            });
            actions.push({ 
              label: 'Withdraw', 
              action: MANUSCRIPT_STATES.WITHDRAWN,
              color: '#ff9800'
            });
          }
        }
        if (isEditor) {
          actions.push({ 
            label: 'Reject', 
            action: MANUSCRIPT_STATES.REJECTED,
            color: '#f44336'
          });
        }
        break;
        
      case MANUSCRIPT_STATES.EDITOR_REVIEW:
        if (isEditor) {
          actions.push({ 
            label: 'Accept', 
            action: MANUSCRIPT_STATES.COPY_EDIT,
            color: '#4caf50'
          });
          actions.push({ 
            label: 'Reject', 
            action: MANUSCRIPT_STATES.REJECTED,
            color: '#f44336'
          });
        }
        if (isAuthor) {
          actions.push({ 
            label: 'Withdraw', 
            action: MANUSCRIPT_STATES.WITHDRAWN,
            color: '#ff9800'
          });
        }
        break;
        
      case MANUSCRIPT_STATES.COPY_EDIT:
        if (isEditor) {
          actions.push({ 
            label: 'Mark Complete', 
            action: MANUSCRIPT_STATES.AUTHOR_REVIEW,
            color: '#4caf50'
          });
        }
        if (isAuthor) {
          actions.push({ 
            label: 'Withdraw', 
            action: MANUSCRIPT_STATES.WITHDRAWN,
            color: '#ff9800'
          });
        }
        break;
        
      case MANUSCRIPT_STATES.AUTHOR_REVIEW:
        if (isAuthor) {
          actions.push({ 
            label: 'Mark Complete', 
            action: MANUSCRIPT_STATES.FORMATTING,
            color: '#4caf50'
          });
          actions.push({ 
            label: 'Withdraw', 
            action: MANUSCRIPT_STATES.WITHDRAWN,
            color: '#ff9800'
          });
        }
        break;
        
      case MANUSCRIPT_STATES.FORMATTING:
        if (isEditor) {
          actions.push({ 
            label: 'Mark Complete', 
            action: MANUSCRIPT_STATES.PUBLISHED,
            color: '#4caf50'
          });
        }
        if (isAuthor) {
          actions.push({ 
            label: 'Withdraw', 
            action: MANUSCRIPT_STATES.WITHDRAWN,
            color: '#ff9800'
          });
        }
        break;
        
      case MANUSCRIPT_STATES.PUBLISHED:
        // No actions available for published manuscripts
        break;
        
      case MANUSCRIPT_STATES.WITHDRAWN:
        // No actions available for withdrawn manuscripts
        break;
        
      case MANUSCRIPT_STATES.REJECTED:
        // No actions available for rejected manuscripts
        break;
        
      default:
        break;
    }
    
    return actions;
  };
  
  // Handle state change
  const handleStateChange = async (newState) => {
    // Special handling for EDIT action
    if (newState === 'EDIT') {
      setIsEditing(true);
      return;
    }
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = { state: newState };
      
      // Handle withdrawal separately
      if (newState === MANUSCRIPT_STATES.WITHDRAWN) {
        await axios.put(
          `${MANUSCRIPT_WITHDRAW_ENDPOINT}/${manuscript.id}`,
          {},
          {
            headers: {
              'X-User-Email': userEmail,
              'Content-Type': 'application/json'
            }
          }
        );
      } else {
        // Regular state change
        await axios.put(
          `${MANUSCRIPT_STATE_ENDPOINT}/${manuscript.id}`,
          payload,
          {
            headers: {
              'X-User-Email': userEmail,
              'Content-Type': 'application/json'
            }
          }
        );
      }
      
      setSuccess(`Manuscript state updated to ${newState}`);
      refreshManuscript();
    } catch (err) {
      setError(`Error changing state: ${err.response?.data?.error || err.message}`);
      console.error('Error changing state:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle referee assignment
  const handleAssignReferee = async (e) => {
    e.preventDefault();
    if (!selectedReferee) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      const payload = { referee_email: selectedReferee };
      
      await axios.put(
        `${MANUSCRIPT_REFEREE_ENDPOINT}/${manuscript.id}`,
        payload,
        {
          headers: {
            'X-User-Email': userEmail,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(`Referee ${selectedReferee} assigned successfully.`);
      setSelectedReferee('');
      refreshManuscript();
    } catch (err) {
      setError(`Error assigning referee: ${err.response?.data?.error || err.message}`);
      console.error('Error assigning referee:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle referee removal
  const handleRemoveReferee = async (refereeEmail) => {
    setLoading(true);
    setError('');
    setSuccess('');
    
    try {
      await axios.delete(
        `${MANUSCRIPT_REFEREE_ENDPOINT}/${manuscript.id}?referee_email=${refereeEmail}`,
        {
          headers: {
            'X-User-Email': userEmail,
            'Content-Type': 'application/json'
          }
        }
      );
      
      setSuccess(`Referee ${refereeEmail} removed successfully.`);
      refreshManuscript();
    } catch (err) {
      setError(`Error removing referee: ${err.response?.data?.error || err.message}`);
      console.error('Error removing referee:', err);
    } finally {
      setLoading(false);
    }
  };
  
  // Handle referee review submission
  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewData.report || !reviewData.verdict) return;
    
    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log("Submitting review with data:", reviewData);
    
    // First, save to localStorage to ensure we have a backup
    try {
      const reviewToSave = {
        report: reviewData.report,
        verdict: reviewData.verdict,
        timestamp: new Date().toISOString()
      };
      localStorage.setItem(`${STORAGE_KEYS.MANUSCRIPT_REVIEW}${manuscript.id}`, JSON.stringify(reviewToSave));
      console.log('Review data saved to localStorage:', reviewToSave);
    } catch (e) {
      console.warn('Could not save review to localStorage:', e);
    }
    
    try {
      const payload = {
        report: reviewData.report,
        verdict: reviewData.verdict
      };
      
      try {
        // First try the dedicated review endpoint
        console.log(`Trying dedicated review endpoint: ${MANUSCRIPT_REVIEW_ENDPOINT}/${manuscript.id}`);
        const response = await axios.post(
          `${MANUSCRIPT_REVIEW_ENDPOINT}/${manuscript.id}`,
          payload,
          {
            headers: {
              'X-User-Email': userEmail,
              'Content-Type': 'application/json'
            }
          }
        );
        console.log('Review successfully submitted through review endpoint:', response);
      } catch (error) {
        console.warn('Review endpoint failed, trying direct manuscript update', error);
        
        // Fallback: Update the manuscript directly with review data using multiple property names
        const updatedManuscript = {
          ...manuscript,
          // Try multiple property names to ensure at least one works
          referee_review: reviewData.report,
          referee_verdict: reviewData.verdict,
          review: reviewData.report,
          verdict: reviewData.verdict,
          report: reviewData.report,
          review_report: reviewData.report,
          referees: {
            ...(manuscript.referees || {}),
            [userEmail]: {
              report: reviewData.report,
              verdict: reviewData.verdict
            }
          }
        };
        
        console.log(`Trying direct manuscript update at: ${backendUrl}/manuscripts/${manuscript.id}`);
        console.log('Updated manuscript payload:', updatedManuscript);
        
        try {
          const response = await axios.put(
            `${backendUrl}/manuscripts/${manuscript.id}`,
            updatedManuscript,
            {
              headers: {
                'X-User-Email': userEmail,
                'Content-Type': 'application/json'
              }
            }
          );
          console.log('Direct update response:', response);
        } catch (putError) {
          console.error('Direct manuscript update failed:', putError);
          
          // Last resort: Try a POST to the manuscripts endpoint
          console.log('Trying POST to manuscripts endpoint as last resort');
          await axios.post(
            `${backendUrl}/manuscripts`,
            {
              id: manuscript.id,
              review: reviewData.report,
              verdict: reviewData.verdict
            },
            {
              headers: {
                'X-User-Email': userEmail,
                'Content-Type': 'application/json'
              }
            }
          );
        }
      }
      
      // Always display the review locally, even if backend storage failed
      console.log('Setting success message and updating local display');
      setSuccess('Review submitted successfully. Your review: ' + reviewData.report);
      
      setReviewData({ report: '', verdict: '' });
      
      // Force a complete refresh to ensure we get the updated data
      console.log('Triggering manuscript refresh');
      
      // Force reload the page to ensure everything is refreshed
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (err) {
      console.error('Overall review submission failed:', err);
      setError(`Error submitting review: ${err.response?.data?.error || err.message}`);
    } finally {
      setLoading(false);
    }
  };
  
  // Get available actions for the current state and user role
  const availableActions = getAvailableActions();
  
  // Render referee actions
  const renderRefereeActions = () => {
    if (!isReferee || manuscript.state !== MANUSCRIPT_STATES.REFEREE_REVIEW) return null;
    
    // Check if a review was already submitted (stored in localStorage)
    let submittedReview = null;
    try {
      const savedReview = localStorage.getItem(`${STORAGE_KEYS.MANUSCRIPT_REVIEW}${manuscript.id}`);
      if (savedReview) {
        submittedReview = JSON.parse(savedReview);
      }
    } catch (e) {
      console.warn('Error retrieving saved review:', e);
    }
    
    return (
      <div className="workflow-actions">
        <h4>Referee Actions</h4>
        
        {submittedReview ? (
          <div className="submitted-review-display">
            <h5>Your Submitted Review</h5>
            <div className="review-notes" style={{marginBottom: '15px'}}>
              <p><strong>Report:</strong> {submittedReview.report}</p>
              <p style={{marginTop: '10px'}}>
                <strong>Verdict:</strong>{' '}
                <span className={`verdict ${submittedReview.verdict.toLowerCase()}`}>
                  {submittedReview.verdict === VERDICT_TYPES.MINOR_REVISIONS || submittedReview.verdict === VERDICT_TYPES.MAJOR_REVISIONS ? 
                   'Accept with Revisions' : submittedReview.verdict.replace('_', ' ')}
                </span>
              </p>
              <p style={{fontSize: '12px', color: '#666', marginTop: '10px'}}>
                <em>Submitted: {new Date(submittedReview.timestamp).toLocaleString()}</em>
              </p>
            </div>
            <button 
              onClick={() => {
                if (window.confirm('Do you want to submit a new review? This will replace your previous review.')) {
                  localStorage.removeItem(`${STORAGE_KEYS.MANUSCRIPT_REVIEW}${manuscript.id}`);
                  window.location.reload();
                }
              }}
              style={{backgroundColor: '#9c27b0'}}
              className="action-button"
            >
              Submit New Review
            </button>
          </div>
        ) : (
          <div className="referee-review">
            <form onSubmit={handleReviewSubmit} className="review-form">
              <div className="form-group">
                <label htmlFor="review-report">Review Report:</label>
                <textarea
                  id="review-report"
                  value={reviewData.report}
                  onChange={(e) => setReviewData({...reviewData, report: e.target.value})}
                  rows="6"
                  placeholder="Enter your review of the manuscript here..."
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="review-verdict">Verdict:</label>
                <select
                  id="review-verdict"
                  value={reviewData.verdict}
                  onChange={(e) => setReviewData({...reviewData, verdict: e.target.value})}
                >
                  <option value="">Select a verdict</option>
                  <option value={VERDICT_TYPES.ACCEPT}>Accept</option>
                  <option value={VERDICT_TYPES.REJECT}>Reject</option>
                  <option value={VERDICT_TYPES.ACCEPT_WITH_REVISIONS}>Accept with Revisions</option>
                </select>
              </div>
              
              <button
                onClick={handleReviewSubmit}
                disabled={!reviewData.report || !reviewData.verdict}
                className="action-button"
                style={{ backgroundColor: '#9c27b0' }}
              >
                Submit Review
              </button>
            </form>
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="manuscript-workflow">
      <div className="workflow-header">
        <h3>Manuscript Workflow</h3>
        <div className="current-state">
          Current State: <StateDisplay state={manuscript.state} />
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      {/* Manuscript editor when in editing mode */}
      {isEditing && isAuthor && manuscript.state === MANUSCRIPT_STATES.AUTHOR_REVISIONS ? (
        <ManuscriptEditor 
          manuscript={manuscript}
          userEmail={userEmail}
          onSave={() => {
            setIsEditing(false);
            setSuccess("Manuscript updated successfully");
            setEditCompleted(true);
          }}
          onCancel={() => setIsEditing(false)}
        />
      ) : (
        <>
          {/* Available actions based on state and user role */}
          {availableActions.length > 0 && (
            <div className="workflow-actions">
              <h4>Available Actions</h4>
              <div className="action-buttons">
                {availableActions.map((action, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      if (action.action === 'EDIT' || 
                          window.confirm(`Are you sure you want to change the state to ${action.action}?`)) {
                        handleStateChange(action.action);
                      }
                    }}
                    disabled={loading}
                    style={{ backgroundColor: action.color }}
                    className="action-button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          {/* Referee assignment (for editors) */}
          {isEditor && manuscript.state !== MANUSCRIPT_STATES.PUBLISHED && 
           manuscript.state !== MANUSCRIPT_STATES.WITHDRAWN && 
           manuscript.state !== MANUSCRIPT_STATES.REJECTED && (
            <div className="referee-assignment">
              <h4>Referee Management</h4>
              
              {/* Current referees */}
              {manuscriptReferees.length > 0 ? (
                <div className="current-referees">
                  <h5>Assigned Referees</h5>
                  <ul>
                    {manuscriptReferees.map(email => (
                      <li key={email}>
                        {email}
                        <button
                          className="remove-button"
                          onClick={() => {
                            if (window.confirm(`Are you sure you want to remove referee ${email}?`)) {
                              handleRemoveReferee(email);
                            }
                          }}
                          disabled={loading}
                        >
                          Remove
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p>No referees assigned.</p>
              )}
              
              {/* Assign referee form */}
              <form onSubmit={handleAssignReferee} className="assign-referee-form">
                <select
                  value={selectedReferee}
                  onChange={e => setSelectedReferee(e.target.value)}
                  disabled={loading}
                  required
                >
                  <option value="">-- Select a referee --</option>
                  {referees.map(referee => (
                    <option key={referee.email} value={referee.email}>
                      {referee.name} ({referee.email})
                    </option>
                  ))}
                </select>
                <button type="submit" disabled={loading || !selectedReferee}>
                  Assign Referee
                </button>
              </form>
            </div>
          )}
          
          {renderRefereeActions()}
        </>
      )}
      
      {loading && <div className="loading-overlay">Processing...</div>}
    </div>
  );
}

ManuscriptWorkflow.propTypes = {
  manuscript: PropTypes.object.isRequired,
  userEmail: PropTypes.string.isRequired,
  userRoles: PropTypes.array,
  refreshManuscript: PropTypes.func.isRequired,
  referees: PropTypes.array
};

export default ManuscriptWorkflow;