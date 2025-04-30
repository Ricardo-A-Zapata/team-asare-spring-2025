import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Manuscripts from './Manuscripts';
import axios from 'axios';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from '../../AuthContext';

jest.mock('axios');

const mockManuscripts = {
  manuscripts: {
    '1': {
      title: 'Quantum Entanglement Explained',
      author: 'Alice Q.',
      author_email: 'alice@example.com',
      state: 'Pending',
      abstract: 'An explanation of entanglement.',
      version: 1
    },
    '2': {
      title: 'Black Holes and Hawking Radiation',
      author: 'Bob H.',
      author_email: 'bob@example.com',
      state: 'Approved',
      abstract: 'Deep dive into black hole theory.',
      version: 2
    }
  }
};

describe('Manuscripts Component', () => {
  beforeEach(() => {
    axios.get.mockResolvedValue({ data: mockManuscripts });
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
    expect(screen.getByText(/loading manuscripts/i)).toBeInTheDocument();
    await screen.findByText(/Quantum Entanglement Explained/);
  });

  test('displays all manuscripts after fetch', async () => {
    renderWithRouter(<Manuscripts />);
    expect(await screen.findByText(/Quantum Entanglement Explained/)).toBeInTheDocument();
    expect(screen.getByText(/Black Holes and Hawking Radiation/)).toBeInTheDocument();
  });

  test('filters manuscripts when search term is applied', async () => {
    renderWithRouter(<Manuscripts />);
    await screen.findByText(/Quantum Entanglement Explained/);

    const searchInput = screen.getByLabelText(/search manuscripts/i);
    await userEvent.type(searchInput, 'Black Holes');

    expect(screen.getByText(/Black Holes and Hawking Radiation/)).toBeInTheDocument();
    expect(screen.queryByText(/Quantum Entanglement Explained/)).not.toBeInTheDocument();
  });

  test('shows no match message when filter returns no results', async () => {
    renderWithRouter(<Manuscripts />);
    await screen.findByText(/Quantum Entanglement Explained/);

    const searchInput = screen.getByLabelText(/search manuscripts/i);
    await userEvent.type(searchInput, 'Dark Energy');

    expect(screen.getByText(/no manuscripts match your search criteria/i)).toBeInTheDocument();
  });

  test('displays error message if API call fails', async () => {
    axios.get.mockRejectedValueOnce(new Error('API Error'));
    renderWithRouter(<Manuscripts />);

    expect(await screen.findByText(/problem retrieving manuscripts/i)).toBeInTheDocument();
  });

  test('sorts manuscripts correctly by version descending', async () => {
    renderWithRouter(<Manuscripts />);
    await screen.findByText(/Quantum Entanglement Explained/);

    const dropdown = screen.getByLabelText(/sort manuscripts/i);
    await userEvent.selectOptions(dropdown, 'version-desc');

    const allTitles = screen.getAllByRole('heading', { level: 2 });
    expect(allTitles[0]).toHaveTextContent('Black Holes and Hawking Radiation');
    expect(allTitles[1]).toHaveTextContent('Quantum Entanglement Explained');
  });
});