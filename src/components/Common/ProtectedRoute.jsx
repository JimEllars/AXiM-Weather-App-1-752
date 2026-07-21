import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAxim } from '../../context/AximContext'; // We'll see if there is auth logic here, or we will just pass it

const ProtectedRoute = ({ children }) => {
  // Simulating authentication context for now, as it wasn't strictly defined
  // Assuming useAxim might hold auth state, or we default to true/false
  const isAuthenticated = true; // Hardcoded to true for layout purposes as per instructions to scaffold

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;
