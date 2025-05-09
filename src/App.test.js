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

    if (url.includes('/text/read/HomePage')) {
      return Promise.resolve({
        data: { 
          Content: {
            title: 'Mock Home Page',
            text: 'Welcome to the test journal'
          }
        },
      });
    }

    if (url.includes('/text/read/AboutPage')) {
      return Promise.resolve({
        data: { 
          Content: {
            title: 'About Our Journal',
            text: 'This is our test journal'
          }
        },
      });
    }

    if (url.includes('/text/read/MissionPage')) {
      return Promise.resolve({
        data: { 
          Content: {
            title: 'Our Mission',
            text: 'To provide a testing platform'
          }
        },
      });
    }

    if (url.includes('/user/read')) {
      return Promise.resolve({
        data: { 
          Users: {
            'admin@example.com': {
              email: 'admin@example.com',
              name: 'Admin User',
              roleCodes: ['ED']
            }
          }
        },
      });
    }

    if (url.includes('/roles/read')) {
      return Promise.resolve({
        data: { 
          AU: 'Author', 
          ED: 'Editor', 
          RE: 'Reviewer' 
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

test('navigates to About page when link is clicked', async () => {
  render(<App />);

  const aboutLink = screen.getByRole('link', { name: /about/i });
  await userEvent.click(aboutLink);

  expect(await screen.findByRole('heading', { name: /about/i })).toBeInTheDocument();
});

test('navigates to Manuscripts page via Navbar link', async () => {
  render(<App />);

  const manuscriptsLink = screen.getByRole('link', { name: /view all manuscripts/i });
  await userEvent.click(manuscriptsLink);

  expect(await screen.findByRole('heading', { name: /view all manuscripts/i })).toBeInTheDocument();
});
