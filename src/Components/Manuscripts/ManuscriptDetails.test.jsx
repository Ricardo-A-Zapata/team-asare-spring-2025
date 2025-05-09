import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ManuscriptDetails from './ManuscriptDetails';
import { AuthProvider } from '../../AuthContext';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { STORAGE_KEYS } from '../../constants';

jest.mock('axios');

const mockManuscript = {
  title: 'Test Title',
  author: 'Test Author',
  author_email: 'test@example.com',
  version: 3,
  state: 'PENDING',
  abstract: 'Test abstract here.',
  text: 'Full manuscript content.',
};

const mockUsers = {
  Users: {
    'user1': {
      email: 'test@example.com',
      name: 'Test User',
      roleCodes: ['AU', 'ED']
    },
    'user2': {
      email: 'referee@example.com',
      name: 'Referee User',
      roleCodes: ['RE']
    }
  }
};

const renderWithRouter = (id) =>
  render(
    <AuthProvider>
      <MemoryRouter initialEntries={[`/manuscripts/${id}`]}>
        <Routes>
          <Route path="/manuscripts/:id" element={<ManuscriptDetails />} />
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );

describe('ManuscriptDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock localStorage for auth
    Storage.prototype.getItem = jest.fn((key) => {
      if (key === STORAGE_KEYS.LOGGED_IN) return 'true';
      if (key === STORAGE_KEYS.EMAIL) return 'test@example.com';
      return null;
    });
  });

  it('renders loading state initially', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/manuscripts')) {
        return Promise.resolve({ data: { manuscripts: { '1': mockManuscript } } });
      } else if (url.includes('/user/read')) {
        return Promise.resolve({ data: mockUsers });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    renderWithRouter('1');

    expect(screen.getByText(/loading manuscript details/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });

  it('displays manuscript details on success', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/manuscripts')) {
        return Promise.resolve({ data: { manuscripts: { '1': mockManuscript } } });
      } else if (url.includes('/user/read')) {
        return Promise.resolve({ data: mockUsers });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });

    renderWithRouter('1');

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText(/Test Author/)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
      expect(screen.getAllByText(/PENDING/)).toHaveLength(2);
      expect(screen.getByText(/Test abstract here/)).toBeInTheDocument();
      expect(screen.getByText(/Full manuscript content/)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/user/read')) {
        return Promise.resolve({ data: mockUsers });
      }
      return Promise.reject(new Error('Network Error'));
    });

    renderWithRouter('1');

    await waitFor(() => {
      expect(screen.getByText(/Error loading data/i)).toBeInTheDocument();
    });
  });

  it('displays not found message if manuscript ID is not present in response', async () => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/manuscripts')) {
        return Promise.resolve({ data: { manuscripts: {} } });
      } else if (url.includes('/user/read')) {
        return Promise.resolve({ data: mockUsers });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  
    renderWithRouter('123');
  
    await waitFor(() => {
      expect(screen.getByText('Error')).toBeInTheDocument();
      expect(screen.getByText('Manuscript not found')).toBeInTheDocument();
    });
  });      

  it('StateDisplay renders correct state and class', () => {
    const { container } = render(<span className="state pending">PENDING</span>);
    const span = container.querySelector('span');
    expect(span).toHaveClass('state pending');
    expect(span).toHaveTextContent('PENDING');
  });
});
