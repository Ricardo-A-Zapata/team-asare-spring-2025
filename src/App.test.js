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

test('navigates to Users page when link is clicked', async () => {
  render(<App />);

  const usersLink = screen.getByRole('link', { name: /view all users/i });
  await userEvent.click(usersLink);

  expect(await screen.findByRole('heading', { name: /view all users/i })).toBeInTheDocument();
});

test('navigates to Manuscripts page via Navbar link', async () => {
  render(<App />);

  const manuscriptsLink = screen.getByRole('link', { name: /view all manuscripts/i });
  await userEvent.click(manuscriptsLink);

  expect(await screen.findByRole('heading', { name: /manuscripts/i })).toBeInTheDocument();
});