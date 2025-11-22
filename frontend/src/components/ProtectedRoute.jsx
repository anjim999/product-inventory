// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { auth, loading } = useAuth();

  // Wait until we know if user is logged in or not
  if (loading) {
    return null; // or a spinner component
  }

  // Not logged in → send to login
  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  // Logged in → render protected page
  return children;
}
