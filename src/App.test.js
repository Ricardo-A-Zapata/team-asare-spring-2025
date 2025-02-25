import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders Navbar component', () => {
  render(<App />);
  expect(screen.getByRole('navigation')).toBeInTheDocument();
});

test('renders Home component by default', () => {
  render(<App />);
  expect(screen.getByText(/home/i)).toBeInTheDocument();
});
