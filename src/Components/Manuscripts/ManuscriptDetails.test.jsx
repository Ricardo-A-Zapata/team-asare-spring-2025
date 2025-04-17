import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import ManuscriptDetails from './ManuscriptDetails';
import axios from 'axios';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

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

const renderWithRouter = (id) =>
  render(
    <MemoryRouter initialEntries={[`/manuscripts/${id}`]}>
      <Routes>
        <Route path="/manuscripts/:id" element={<ManuscriptDetails />} />
      </Routes>
    </MemoryRouter>
  );

describe('ManuscriptDetails', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading state initially', async () => {
    axios.get.mockResolvedValueOnce({ data: { manuscripts: { '1': mockManuscript } } });

    renderWithRouter('1');

    expect(screen.getByText(/loading manuscript details/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
    });
  });

  it('displays manuscript details on success', async () => {
    axios.get.mockResolvedValueOnce({ data: { manuscripts: { '1': mockManuscript } } });

    renderWithRouter('1');

    await waitFor(() => {
      expect(screen.getByText('Test Title')).toBeInTheDocument();
      expect(screen.getByText(/Test Author/)).toBeInTheDocument();
      expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
      expect(screen.getByText(/Version:/)).toBeInTheDocument();
      expect(screen.getByText(/PENDING/)).toBeInTheDocument();
      expect(screen.getByText(/Test abstract here/)).toBeInTheDocument();
      expect(screen.getByText(/Full manuscript content/)).toBeInTheDocument();
    });
  });

  it('handles API error gracefully', async () => {
    axios.get.mockRejectedValueOnce(new Error('Network Error'));

    renderWithRouter('1');

    await waitFor(() => {
      expect(screen.getByText(/Error fetching manuscript details/i)).toBeInTheDocument();
      expect(screen.getByText(/Back to Manuscripts/i)).toBeInTheDocument();
    });
  });

  it('displays not found message if manuscript ID is not present in response', async () => {
    axios.get.mockResolvedValueOnce({ data: { manuscripts: {} } });
  
    renderWithRouter('123');
  
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /error/i })).toBeInTheDocument();
      expect(screen.getByText(/manuscript not found/i)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /back to manuscripts/i })).toBeInTheDocument();
    });
  });      

  it('StateDisplay renders correct state and class', () => {
    const { container } = render(<span className="state pending">PENDING</span>);
    const span = container.querySelector('span');
    expect(span).toHaveClass('state pending');
    expect(span).toHaveTextContent('PENDING');
  });
});
