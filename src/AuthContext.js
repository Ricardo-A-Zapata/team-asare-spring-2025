import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';
import { STORAGE_KEYS } from './constants';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === "true");
  const [userEmail, setUserEmail] = useState(localStorage.getItem(STORAGE_KEYS.EMAIL) || "");
  
  // Update context state when localStorage changes
  const login = (email) => {
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, "true");
    localStorage.setItem(STORAGE_KEYS.EMAIL, email);
    setIsLoggedIn(true);
    setUserEmail(email);
  };
  
  const logout = () => {
    localStorage.setItem(STORAGE_KEYS.LOGGED_IN, "false");
    localStorage.setItem(STORAGE_KEYS.EMAIL, "");
    setIsLoggedIn(false);
    setUserEmail("");
  };
  
  // Listen for localStorage changes in other tabs/windows
  // useEffect(() => {
  //   const handleStorageChange = () => {
  //     const loggedInStatus = localStorage.getItem(STORAGE_KEYS.LOGGED_IN) === "true";
  //     const storedEmail = localStorage.getItem(STORAGE_KEYS.EMAIL) || "";
  //     
  //     setIsLoggedIn(loggedInStatus);
  //     setUserEmail(storedEmail);
  //   };
  //   
  //   window.addEventListener('storage', handleStorageChange);
  //   return () => window.removeEventListener('storage', handleStorageChange);
  // }, []);
  
  const value = {
    isLoggedIn,
    userEmail,
    login,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
} 