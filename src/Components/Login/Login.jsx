import { BACKEND_URL } from '../../constants';
import { useNavigate } from 'react-router-dom';
import './Login.css'
import axios from 'axios';

import React from 'react'

const Login = () => {
  const navigate = useNavigate();
  const isLoggedIn = localStorage.getItem("loggedIn") === "true";
  const userEmail = localStorage.getItem("email");

  const handleLogout = (e) => {
    e.preventDefault();
    localStorage.setItem("loggedIn", "false");
    localStorage.setItem("email", "");
    window.location.reload();
  }

  async function handleSubmit (e) {
    e.preventDefault();
    const email = e.target?.elements?.email?.value;
    const password = e.target?.elements?.password?.value;
    console.log(email, password);
    try {
      await axios.post(`${BACKEND_URL}login`, {email, password});
      localStorage.setItem("loggedIn", "true");
      localStorage.setItem("email", email);
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
          <h1>Welcome, {userEmail}</h1>
          <p>You are currently logged in</p>
          <button className="logout-button" onClick={handleLogout}>Logout</button>
        </div>
      ) : (
        <>
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
              <button type="submit">Submit</button>
            </form>
          </div>
        </>
      )}
    </div>
  )
}

export default Login