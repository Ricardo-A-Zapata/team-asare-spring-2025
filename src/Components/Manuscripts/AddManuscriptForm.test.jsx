// src/Components/Manuscripts/AddManuscriptForm.test.jsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import AddManuscriptForm from './AddManuscriptForm';
import axios from 'axios';

jest.mock('axios');

const defaultProps = {
  visible: true,
  cancel: jest.fn(),
  fetchManuscripts: jest.fn(),
  setError: jest.fn(),
  setIsOperationLoading: jest.fn()
};

// Mock authors data
const mockAuthors = [
  { name: 'Alice', email: 'alice@example.com', roleCodes: ['AU'] },
  { name: 'Bob', email: 'bob@example.com', roleCodes: ['AU', 'RE'] }
];

beforeEach(() => {
  jest.clearAllMocks();
  
  // Mock the user data fetch
  axios.get.mockImplementation((url) => {
    if (url.includes('/user/read')) {
      return Promise.resolve({ data: { Users: mockAuthors } });
    }
    return Promise.resolve({ data: {} });
  });
});

describe('AddManuscriptForm', () => {
  it('fetches authors on mount', async () => {
    render(<AddManuscriptForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/user/read'));
    });
  });

  it('shows error if required fields are empty', async () => {
    render(<AddManuscriptForm {...defaultProps} />);
    
    // Fill in title, abstract and text but not author (selected from dropdown)
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Quantum Stuff' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Interesting abstract.' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'The full manuscript goes here.' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith('All fields are required');
    });
  });

  it('submits correct data and resets form on success', async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AddManuscriptForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select author/i)).toBeInTheDocument();
    });

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Quantum Stuff' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Interesting abstract.' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'The full manuscript goes here.' } });
    
    // Select an author from dropdown
    fireEvent.change(screen.getByLabelText(/select author/i), { target: { value: 'alice@example.com' } });
    
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(axios.put).toHaveBeenCalledWith(expect.stringContaining('/manuscript/create'), expect.objectContaining({
        title: 'Quantum Stuff',
        author: 'Alice',
        author_email: 'alice@example.com',
        abstract: 'Interesting abstract.',
        text: 'The full manuscript goes here.',
        state: 'SUBMITTED'
      }));
      expect(defaultProps.fetchManuscripts).toHaveBeenCalled();
      expect(defaultProps.cancel).toHaveBeenCalled();
    });
  });

  it('handles API error gracefully', async () => {
    axios.put.mockRejectedValueOnce({ message: 'Something went wrong' });

    render(<AddManuscriptForm {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByLabelText(/select author/i)).toBeInTheDocument();
    });

    // Fill in form fields
    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'Test' } });
    
    // Select an author from dropdown
    fireEvent.change(screen.getByLabelText(/select author/i), { target: { value: 'alice@example.com' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith('Error creating manuscript: Something went wrong');
    });
  });
  
  it('displays author information when selected', async () => {
    render(<AddManuscriptForm {...defaultProps} />);
    
    await waitFor(() => {
      expect(screen.getByLabelText(/select author/i)).toBeInTheDocument();
    });
    
    // Select an author from dropdown
    fireEvent.change(screen.getByLabelText(/select author/i), { target: { value: 'alice@example.com' } });
    
    await waitFor(() => {
      expect(screen.getByText(/name:/i)).toBeInTheDocument();
      expect(screen.getByText(/email:/i)).toBeInTheDocument();
      expect(screen.getByText(/alice@example.com/i)).toBeInTheDocument();
    });
  });
});
