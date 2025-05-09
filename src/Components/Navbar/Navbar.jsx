import React from 'react';
import propTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { useAuth } from '../../AuthContext';

export const PAGES = [
  { label: 'Home', destination: '/' },
  { label: 'About', destination: '/about' },
  { label: 'Masthead', destination: '/masthead' },
  { label: 'View All Manuscripts', destination: '/manuscripts' },
];

export const PROTECTED_PAGES = [
  { label: 'View All Users', destination: '/users' },
];

function NavLink({ page }) {
  const { label, destination } = page;
  return (
    <li>
      <Link to={destination}>{label}</Link>
    </li>
  );
}
NavLink.propTypes = {
  page: propTypes.shape({
    label: propTypes.string.isRequired,
    destination: propTypes.string.isRequired,
  }).isRequired,
};

function Navbar() {
  const { isLoggedIn } = useAuth();
  
  return (
    <nav>
      <ul className="wrapper">
        {PAGES.map((page) => <NavLink key={page.destination} page={page} />)}
        {isLoggedIn ? (
          <>
            {PROTECTED_PAGES.map((page) => <NavLink key={page.destination} page={page} />)}
            <NavLink page={{ label: 'Account', destination: '/login' }} />
          </>
        ) : (
          <>
            <NavLink page={{ label: 'Login', destination: '/login' }} />
            <NavLink page={{ label: 'Sign up', destination: '/signup' }} />
          </>
        )}
      </ul>
    </nav>
  );
}

export default Navbar;
