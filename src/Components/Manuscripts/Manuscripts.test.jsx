import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Manuscripts from './Manuscripts';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../AuthContext';
import { MANUSCRIPT_STATES } from '../../constants';

jest.mock('axios');

const mockManuscripts = {
  manuscripts: {
    '1': {
      id: '1',
      title: 'Quantum Entanglement Explained',
      author: 'Alice Q.',
      author_email: 'alice@example.com',
      state: MANUSCRIPT_STATES.SUBMITTED,
      abstract: 'An explanation of entanglement.',
      version: 1
    },
    '2': {
      id: '2',
      title: 'Black Holes and Hawking Radiation',
      author: 'Bob H.',
      author_email: 'bob@example.com',
      state: MANUSCRIPT_STATES.PUBLISHED,
      abstract: 'Deep dive into black hole theory.',
      version: 2
    }
  }
};

// Mock user roles data
const mockUsers = {
  Users: {
    'admin@example.com': {
      email: 'admin@example.com',
      name: 'Admin User',
      roleCodes: ['ED']
    }
  }
};

describe('Manuscripts Component', () => {
  beforeEach(() => {
    axios.get.mockImplementation((url) => {
      if (url.includes('/manuscripts')) {
        return Promise.resolve({ data: mockManuscripts });
      }
      if (url.includes('/user/read')) {
        return Promise.resolve({ data: mockUsers });
      }
      return Promise.reject(new Error(`Unhandled URL: ${url}`));
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderWithRouter = (ui) => {
    return render(
      <AuthProvider>
        <BrowserRouter>{ui}</BrowserRouter>
      </AuthProvider>
    );
  };

  test('displays loading message initially', async () => {
    renderWithRouter(<Manuscripts />);
    
    // Check for loading message
    expect(screen.getByText(/loading manuscripts/i)).toBeInTheDocument();
    
    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.queryByText(/loading manuscripts/i)).not.toBeInTheDocument();
    });
  });

  test('displays all manuscripts after fetch', async () => {
    renderWithRouter(<Manuscripts />);
    
    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.getByText('Quantum Entanglement Explained')).toBeInTheDocument();
      expect(screen.getByText('Black Holes and Hawking Radiation')).toBeInTheDocument();
    });
  });

  test('filters manuscripts when search term is applied', async () => {
    renderWithRouter(<Manuscripts />);
    
    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.getByText('Quantum Entanglement Explained')).toBeInTheDocument();
    });

    // Type in search box
    const searchInput = screen.getByPlaceholderText(/search by title, author, email or state/i);
    await act(async () => {
      await userEvent.type(searchInput, 'Black Holes');
    });

    // Check filtered results
    await waitFor(() => {
      expect(screen.getByText('Black Holes and Hawking Radiation')).toBeInTheDocument();
      expect(screen.queryByText('Quantum Entanglement Explained')).not.toBeInTheDocument();
    });
  });

  test('shows no match message when filter returns no results', async () => {
    renderWithRouter(<Manuscripts />);
    
    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.getByText('Quantum Entanglement Explained')).toBeInTheDocument();
    });

    // Type non-matching search term
    const searchInput = screen.getByPlaceholderText(/search by title, author, email or state/i);
    await act(async () => {
      await userEvent.type(searchInput, 'Dark Energy');
    });

    // Check no results message
    await waitFor(() => {
      expect(screen.getByText(/no manuscripts match your search criteria/i)).toBeInTheDocument();
    });
  });

  test('displays error message if API call fails', async () => {
    // Mock rejection for this specific test
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    
    renderWithRouter(<Manuscripts />);

    // Check for error message
    await waitFor(() => {
      expect(screen.getByText(/problem retrieving manuscripts/i)).toBeInTheDocument();
    });
  });

  test('sorts manuscripts correctly', async () => {
    renderWithRouter(<Manuscripts />);
    
    // Wait for manuscripts to load
    await waitFor(() => {
      expect(screen.getByText('Quantum Entanglement Explained')).toBeInTheDocument();
    });

    // Find and use the sort dropdown
    const sortSelect = screen.getByLabelText(/sort manuscripts/i);
    await act(async () => {
      await userEvent.selectOptions(sortSelect, 'title-desc');
    });
    
    // Check that sorting worked (titles in reverse alphabetical order)
    const titles = screen.getAllByRole('heading', { level: 2 });
    await waitFor(() => {
      expect(titles[0].textContent).toBe('Quantum Entanglement Explained');
      expect(titles[1].textContent).toBe('Black Holes and Hawking Radiation');
    });
  });
});