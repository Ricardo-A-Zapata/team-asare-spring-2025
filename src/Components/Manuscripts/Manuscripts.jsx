import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import PropTypes from 'prop-types';

import { BACKEND_URL, API_ENDPOINTS, USER_ROLES } from '../../constants';
import Loading from '../Loading/Loading';
import AddManuscriptForm from './AddManuscriptForm';
import { useAuth } from '../../AuthContext';
import './Manuscripts.css';

// Remove trailing slash if present to ensure proper URL formation
const backendUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
const MANUSCRIPTS_READ_ENDPOINT = `${backendUrl}${API_ENDPOINTS.MANUSCRIPTS_READ}`;
const USERS_READ_ENDPOINT = `${backendUrl}${API_ENDPOINTS.USERS_READ}`;

// Helper function to convert manuscripts object to array
function manuscriptsToArray(manuscripts) {
  return Object.entries(manuscripts).map(([id, manuscript]) => ({
    id,
    ...manuscript
  }));
}

// Filter manuscripts based on search term
function filterManuscripts(manuscripts, searchTerm) {
  if (!searchTerm) return manuscripts;
  
  const term = searchTerm.toLowerCase();
  return manuscripts.filter(manuscript => 
    manuscript.title.toLowerCase().includes(term) ||
    manuscript.author.toLowerCase().includes(term) ||
    manuscript.author_email.toLowerCase().includes(term) ||
    manuscript.state.toLowerCase().includes(term)
  );
}

// Sort manuscripts based on sort configuration
function sortManuscripts(manuscripts, sortConfig) {
  if (!sortConfig) return manuscripts;

  return [...manuscripts].sort((a, b) => {
    switch (sortConfig.field) {
      case 'title':
        return sortConfig.direction === 'asc' 
          ? a.title.localeCompare(b.title)
          : b.title.localeCompare(a.title);
      case 'author':
        return sortConfig.direction === 'asc'
          ? a.author.localeCompare(b.author)
          : b.author.localeCompare(a.author);
      case 'state':
        return sortConfig.direction === 'asc'
          ? a.state.localeCompare(b.state)
          : b.state.localeCompare(a.state);
      case 'version':
        return sortConfig.direction === 'asc'
          ? a.version - b.version
          : b.version - a.version;
      default:
        return 0;
    }
  });
}

