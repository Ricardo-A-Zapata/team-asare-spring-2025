import { BACKEND_URL } from '../../constants';
import { useNavigate } from 'react-router-dom';
import './Login.css'
import axios from 'axios';

import React from 'react'

const Login = () => {
  const navigate = useNavigate();
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
    </div>
  )
}

export default Login