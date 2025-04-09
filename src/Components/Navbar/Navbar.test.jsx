import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Navbar from './Navbar';
import '@testing-library/jest-dom';
import { UNSAFE_logV6DeprecationWarnings } from 'react-router';
import { PAGES } from './Navbar';


UNSAFE_logV6DeprecationWarnings(false);


describe('Navbar Component', () => {
  test('renders without crashing', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
  });

  test('renders correct number of navigation links', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const links = screen.getAllByRole('link');
    expect(links.length).toBe(PAGES.length);
  });

  test('renders navigation links with correct text and href attributes', () => {
    render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );

    const homeLink = screen.getByRole('link', { name: 'Home' });
    const usersLink = screen.getByRole('link', { name: 'View All Users' });
    const submissionsLink = screen.getByRole('link', { name: 'View All Submissions' });
    const manuscriptsLink = screen.getByRole('link', { name: 'View All Manuscripts' });

    expect(homeLink).toHaveAttribute('href', '/');
    expect(usersLink).toHaveAttribute('href', '/users');
    expect(submissionsLink).toHaveAttribute('href', '/submissions');
    expect(manuscriptsLink).toHaveAttribute('href', '/manuscripts');
  });

  test('matches snapshot', () => {
    const { asFragment } = render(
      <BrowserRouter>
        <Navbar />
      </BrowserRouter>
    );
    expect(asFragment()).toMatchSnapshot();
  });
});
