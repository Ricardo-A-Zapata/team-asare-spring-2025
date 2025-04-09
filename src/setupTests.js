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
    message.includes('React Router Future Flag Warning')
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
    message.includes('Journal API Response')
  ) {
    return;
  }
  originalLog(...args);
};