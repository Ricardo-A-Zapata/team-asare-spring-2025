import { BACKEND_URL } from '../../constants';
import { useNavigate } from 'react-router-dom';
import './Login.css'
import axios from 'axios';
import React, { useState, useEffect } from 'react'
import { useAuth } from '../../AuthContext';

const Login = () => {
  const navigate = useNavigate();
  const { isLoggedIn, userEmail, login, logout } = useAuth();
  const [userInfo, setUserInfo] = useState(null);

  useEffect(() => {
    if (isLoggedIn) {
      fetchUserInfo();
    }
  }, [isLoggedIn]);

  const fetchUserInfo = async () => {
    try {
      const { data } = await axios.get(`${BACKEND_URL}/user/read`);
      const users = Object.values(data.Users);
      const currentUser = users.find(user => user.email === userEmail);
      if (currentUser) {
        setUserInfo(currentUser);
      }
    } catch (err) {
      console.error('Failed to fetch user info:', err);
    }
  };

  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    navigate('/');
  }

  async function handleSubmit (e) {
    e.preventDefault();
    const email = e.target?.elements?.email?.value;
    const password = e.target?.elements?.password?.value;
    try {
      await axios.post(`${BACKEND_URL}login`, {email, password});
      login(email);
      navigate('/');
    }
    catch (err) {
      alert('Login Failed\n' + err?.response?.data?.message );
    }
  } 

  return (
    <div className="login-container">
      {isLoggedIn ? (
        <div className="user-info">
          <h1>Welcome, {userInfo?.name || 'User'} ({userEmail})</h1>
          {userInfo && (
            <div className="user-details">
              <p><strong>Affiliation:</strong> {userInfo.affiliation || 'Not provided'}</p>
              <p><strong>Roles:</strong> {userInfo.roleCodes?.join(', ') || userInfo.roles?.join(', ') || 'Not provided'}</p>
            </div>
          )}
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <div className="login-form">
          <h1>Login</h1>
          <div className="modal">
            <form onSubmit={handleSubmit}>
              <div className='input'>
                <div className="email-input">
                  <label htmlFor="email">Email</label>
                  <input type="text" name="email" placeholder='example@email.com' />
                </div>
                <div className="password-input">
                  <label htmlFor="password">Password</label>
                  <input type="password" name="password" placeholder='Password123' />
                </div>
              </div>
              <button type="submit">Login</button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Login