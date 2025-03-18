import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Users from './Users';
import axios from 'axios';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

jest.mock('axios');

import { BACKEND_URL } from '../../constants';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;
const USER_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;
const USER_UPDATE_ENDPOINT = `${BACKEND_URL}/user/update`;
const USER_DELETE_ENDPOINT = `${BACKEND_URL}/user/delete`;

describe('Users Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({ data: { Users: [] } });
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      expect(
        screen.getByText(/There was a problem retrieving the list of users/i)
      ).toBeInTheDocument();
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
      expect(userLink).toHaveAttribute('href', `/john@example.com`);
    });
  });

  test('matches snapshot', async () => {
    let asFragment;
    
    await act(async () => {
      const rendered = render(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );
      asFragment = rendered.asFragment;
    });

    expect(asFragment()).toMatchSnapshot();
  });

  test('opens AddUserForm when clicking "Add a User" button', async () => {
    axios.get.mockResolvedValueOnce({ data: { Users: [] } });
    
    await act(async () => {
      render(
        <BrowserRouter>
          <Users />
        </BrowserRouter>
      );
    });

    expect(screen.queryByText(/Add New User/i)).not.toBeInTheDocument();
    const addUserButton = screen.getByRole('button', { name: /Add a User/i });
    await userEvent.click(addUserButton);
    expect(screen.getByText(/Add New User/i)).toBeInTheDocument();
  });
});
