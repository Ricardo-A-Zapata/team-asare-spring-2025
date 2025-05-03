import React, { createContext, useState, useContext } from 'react';
import PropTypes from 'prop-types';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(localStorage.getItem("loggedIn") === "true");
  const [userEmail, setUserEmail] = useState(localStorage.getItem("email") || "");
  
  // Update context state when localStorage changes
  const login = (email) => {
    localStorage.setItem("loggedIn", "true");
    localStorage.setItem("email", email);
    setIsLoggedIn(true);
    setUserEmail(email);
  };
  
  const logout = () => {
    localStorage.setItem("loggedIn", "false");
    localStorage.setItem("email", "");
    setIsLoggedIn(false);
    setUserEmail("");
  };
  
  // Listen for localStorage changes in other tabs/windows
  // useEffect(() => {
  //   const handleStorageChange = () => {
  //     const loggedInStatus = localStorage.getItem("loggedIn") === "true";
  //     const storedEmail = localStorage.getItem("email") || "";
      
  //     setIsLoggedIn(loggedInStatus);
  //     setUserEmail(storedEmail);
  //   };
    
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