// Login Modal component
function LoginModal({ onClose }) {
  const navigate = useNavigate();
  
  const goToLogin = () => {
    navigate('/login');
  };
  
  const goToSignup = () => {
    navigate('/signup');
  };
  
  return (
    <div className="login-modal-overlay">
      <div className="login-modal">
        <h3>Authentication Required</h3>
        <p>You need to be logged in to submit a manuscript.</p>
        <div className="login-modal-buttons">
          <button type="button" onClick={goToLogin}>Login</button>
          <button type="button" onClick={goToSignup}>Sign Up</button>
          <button type="button" className="cancel-button" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

LoginModal.propTypes = {
  onClose: PropTypes.func.isRequired
};

function ManuscriptSorting({ sortConfig, setSortConfig }) {
  const handleSortChange = (event) => {
    const value = event.target.value;
    if (value === 'default') {
      setSortConfig(null);
    } else {
      const [field, direction] = value.split('-');
      setSortConfig({ field, direction });
    }
  };

  return (
    <div className="manuscript-sort">
      <select
        value={sortConfig ? `${sortConfig.field}-${sortConfig.direction}` : 'default'}
        onChange={handleSortChange}
        aria-label="Sort manuscripts"
      >
        <option value="default">Default Order</option>
        <option value="title-asc">Title (A-Z)</option>
        <option value="title-desc">Title (Z-A)</option>
        <option value="author-asc">Author (A-Z)</option>
        <option value="author-desc">Author (Z-A)</option>
        <option value="state-asc">State (A-Z)</option>
        <option value="state-desc">State (Z-A)</option>
        <option value="version-asc">Version (Low to High)</option>
        <option value="version-desc">Version (High to Low)</option>
      </select>
    </div>
  );
}

ManuscriptSorting.propTypes = {
  sortConfig: PropTypes.shape({
    field: PropTypes.string.isRequired,
    direction: PropTypes.oneOf(['asc', 'desc']).isRequired
  }),
  setSortConfig: PropTypes.func.isRequired
};

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

function Manuscript({ manuscript }) {
  const { id, title, author, author_email, state, abstract, version } = manuscript;
  const navigate = useNavigate();
  
  const handleViewDetails = () => {
    navigate(`/manuscripts/${id}`);
  };
  
  return (
    <div className="manuscript-container">
      <div className="manuscript-content">
        <h2>{title}</h2>
        <p><strong>Author:</strong> {author}</p>
        <p><strong>Email:</strong> {author_email}</p>
        <p><strong>Version:</strong> {version}</p>
        <p><strong>State:</strong> <StateDisplay state={state} /></p>
        <p><strong>Abstract:</strong> {abstract}</p>
      </div>
      <div className="manuscript-controls">
        <button type="button" onClick={handleViewDetails}>View Details</button>
      </div>
    </div>
  );
}

Manuscript.propTypes = {
  manuscript: PropTypes.shape({
    id: PropTypes.string.isRequired,
    title: PropTypes.string.isRequired,
    author: PropTypes.string.isRequired,
    author_email: PropTypes.string.isRequired,
    state: PropTypes.string.isRequired,
    abstract: PropTypes.string.isRequired,
    version: PropTypes.number.isRequired
  }).isRequired
};

function Manuscripts() {
  const [manuscripts, setManuscripts] = useState([]);
  const [filteredManuscripts, setFilteredManuscripts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [addingManuscript, setAddingManuscript] = useState(false);
  const [isOperationLoading, setIsOperationLoading] = useState(false);
  const [sortConfig, setSortConfig] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isLoggedIn, userEmail } = useAuth();

  const fetchManuscripts = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const { data } = await axios.get(MANUSCRIPTS_READ_ENDPOINT);
      
      if (data && data.manuscripts) {
        let manuscriptsArray = manuscriptsToArray(data.manuscripts);
        
        // Get current user's roles
        const { data: userData } = await axios.get(USERS_READ_ENDPOINT);
        const users = Object.values(userData.Users);
        const currentUser = users.find(user => user.email === userEmail);
        
        // If user is not an editor, only show their own manuscripts
        if (currentUser && !currentUser.roleCodes?.includes(USER_ROLES.EDITOR)) {
          manuscriptsArray = manuscriptsArray.filter(manuscript => 
            manuscript.author_email.toLowerCase() === userEmail.toLowerCase()
          );
        }
        
        setManuscripts(manuscriptsArray);
        setFilteredManuscripts(manuscriptsArray);
      } else {
        setError('Invalid response format from the server');
      }
    } catch (error) {
      setError('There was a problem retrieving manuscripts. Please try again later.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchManuscripts();
  }, []);

  // Update filtered manuscripts when search term or sort config changes
  useEffect(() => {
    let result = filterManuscripts(manuscripts, searchTerm);
    result = sortManuscripts(result, sortConfig);
    setFilteredManuscripts(result);
  }, [manuscripts, searchTerm, sortConfig]);

  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const showAddManuscriptForm = () => {
    if (isLoggedIn) {
      setAddingManuscript(true);
      setError('');
    } else {
      setShowLoginModal(true);
    }
  };

  const hideAddManuscriptForm = () => {
    setAddingManuscript(false);
    setError('');
  };
  
  const hideLoginModal = () => {
    setShowLoginModal(false);
  };

  return (
    <div className="wrapper">
      {isLoading && !isOperationLoading ? (
        <Loading message="Loading manuscripts..." />
      ) : (
        <>
          <header>
            <h1>View All Manuscripts</h1>
            <button 
              type="button" 
              onClick={showAddManuscriptForm}
              disabled={isOperationLoading}
            >
              Submit New Manuscript
            </button>
          </header>
          
          {showLoginModal && (
            <LoginModal onClose={hideLoginModal} />
          )}
          
          <AddManuscriptForm
            visible={addingManuscript}
            cancel={hideAddManuscriptForm}
            fetchManuscripts={fetchManuscripts}
            setError={setError}
            setIsOperationLoading={setIsOperationLoading}
          />
          
          <div className="manuscript-controls">
            <div className="manuscript-search">
              <input
                type="text"
                placeholder="Search by title, author, email or state"
                value={searchTerm}
                onChange={handleSearchChange}
                aria-label="Search manuscripts"
              />
              {searchTerm && (
                <button type="button" onClick={clearSearch}>
                  Clear
                </button>
              )}
            </div>
            
            {filteredManuscripts.length > 0 && (
              <ManuscriptSorting sortConfig={sortConfig} setSortConfig={setSortConfig} />
            )}
          </div>
          
          <div className="manuscript-count">
            {filteredManuscripts.length === manuscripts.length 
              ? `Showing all ${manuscripts.length} manuscripts` 
              : `Showing ${filteredManuscripts.length} of ${manuscripts.length} manuscripts`}
          </div>
          
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {filteredManuscripts.length > 0 ? (
            filteredManuscripts.map(manuscript => (
              <Manuscript 
                key={manuscript.id} 
                manuscript={manuscript} 
              />
            ))
          ) : (
            <p className="no-results">
              {searchTerm ? 'No manuscripts match your search criteria.' : 'No manuscripts available.'}
            </p>
          )}
          
          {isOperationLoading && <Loading message="Processing your request..." />}
        </>
      )}
    </div>
  );
}

export default Manuscripts; 