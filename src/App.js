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

function UserPage() {
  const { name } = useParams();
  return <h1>{name}</h1>
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
        <Route path="users/:name" element={<UserPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
