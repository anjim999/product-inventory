// src/pages/LoginPage.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import api from "../api/axiosClient";

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth(); // ✅ use login from context

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
  e.preventDefault();
  setMessage("");
  setLoading(true);

  try {
    console.log("🔹 Submitting login with:", { email, password });

    const res = await api.post("/api/auth/login", { email, password });
    console.log("✅ Login response:", res);

    const { token, user, message: serverMessage } = res.data || {};

    if (!token || !user) {
      console.error("❌ Invalid login response shape:", res.data);
      setMessage("Login succeeded but server did not send token/user");
      return;
    }

    // Save in context + localStorage
    console.log("🔹 Calling login() with:", { token, user });
    login({ token, user });

    console.log("✅ Auth saved. User:", user);

    // Role-based redirect
    if (user.role === "admin") {
      console.log("➡️ Navigating to /admin");
      navigate("/admin");
    } else {
      console.log("➡️ Navigating to /products");
      navigate("/products");
    }
  } catch (err) {
    console.error("❌ Login error (catch):", err);

    const backendMsg = err?.response?.data?.message;
    setMessage(backendMsg || "Login failed. Please try again.");
  } finally {
    setLoading(false);
  }
};


  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Login</h1>

        {message && (
          <p className="text-sm text-center text-red-500">{message}</p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">Email</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2 text-sm"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Password</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2 text-sm"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="cursor-pointer w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>

        <p className="text-center text-sm">
          <Link to="/register" className="text-blue-600 hover:underline">
            Register
          </Link>{" "}
          ·{" "}
          <Link to="/forgot-password" className="text-blue-600 hover:underline">
            Forgot password?
          </Link>
        </p>
      </div>
    </div>
  );
}
