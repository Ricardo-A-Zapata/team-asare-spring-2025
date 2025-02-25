import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  useParams,
} from 'react-router-dom';

import './App.css';

import Home from './Components/Home'
import Navbar from './Components/Navbar';
import Users from './Components/Users';
import Submissions from './Components/Submissions'; 

function UserPage() {
  const { email } = useParams();
  return <h1>{email}</h1>
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
