export const BACKEND_URL = process.env.REACT_APP_URL_PRE || 'https://teamasare.pythonanywhere.com';

// Flag to determine if we should use direct API calls or a development proxy
export const USE_DEV_PROXY = process.env.REACT_APP_USE_PROXY === 'true' || false;

// Helper function to construct API URLs with potential proxy prefix
export const getApiUrl = (endpoint) => {
  // Remove trailing slash from backend URL if present
  const baseUrl = BACKEND_URL.endsWith('/') ? BACKEND_URL.slice(0, -1) : BACKEND_URL;
  
  // Add leading slash to endpoint if not present
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  // When in development with proxy enabled, use relative URLs
  if (USE_DEV_PROXY && process.env.NODE_ENV === 'development') {
    return formattedEndpoint;
  }
  
  // Otherwise use the full URL
  return `${baseUrl}${formattedEndpoint}`;
};

// Manuscript states
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

// Verdict types
export const VERDICT_TYPES = {
  ACCEPT: 'ACCEPT',
  REJECT: 'REJECT',
  ACCEPT_WITH_REVISIONS: 'ACCEPT_WITH_REVISIONS',
  MINOR_REVISIONS: 'MINOR_REVISIONS',
  MAJOR_REVISIONS: 'MAJOR_REVISIONS'
};

// User roles
export const USER_ROLES = {
  EDITOR: 'ED',
  REFEREE: 'RE',
  AUTHOR: 'AU'
};

// API endpoints
export const API_ENDPOINTS = {
  MANUSCRIPTS_READ: '/manuscripts',
  USERS_READ: '/user/read',
  MANUSCRIPT_STATE: '/manuscript/state',
  MANUSCRIPT_REFEREE: '/manuscript/referee',
  MANUSCRIPT_REVIEW: '/manuscript/review',
  MANUSCRIPT_WITHDRAW: '/manuscript/withdraw',
  MANUSCRIPT_TEXT: '/manuscript/text',
  MANUSCRIPT_CREATE: '/manuscript/create'
};

// Local storage keys
export const STORAGE_KEYS = {
  LOGGED_IN: 'loggedIn',
  EMAIL: 'email',
  MANUSCRIPT_REVIEW: 'manuscript_review_'
};
