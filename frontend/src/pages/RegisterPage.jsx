import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../api/axiosClient";
import { useAuth } from "../context/AuthContext";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleRequestOtp = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      // Backend only needs email for OTP; name is used in verify step
      await api.post("/api/auth/register-request-otp", { email });
      setStep(2);
      setMessage("OTP sent to your email. Please check your inbox.");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message ||
          "Error sending OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);
    try {
      const res = await api.post("/api/auth/register-verify", {
        name,
        email,
        otp,
        password,
      });
      // res.data -> { message, token, user }
      login(res.data);
      navigate("/products");
    } catch (err) {
      console.error(err);
      setMessage(
        err.response?.data?.message ||
          "Error verifying OTP. Please check your OTP and try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-semibold text-center">Register</h1>

        {message && (
          <p className="text-sm text-center text-red-500">{message}</p>
        )}

        {step === 1 && (
          <form onSubmit={handleRequestOtp} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your full name"
              />
            </div>
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
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-60"
            >
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerify} className="space-y-4">
            <div>
              <label className="block text-sm mb-1">Name</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm bg-slate-100"
                value={name}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm mb-1">Email</label>
              <input
                type="email"
                className="w-full border rounded px-3 py-2 text-sm bg-slate-100"
                value={email}
                disabled
              />
            </div>
            <div>
              <label className="block text-sm mb-1">OTP</label>
              <input
                type="text"
                className="w-full border rounded px-3 py-2 text-sm"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
                placeholder="Enter OTP from email"
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
                placeholder="Create a password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Verifying..." : "Register"}
            </button>
            <button
              type="button"
              className="w-full mt-1 text-xs text-slate-600 underline"
              onClick={() => {
                setStep(1);
                setOtp("");
                setPassword("");
                setMessage("");
              }}
            >
              Change email / name
            </button>
          </form>
        )}

        <p className="text-center text-sm">
          Already have an account?{" "}
          <Link to="/login" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
}
