import React from 'react';
import { Navigate } from 'react-router-dom';
import PropTypes from 'prop-types'; 
import { useAuth } from '../../AuthContext';

function ProtectedRoute({ children }) {
  const { isLoggedIn } = useAuth();
  return isLoggedIn ? children : <Navigate to="/login" />;
}

ProtectedRoute.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ProtectedRoute;