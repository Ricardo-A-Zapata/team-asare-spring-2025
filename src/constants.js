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
