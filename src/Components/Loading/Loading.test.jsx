import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import Loading from './Loading';

describe('Loading Component', () => {
  test('renders default loading message', () => {
    render(<Loading />);
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();
  });

  test('renders custom loading message', () => {
    render(<Loading message="Fetching data..." />);
    expect(screen.getByText(/Fetching data.../i)).toBeInTheDocument();
  });

  test('renders spinner element', () => {
    const { container } = render(<Loading />);
    expect(container.querySelector('.spinner')).toBeInTheDocument();
  });

  test('matches snapshot', () => {
    const { asFragment } = render(<Loading />);
    expect(asFragment()).toMatchSnapshot();
  });
});
