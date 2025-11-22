// src/context/AuthContext.jsx
import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // auth = { token, user } or null
  const [auth, setAuth] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load auth from localStorage on first render
  useEffect(() => {
    const stored = localStorage.getItem("auth"); // 👈 KEEP KEY = "auth"
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        // basic sanity check
        if (parsed && parsed.token) {
          setAuth(parsed);
        } else {
          localStorage.removeItem("auth");
        }
      } catch (e) {
        console.error("Failed to parse auth from localStorage", e);
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  // data should be { message, token, user }
  const login = (data) => {
    const payload = {
      token: data.token,
      user: data.user
    };
    setAuth(payload);
    localStorage.setItem("auth", JSON.stringify(payload)); // 👈 same key used by axios
  };

  const logout = () => {
    setAuth(null);
    localStorage.removeItem("auth");
  };

  return (
    <AuthContext.Provider value={{ auth, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
