// src/Components/Manuscripts/AddManuscriptForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddManuscriptForm from './AddManuscriptForm';
import axios from 'axios';
import { MANUSCRIPT_STATES, USER_ROLES } from '../../constants';
import { AuthProvider } from '../../AuthContext';

jest.mock('axios');

// Mock window.alert
window.alert = jest.fn();

const defaultProps = {
  visible: true,
  cancel: jest.fn(),
  fetchManuscripts: jest.fn(),
  setError: jest.fn(),
  setIsOperationLoading: jest.fn()
};

// Mock authors data
const mockAuthors = [
  { name: 'Alice', email: 'alice@example.com', roleCodes: [USER_ROLES.AUTHOR] },
  { name: 'Bob', email: 'bob@example.com', roleCodes: [USER_ROLES.AUTHOR, USER_ROLES.REFEREE] }
];

// Helper function to render component with AuthProvider
const renderWithAuth = (component) => {
  return render(
    <AuthProvider>
      {component}
    </AuthProvider>
  );
};

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock the user data fetch
  axios.get.mockImplementation((url) => {
    if (url.includes('/user/read')) {
      return Promise.resolve({ 
        data: { 
          Users: {
            'alice@example.com': mockAuthors[0],
            'bob@example.com': mockAuthors[1]
          } 
        } 
      });
    }
    return Promise.resolve({ data: {} });
  });

  // Set up default PUT response
  axios.put.mockResolvedValue({ data: { success: true } });
});

describe('AddManuscriptForm', () => {
  it('shows guest submission form when not logged in', async () => {
    renderWithAuth(<AddManuscriptForm {...defaultProps} />);
    
    await waitFor(() => {
      // Check that we see the guest submission form
      expect(screen.getByText('Guest Submission')).toBeInTheDocument();
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
      expect(screen.getByLabelText('Email *')).toBeInTheDocument();
    });
  });

  it('shows error if required fields are empty on guest submission', async () => {
    renderWithAuth(<AddManuscriptForm {...defaultProps} />);
    
    // Fill in title, abstract and text but not guest author name/email
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Quantum Stuff' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Interesting abstract.' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'The full manuscript goes here.' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      // Check for the guest author validation error
      expect(screen.getByText('Author name and email are required for guest submissions')).toBeInTheDocument();
    });
  });

  it('submits correct guest data on success', async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    renderWithAuth(<AddManuscriptForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    });

    // Fill in form fields for guest
    const guestName = 'Guest Author';
    const guestEmail = 'guest@example.com';
    
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: guestName } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: guestEmail } });
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Quantum Stuff' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Interesting abstract.' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'The full manuscript goes here.' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/manuscript/create'), expect.objectContaining({
        title: 'Quantum Stuff',
        author: guestName,
        author_email: guestEmail,
        abstract: 'Interesting abstract.',
        text: 'The full manuscript goes here.',
        state: MANUSCRIPT_STATES.SUBMITTED
      }));
      expect(defaultProps.fetchManuscripts).toHaveBeenCalled();
      expect(defaultProps.cancel).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully', async () => {
    const errorResponse = { 
      message: 'Something went wrong',
      response: { data: { message: 'Server error' } }
    };
    
    // First mock call to get user info should work
    axios.get.mockImplementationOnce((url) => {
      if (url.includes('/user/read')) {
        return Promise.resolve({ 
          data: { 
            Users: {
              'alice@example.com': mockAuthors[0],
              'bob@example.com': mockAuthors[1]
            } 
          } 
        });
      }
      return Promise.resolve({ data: {} });
    });
    
    // But the PUT call should fail
    axios.put.mockRejectedValueOnce(errorResponse);

    renderWithAuth(<AddManuscriptForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    });

    // Fill in form fields for guest
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Guest Author' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'guest@example.com' } });
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'Test' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith('Error creating manuscript: Server error');
    });
  });
  
  it('allows setting guest affiliation', async () => {
    renderWithAuth(<AddManuscriptForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText('Name *')).toBeInTheDocument();
    });
    
    // Fill in guest author information including affiliation
    fireEvent.change(screen.getByLabelText('Name *'), { target: { value: 'Guest Author' } });
    fireEvent.change(screen.getByLabelText('Email *'), { target: { value: 'guest@example.com' } });
    fireEvent.change(screen.getByLabelText('Affiliation (Optional)'), { target: { value: 'University XYZ' } });
    
    // Verify the affiliation input value is set
    expect(screen.getByLabelText('Affiliation (Optional)')).toHaveValue('University XYZ');
  });
});
