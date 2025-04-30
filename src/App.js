import React from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate
} from 'react-router-dom';

import './App.css';
import { AuthProvider } from './AuthContext';

import Home from './Components/Home'
import Navbar from './Components/Navbar';
import Users from './Components/Users';
import Manuscripts from './Components/Manuscripts/Manuscripts';
import ManuscriptDetails from './Components/Manuscripts/ManuscriptDetails';
import AddManuscriptForm from './Components/Manuscripts/AddManuscriptForm';
import About from './Components/About/About';
import Login from './Components/Login/Login';
import Signup from './Components/Signup/Signup';
import ProtectedRoute from './Components/ProtectedRoute/ProtectRoute';
import Masthead from './Components/Masthead';
// Helper function to convert role codes to display names


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Navbar />
        <Routes>
          {/* For a different home page, do:
          <Route index element={<Login />} /> */}
          {/* Index route for home */}
          <Route path="/" element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="login" element={<Login />} />
          <Route path="signup" element={<Signup />} />
          <Route path="submit-manuscript" element={<AddManuscriptForm />} />
          <Route
            path="users"
            element={
              <ProtectedRoute>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="manuscripts"
            element={<Manuscripts />}
          />
          <Route
            path="manuscripts/:id"
            element={
              <ProtectedRoute>
                <ManuscriptDetails />
              </ProtectedRoute>
            }
          />
          <Route path="masthead" element={<Masthead />} />
          
          {/* Catch-all route for emails - redirect to users list */}
          <Route path="/:email" element={<Navigate to="/users" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
