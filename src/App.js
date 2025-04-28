import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
} from 'react-router-dom';

import './App.css';

import Home from './Components/Home'
import Navbar from './Components/Navbar';
import Users from './Components/Users';
import Manuscripts from './Components/Manuscripts/Manuscripts';
import ManuscriptDetails from './Components/Manuscripts/ManuscriptDetails';
import About from './Components/About/About';
import UserPage from './Components/UserPage/UserPage';
import Login from './Components/Login/Login';
import Signup from './Components/Signup/Signup';

// Helper function to convert role codes to display names


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
        <Route path="manuscripts" element={<Manuscripts />} />
        <Route path="manuscripts/:id" element={<ManuscriptDetails />} />
        <Route path="about" element={<About />} />
        <Route path="login" element={<Login />} />
        <Route path="signup" element={<Signup />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
