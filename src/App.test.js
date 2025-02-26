import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

test('renders Navbar component', () => {
  render(<App />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

test('renders Home component by default', () => {
  render(<App />);
  expect(screen.getByText(/home/i)).toBeInTheDocument();
});
