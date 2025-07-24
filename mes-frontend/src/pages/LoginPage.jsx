import React, { useState } from "react";
import { FiUser, FiLock, FiEye, FiEyeOff, FiLogIn } from "react-icons/fi";
import { loginUser } from "../services/api";
import { useUser } from "../contexts/UserContext";
import { useNavigate } from "react-router-dom";

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(false);
  const { login } = useUser();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await loginUser(username, password);
      // Store token and user info
      localStorage.setItem("mes_user_token", JSON.stringify(res.access_token));
      login(res.user); // set user in context
      setLoading(false);
      navigate("/dashboard");
    } catch (err) {
      setError("Invalid username or password");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800">
      <form
        className="bg-gray-800 rounded-2xl shadow-2xl p-8 w-full max-w-md space-y-6 animate-fade-in-up border border-gray-700"
        onSubmit={handleSubmit}
        aria-label="Login form"
      >
        <div className="flex flex-col items-center mb-2">
          <img src="/flowcon.png" alt="FlowCon Logo" className="w-16 h-16 mb-2 animate-bounce-slow" />
          <h2 className="text-2xl font-bold text-center tracking-tight text-white">Welcome to FlowCon</h2>
          <p className="text-gray-400 text-center text-sm mt-1">Sign in to your account</p>
        </div>
        <div className="flex flex-col gap-4">
          <label className="flex flex-col">
            <span className="mb-1 font-medium flex items-center gap-2 text-gray-200"><FiUser /> Username or Email</span>
            <input
              type="text"
              className="bg-gray-700 rounded p-2 focus:ring-2 focus:ring-blue-400 transition text-white placeholder-gray-400"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              autoFocus
              autoComplete="username"
              aria-label="Username or Email"
            />
          </label>
          <label className="flex flex-col relative">
            <span className="mb-1 font-medium flex items-center gap-2 text-gray-200"><FiLock /> Password</span>
            <input
              type={showPwd ? "text" : "password"}
              className="bg-gray-700 rounded p-2 pr-10 focus:ring-2 focus:ring-blue-400 transition text-white placeholder-gray-400"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoComplete="current-password"
              aria-label="Password"
            />
            <button
              type="button"
              className="absolute right-2 top-9 text-gray-400 hover:text-blue-400 transition"
              onClick={() => setShowPwd(v => !v)}
              tabIndex={-1}
              aria-label={showPwd ? "Hide password" : "Show password"}
            >
              {showPwd ? <FiEyeOff /> : <FiEye />}
            </button>
          </label>
        </div>
        <div className="flex items-center justify-between mt-2">
          <label className="flex items-center gap-2 text-sm text-gray-200">
            <input
              type="checkbox"
              checked={remember}
              onChange={e => setRemember(e.target.checked)}
              className="accent-blue-500"
            />
            Remember me
          </label>
          <a href="#" className="text-blue-400 hover:underline text-sm">Forgot password?</a>
        </div>
        {error && <div className="text-red-400 text-center animate-shake bg-red-900/30 rounded p-2 border border-red-700 mt-2">{error}</div>}
        <button
          type="submit"
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded text-white font-semibold transition active:scale-95 disabled:opacity-60 shadow-lg"
          disabled={loading}
          aria-label="Log in"
        >
          <FiLogIn /> {loading ? <span className="animate-pulse text-white">Logging in...</span> : <span className="text-white">Log In</span>}
        </button>
      </form>
    </div>
  );
} 