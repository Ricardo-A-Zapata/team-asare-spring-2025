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

beforeEach(() => {
  jest.clearAllMocks();
});

describe('AddManuscriptForm', () => {
  it('shows error if any field is empty', async () => {
    render(<AddManuscriptForm {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith('All fields are required');
    });
  });

  it('submits correct data and resets form on success', async () => {
    axios.put.mockResolvedValueOnce({ data: { success: true } });

    render(<AddManuscriptForm {...defaultProps} />);

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Quantum Stuff' } });
    fireEvent.change(screen.getByLabelText(/author name/i), { target: { value: 'Alice' } });
    fireEvent.change(screen.getByLabelText(/author email/i), { target: { value: 'alice@example.com' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Interesting abstract.' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'The full manuscript goes here.' } });

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

    fireEvent.change(screen.getByLabelText(/title/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/author name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/author email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/abstract/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/manuscript text/i), { target: { value: 'Test' } });

    fireEvent.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(defaultProps.setError).toHaveBeenCalledWith('Error creating manuscript: Something went wrong');
    });
  });
});
