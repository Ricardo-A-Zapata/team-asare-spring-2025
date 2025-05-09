import React from 'react';
import PropTypes from 'prop-types';
import './ManuscriptStateFlow.css';

// Define the manuscript states
export const MANUSCRIPT_STATES = {
  SUBMITTED: 'SUBMITTED',
  REJECTED: 'REJECTED',
  REFEREE_REVIEW: 'REFEREE_REVIEW',
  AUTHOR_REVISIONS: 'AUTHOR_REVISIONS',
  WITHDRAWN: 'WITHDRAWN',
  COPY_EDIT: 'COPY_EDIT',
  AUTHOR_REVIEW: 'AUTHOR_REVIEW',
  FORMATTING: 'FORMATTING',
  PUBLISHED: 'PUBLISHED',
  EDITOR_REVIEW: 'EDITOR_REVIEW'
};

// Define the flow of states for visualization
const STATE_FLOW = [
  { state: MANUSCRIPT_STATES.SUBMITTED, label: 'Submitted' },
  { state: MANUSCRIPT_STATES.REFEREE_REVIEW, label: 'Referee Review' },
  { state: MANUSCRIPT_STATES.AUTHOR_REVISIONS, label: 'Author Revisions' },
  { state: MANUSCRIPT_STATES.EDITOR_REVIEW, label: 'Editor Review' },
  { state: MANUSCRIPT_STATES.COPY_EDIT, label: 'Copy Edit' },
  { state: MANUSCRIPT_STATES.AUTHOR_REVIEW, label: 'Author Review' },
  { state: MANUSCRIPT_STATES.FORMATTING, label: 'Formatting' },
  { state: MANUSCRIPT_STATES.PUBLISHED, label: 'Published' }
];

// Terminal states that are displayed separately
const TERMINAL_STATES = [
  { state: MANUSCRIPT_STATES.REJECTED, label: 'Rejected' },
  { state: MANUSCRIPT_STATES.WITHDRAWN, label: 'Withdrawn' }
];

function ManuscriptStateFlow({ currentState }) {
  // Find the index of the current state in the flow
  const currentIndex = STATE_FLOW.findIndex(item => item.state === currentState);
  
  // Check if current state is a terminal state
  const isTerminalState = TERMINAL_STATES.some(item => item.state === currentState);
  
  return (
    <div className="manuscript-state-flow">
      <h3>Manuscript Publication Flow</h3>
      
      <div className="state-flow-container">
        {STATE_FLOW.map((item, index) => {
          // Determine the state's status relative to current
          let stateStatus = '';
          if (isTerminalState) {
            stateStatus = 'inactive'; // If in terminal state, all main flow states are inactive
          } else if (index === currentIndex) {
            stateStatus = 'current';
          } else if (index < currentIndex) {
            stateStatus = 'completed';
          } else {
            stateStatus = 'upcoming';
          }
          
          return (
            <React.Fragment key={item.state}>
              {/* Only add connector after first item */}
              {index > 0 && (
                <div className={`state-connector ${stateStatus === 'upcoming' ? 'upcoming' : stateStatus === 'completed' ? 'completed' : ''}`}></div>
              )}
              
              <div className={`state-node ${stateStatus}`}>
                <div className="state-indicator">{index + 1}</div>
                <div className="state-label">{item.label}</div>
              </div>
            </React.Fragment>
          );
        })}
      </div>
      
      {/* Display terminal states */}
      <div className="terminal-states">
        {TERMINAL_STATES.map((item) => (
          <div 
            key={item.state} 
            className={`terminal-state ${currentState === item.state ? 'current' : ''}`}
          >
            {item.label}
          </div>
        ))}
      </div>
    </div>
  );
}

ManuscriptStateFlow.propTypes = {
  currentState: PropTypes.string.isRequired
};

export default ManuscriptStateFlow; 