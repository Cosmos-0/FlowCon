// src/pages/SettingsPage.jsx
import React, { useState } from "react";
import { FiSettings, FiSave, FiX, FiEye, FiEyeOff, FiMenu } from "react-icons/fi";
import { useUser } from "../contexts/UserContext";
import { updateUser } from "../services/api";

export default function SettingsPage({ menuOpen, setMenuOpen, activeNav, setActiveNav, toggleMenu }) {
  const { user, setUser } = useUser();
  const [form, setForm] = useState({
    full_name: user?.full_name || "",
    username: user?.username || "",
    email: user?.email || "",
    password: "",
  });
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleChange = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const handleSave = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    if (!form.full_name || !form.username || !form.email) {
      setError("All fields except password are required.");
      return;
    }
    if (form.password && form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      const payload = { ...form };
      if (!payload.password) delete payload.password;
      const updated = await updateUser(user.id, payload);
      setUser({ ...user, ...payload, password: undefined });
      setSuccess("Profile updated!");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Settings</h1>
        </div>
        <div className="flex-1" />
      </header>
      <main className="flex-1 flex items-center justify-center p-4">
        <div className="bg-surface rounded-2xl shadow-2xl p-8 w-full max-w-lg border border-background transition-all duration-500 animate-fade-in">
          <h2 className="text-2xl font-bold mb-6 text-primary">Profile Settings</h2>
          <form className="space-y-6" onSubmit={handleSave}>
            <section className="bg-background/90 rounded-2xl p-6 mb-4 shadow-xl border border-surface transition-all duration-300 hover:shadow-2xl">
              <div className="flex flex-col gap-4">
                <label className="flex flex-col">
                  <span className="mb-1 font-medium text-secondary">Full Name</span>
                  <input
                    className="bg-background rounded px-3 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-accent transition text-primary"
                    value={form.full_name}
                    onChange={e => handleChange("full_name", e.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col">
                  <span className="mb-1 font-medium text-secondary">Username</span>
                  <input
                    className="bg-background rounded px-3 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-accent transition text-primary"
                    value={form.username}
                    onChange={e => handleChange("username", e.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col">
                  <span className="mb-1 font-medium text-secondary">Email</span>
                  <input
                    type="email"
                    className="bg-background rounded px-3 py-2 border border-surface focus:outline-none focus:ring-2 focus:ring-accent transition text-primary"
                    value={form.email}
                    onChange={e => handleChange("email", e.target.value)}
                    required
                  />
                </label>
                <label className="flex flex-col relative">
                  <span className="mb-1 font-medium text-secondary">Change Password</span>
                  <input
                    type={showPwd ? "text" : "password"}
                    className="bg-background rounded px-3 py-2 pr-10 border border-surface focus:outline-none focus:ring-2 focus:ring-accent transition text-primary"
                    value={form.password}
                    onChange={e => handleChange("password", e.target.value)}
                    placeholder="Leave blank to keep current password"
                  />
                  <button type="button" className="absolute right-2 top-7 text-secondary hover:text-accent transition" onClick={() => setShowPwd(v => !v)} aria-label={showPwd ? "Hide password" : "Show password"}>{showPwd ? <FiEyeOff /> : <FiEye />}</button>
                </label>
              </div>
            </section>
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 bg-background text-primary border border-surface rounded hover:bg-surface transition-colors duration-200" onClick={() => setForm({ full_name: user?.full_name || "", username: user?.username || "", email: user?.email || "", password: "" })}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-accent text-white rounded hover:bg-primary transition-colors duration-200 shadow-md font-semibold" disabled={loading}>{loading ? "Saving..." : "Save"}</button>
            </div>
            {error && <div className="text-error mt-2 animate-shake">{error}</div>}
            {success && <div className="text-success mt-2 animate-fade-in">{success}</div>}
          </form>
        </div>
      </main>
    </div>
  );
}
