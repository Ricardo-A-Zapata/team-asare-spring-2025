import React, { useState, useEffect } from 'react';
import {
  useParams,
  Link,
} from 'react-router-dom';
import axios from 'axios';

import '../../App.css';

import { BACKEND_URL } from '../../constants';

const USER_READ_SINGLE_ENDPOINT = `${BACKEND_URL}/user/read`;

// Role constants
const AUTHOR_CODE = 'AU';
const EDITOR_CODE = 'ED';
const REFEREE_CODE = 'RE';

const ROLES = {
  [AUTHOR_CODE]: 'Author',
  [EDITOR_CODE]: 'Editor',
  [REFEREE_CODE]: 'Referee',
};

// Helper function to convert role codes to display names
const getRoleDisplayName = (roleCode) => ROLES[roleCode] || roleCode;

function UserPage() {
  const { email } = useParams();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`${USER_READ_SINGLE_ENDPOINT}/${email}`);
        if (response.data && response.data.Users) {
          setUser(response.data.Users);
        } else {
          setError('User not found');
        }
      } catch (err) {
        setError(`Error fetching user details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [email]);

  if (loading) {
    return <div className="loading">Loading user details...</div>;
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <Link to="/users">Back to Users</Link>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="not-found">
        <h2>User Not Found</h2>
        <p>The user with email {email} could not be found.</p>
        <Link to="/users">Back to Users</Link>
      </div>
    );
  }

  return (
    <div className="user-detail-container">
      <div className="user-detail-header">
        <h1>{user.name}</h1>
        <Link to="/users" className="back-button">Back to Users</Link>
      </div>
      
      <div className="user-detail-card">
        <div className="user-detail-section">
          <h2>Contact Information</h2>
          <p><strong>Email:</strong> {user.email}</p>
        </div>
        
        {user.affiliation && (
          <div className="user-detail-section">
            <h2>Affiliation</h2>
            <p>{user.affiliation}</p>
          </div>
        )}
        
        <div className="user-detail-section">
          <h2>Roles</h2>
          {user.roleCodes && user.roleCodes.length > 0 ? (
            <ul className="roles-list">
              {user.roleCodes.map((role, index) => (
                <li key={index}>{getRoleDisplayName(role)}</li>
              ))}
            </ul>
          ) : (
            <p>No roles assigned</p>
          )}
        </div>
        
        {user.createdAt && (
          <div className="user-detail-section">
            <h2>Account Information</h2>
            <p><strong>Member since:</strong> {new Date(user.createdAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default UserPage;