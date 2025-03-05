import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Users from './Users';
import axios from 'axios';
import '@testing-library/jest-dom';

jest.mock('axios');

import { BACKEND_URL } from '../../constants';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;

describe('Users Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue(Promise.resolve({ data: { Users: [] } })); // Default empty response
  });

  test('fetches and displays a list of users', async () => {
    const mockUsers = {
      Users: [
        { id: 'john@example.com', name: 'John Doe', email: 'john@example.com' },
        { id: 'jane@example.com', name: 'Jane Smith', email: 'jane@example.com' }
      ]
    };

    axios.get.mockResolvedValueOnce({ data: mockUsers });

    await act(async () => {
      render(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/i)).toBeInTheDocument();
    });
  });

  test('displays an error message if fetching users fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('API failure'));

    await act(async () => {
      render(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      expect(screen.getByText(/There was a problem retrieving the list of users/i)).toBeInTheDocument();
    });
  });

  test('renders user links with correct href attributes', async () => {
    const mockUsers = {
      Users: [{ id: 'john@example.com', name: 'John Doe', email: 'john@example.com' }]
    };

    axios.get.mockResolvedValueOnce({ data: mockUsers });

    await act(async () => {
      render(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );
    });

    await waitFor(() => {
      const userLink = screen.getByRole('link', { name: /John Doe/i });
      expect(userLink).toHaveAttribute('href', `/john@example.com`); // Ensure correct route
    });
  });

  test('matches snapshot', async () => {
    await act(async () => {
      const { asFragment } = render(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );
      expect(asFragment()).toMatchSnapshot();
    });
  });
});
