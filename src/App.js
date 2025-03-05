import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
  Link,
} from 'react-router-dom';
import axios from 'axios';

import './App.css';

import Home from './Components/Home'
import Navbar from './Components/Navbar';
import Users from './Components/Users';
import Submissions from './Components/Submissions'; 
import { BACKEND_URL } from './constants';

const USER_READ_SINGLE_ENDPOINT = `${BACKEND_URL}/user/read_single`;

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
          {user.roles && user.roles.length > 0 ? (
            <ul className="roles-list">
              {user.roles.map((role, index) => (
                <li key={index}>{role}</li>
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

function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        {/* For a different home page, do:
        <Route index element={<Login />} /> */}
        {/* Index route for home */}
        <Route path="/" element={<Home />} />
        <Route path="users" element={<Users />} />
        <Route path="users/:email" element={<UserPage />} />
        <Route path="submissions" element={<Submissions />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
