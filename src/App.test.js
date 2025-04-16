import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';
import axios from 'axios';

jest.mock('axios');

beforeEach(() => {
  axios.get.mockImplementation((url) => {
    if (url.includes('/journalname')) {
      return Promise.resolve({
        data: { "Journal Name": "Mock Journal" },
      });
    }

    if (url.includes('/manuscripts')) {
      return Promise.resolve({
        data: {
          manuscripts: {
            '1': {
              title: 'Mock Manuscript One',
              author: 'Author A',
              author_email: 'authora@example.com',
              state: 'Pending',
              abstract: 'This is the abstract of manuscript one.',
              version: 1,
            },
            '2': {
              title: 'Mock Manuscript Two',
              author: 'Author B',
              author_email: 'authorb@example.com',
              state: 'Approved',
              abstract: 'This is the abstract of manuscript two.',
              version: 2,
            },
          },
        },
      });
    }

    return Promise.reject(new Error(`Unhandled URL: ${url}`));
  });
});

afterEach(() => {
  jest.clearAllMocks();
});

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
