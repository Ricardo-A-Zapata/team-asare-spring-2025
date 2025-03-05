import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import Home from './Home';
import { BACKEND_URL } from '../../constants';
import axios from 'axios';
import '@testing-library/jest-dom';

jest.mock('axios');

describe('Home Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('fetches and displays the journal name', async () => {
    axios.get.mockResolvedValueOnce({ data: { "Journal Name": "Test Journal" } });

    render(<Home />);

    await waitFor(() => expect(screen.getByText(/Welcome to Test Journal/i)).toBeInTheDocument());
  });

  test('displays an error message if fetching fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('API failure'));

    render(<Home />);

    await waitFor(() => expect(screen.getByText(/There was a problem retrieving the journal name/i)).toBeInTheDocument());
  });
});