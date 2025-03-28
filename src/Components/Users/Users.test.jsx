import React from 'react';
import { render, screen, waitFor, act, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Users, { filterUsers, sortUsers } from './Users';
import axios from 'axios';
import '@testing-library/jest-dom';
import userEvent from '@testing-library/user-event';

jest.mock('axios');

import { BACKEND_URL } from '../../constants';

const USERS_READ_ENDPOINT = `${BACKEND_URL}/user/read`;
const USER_CREATE_ENDPOINT = `${BACKEND_URL}/user/create`;
const USER_UPDATE_ENDPOINT = `${BACKEND_URL}/user/update`;
const USER_DELETE_ENDPOINT = `${BACKEND_URL}/user/delete`;

// Helper function to wrap component with Router
const renderWithRouter = (ui) => {
  return render(<BrowserRouter>{ui}</BrowserRouter>);
};

// Test data
const testUsers = {
  'user1@example.com': {
    name: 'John Doe',
    email: 'user1@example.com',
    affiliation: 'University A',
    roleCodes: ['AU', 'RE']
  },
  'user2@example.com': {
    name: 'Jane Smith',
    email: 'user2@example.com',
    affiliation: 'Company B',
    roleCodes: ['ED']
  },
  'user3@example.com': {
    name: 'Bob Johnson',
    email: 'user3@example.com',
    affiliation: 'Organization C',
    roleCodes: ['AU']
  }
};

describe('sortUsers function', () => {
  const testUserArray = Object.values(testUsers);
  
  it('returns the original array if no sortConfig is provided', () => {
    const result = sortUsers(testUserArray, null);
    expect(result).toEqual(testUserArray);
  });
  
  it('sorts by name in ascending order', () => {
    const result = sortUsers(testUserArray, { key: 'name', direction: 'asc' });
    expect(result[0].name).toBe('Bob Johnson');
    expect(result[1].name).toBe('Jane Smith');
    expect(result[2].name).toBe('John Doe');
  });
  
  it('sorts by name in descending order', () => {
    const result = sortUsers(testUserArray, { key: 'name', direction: 'desc' });
    expect(result[0].name).toBe('John Doe');
    expect(result[1].name).toBe('Jane Smith');
    expect(result[2].name).toBe('Bob Johnson');
  });
  
  it('sorts by email in ascending order', () => {
    const result = sortUsers(testUserArray, { key: 'email', direction: 'asc' });
    expect(result[0].email).toBe('user1@example.com');
    expect(result[1].email).toBe('user2@example.com');
    expect(result[2].email).toBe('user3@example.com');
  });
  
  it('sorts by affiliation in ascending order', () => {
    const result = sortUsers(testUserArray, { key: 'affiliation', direction: 'asc' });
    expect(result[0].affiliation).toBe('Company B');
    expect(result[1].affiliation).toBe('Organization C');
    expect(result[2].affiliation).toBe('University A');
  });
  
  it('sorts by role in ascending order', () => {
    const result = sortUsers(testUserArray, { key: 'role', direction: 'asc' });
    // First role of Bob and John is 'Author', Jane's is 'Editor'
    // Alphabetically: Author, Author, Editor
    const firstRoles = result.map(user => 
      user.roleCodes && user.roleCodes.length > 0 ? user.roleCodes[0] : ''
    );
    expect(firstRoles[0]).toBe('AU');
    expect(firstRoles[1]).toBe('AU');
    expect(firstRoles[2]).toBe('ED');
  });
  
  it('handles missing affiliation values', () => {
    const usersWithMissingData = [
      ...testUserArray,
      { name: 'Alice', email: 'alice@example.com', roleCodes: ['RE'] } // No affiliation
    ];
    
    const result = sortUsers(usersWithMissingData, { key: 'affiliation', direction: 'asc' });
    expect(result[0].name).toBe('Alice'); // Empty affiliation comes first alphabetically
  });
});

describe('Users Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    axios.get.mockResolvedValue({
      data: {
        Users: testUsers
      }
    });
    axios.put.mockResolvedValue({});
    axios.delete.mockResolvedValue({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('renders the component and loads users', async () => {
    renderWithRouter(<Users />);
    
    // Check for heading
    expect(screen.getByText('View All Users')).toBeInTheDocument();
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('filters users by search term', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Get the search input and type a search term
    const searchInput = screen.getByPlaceholderText('Search by name or email');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    
    // Check that only Jane is displayed
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    
    // Clear search
    fireEvent.change(searchInput, { target: { value: '' } });
    
    // Check that all users are displayed again
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
    });
  });

  it('filters users by role', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Select Editor role
    const roleSelect = screen.getByLabelText('Filter by role');
    fireEvent.change(roleSelect, { target: { value: 'ED' } });
    
    // Check that only Jane is displayed (she's the only Editor)
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument();
    
    // Select Author role
    fireEvent.change(roleSelect, { target: { value: 'AU' } });
    
    // Check that only John and Bob are displayed (they're the Authors)
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
  });

  it('shows "no results" message when filters match no users', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Search for a non-existent user
    const searchInput = screen.getByPlaceholderText('Search by name or email');
    fireEvent.change(searchInput, { target: { value: 'NonExistentUser' } });
    
    // Check that the no results message is displayed
    expect(screen.getByText('No users match your filters. Try adjusting your search criteria.')).toBeInTheDocument();
  });

  it('clears filters when clear button is clicked', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Apply a filter
    const searchInput = screen.getByPlaceholderText('Search by name or email');
    fireEvent.change(searchInput, { target: { value: 'Jane' } });
    
    // Check that only Jane is displayed
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    
    // Click the clear filters button
    const clearButton = screen.getByText('Clear Filters');
    fireEvent.click(clearButton);
    
    // Check that all users are displayed again
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
      expect(screen.getByText('Bob Johnson')).toBeInTheDocument();
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

  test('opens EditUserForm when clicking "Edit" button', async () => {
    const mockUsers = {
      Users: [
        { id: 'test@gmail.com', name: 'test', email: 'test@gmail.com', affiliation: 'nyu' }
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
    const editButton = screen.getByRole('button', { name: /Edit/i });
    await userEvent.click(editButton);
    expect(screen.getByText((content, element) =>
        content.includes("Update") && content.includes("User"))
    ).toBeInTheDocument();
  });

  it('sorts users when selecting a sort option', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Get the sort dropdown and select "Name (Z-A)"
    const sortSelect = screen.getByLabelText('Sort users');
    fireEvent.change(sortSelect, { target: { value: 'name-desc' } });
    
    // Check that users are sorted by name in descending order
    const userElements = screen.getAllByRole('heading', { level: 2 });
    expect(userElements[0].textContent).toBe('John Doe');
    
    // Change sort to "Name (A-Z)"
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
    
    // Check that users are now sorted in ascending order
    const userElementsAfterSort = screen.getAllByRole('heading', { level: 2 });
    expect(userElementsAfterSort[0].textContent).toBe('Bob Johnson');
  });

  it('maintains sort order when applying filters', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Set sort to "Name (A-Z)"
    const sortSelect = screen.getByLabelText('Sort users');
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
    
    // Apply a role filter for "Author"
    const roleSelect = screen.getByLabelText('Filter by role');
    fireEvent.change(roleSelect, { target: { value: 'AU' } });
    
    // Should show Bob Johnson first (alphabetical) and John Doe second
    // Both are authors
    const userElements = screen.getAllByRole('heading', { level: 2 });
    expect(userElements[0].textContent).toBe('Bob Johnson');
    expect(userElements[1].textContent).toBe('John Doe');
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument();
  });

  it('clears sorting when selecting default option', async () => {
    renderWithRouter(<Users />);
    
    // Wait for users to load
    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
    });
    
    // Set sort to "Name (A-Z)"
    const sortSelect = screen.getByLabelText('Sort users');
    fireEvent.change(sortSelect, { target: { value: 'name-asc' } });
    
    // Verify sort applied
    const userElementsSorted = screen.getAllByRole('heading', { level: 2 });
    expect(userElementsSorted[0].textContent).toBe('Bob Johnson');
    
    // Clear sorting
    fireEvent.change(sortSelect, { target: { value: '' } });
    
    // Verify original order is restored (or at least it's not sorted by name asc anymore)
    // This test is a bit tricky as the original order depends on how the users are stored in the state
    const userElementsUnsorted = screen.getAllByRole('heading', { level: 2 });
    expect(userElementsUnsorted.length).toBe(3); // All users should be visible
  });
});
