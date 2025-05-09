// jest-dom adds custom jest matchers for asserting on DOM nodes.
// allows you to do things like:
// expect(element).toHaveTextContent(/react/i)
// learn more: https://github.com/testing-library/jest-dom
import '@testing-library/jest-dom';

window.confirm = jest.fn(() => true);

const originalWarn = console.warn;

console.warn = (...args) => {
  const [message] = args;
  if (
    typeof message === 'string' &&
    (message.includes('React Router Future Flag Warning') ||
     message.includes('Dedicated recent manuscripts endpoint not available') ||
     message.includes('Error fetching home content:') ||
     message.includes('Error refreshing content after update:'))
  ) {
    return;
  }
  originalWarn(...args);
};

const originalLog = console.log;

console.log = (...args) => {
  const [message] = args;
  if (
    typeof message === 'string' &&
    (message.includes('Journal API Response') ||
     message.includes('Roles response:') ||
     message.includes('Processed roles:') ||
     message.includes('Current user roles:') ||
     message.includes('Manuscript data:') ||
     message.includes('Server response:') ||
     message.includes('Sending manuscript to:') ||
     message.includes('Fetching roles from:'))
  ) {
    return;
  }
  originalLog(...args);
};

const originalError = console.error;

console.error = (...args) => {
  const [message] = args;
  if (
    typeof message === 'string' &&
    (message.includes('Warning: An update to') || 
     message.includes('inside a test was not wrapped in act') ||
     message.includes('Error fetching about content:') ||
     message.includes('Error fetching mission content:') ||
     message.includes('Error fetching user info:') ||
     message.includes('Error fetching roles:') ||
     message.includes('Error checking editor status:') ||
     message.includes('Full error object:') ||
     message.includes('Error response:') ||
     message.includes('Error request:') ||
     message.includes('Error details:') ||
     message.includes('Cannot destructure property') ||
     message.includes('The above error occurred in the <Link> component:') ||
     message.includes('basename') ||
     message.includes('useContext(...) as it is null'))
  ) {
    return;
  }
  originalError(...args);
};