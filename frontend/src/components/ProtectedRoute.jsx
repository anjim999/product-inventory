// src/components/ProtectedRoute.jsx
import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function ProtectedRoute({ children }) {
  const { auth } = useAuth();

  console.log("ProtectedRoute auth:", auth);

  if (!auth?.token) {
    return <Navigate to="/login" replace />;
  }

  return children;
}
