import React, { useEffect, useState } from "react";
import { fetchMachines, updateMachine } from "../services/api";
import { FiRefreshCw } from "react-icons/fi";

export default function SimulateMachinesPage({ menuOpen, setMenuOpen, toggleMenu }) {
  const [machines, setMachines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState("");

  useEffect(() => {
    setLoading(true);
    fetchMachines()
      .then(setMachines)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleStatusChange = async (machine, newStatus) => {
    setLoading(true);
    setError(null);
    setSuccess("");
    try {
      await updateMachine(machine.id, { ...machine, status: newStatus });
      setMachines((ms) =>
        ms.map((m) => (m.id === machine.id ? { ...m, status: newStatus } : m))
      );
      setSuccess(`Status for '${machine.name}' updated to ${newStatus}`);
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* Header */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Simulate Machine Status</h1>
        </div>
        <div className="flex-1" />
      </header>
      {/* Main content */}
      <main className="flex-1 w-full max-w-5xl mx-auto">
        <div className="bg-surface rounded-xl shadow-lg p-6 border border-background">
          {loading && <div>Loading...</div>}
          {error && <div className="text-error mb-4">Error: {error}</div>}
          {success && <div className="mb-4 text-success">{success}</div>}
          <table className="min-w-full border border-surface rounded-xl overflow-hidden shadow-lg text-sm">
            <thead className="bg-background border-b border-surface">
              <tr>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">ID</th>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">Name</th>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">Status</th>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">OEE</th>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">Line ID</th>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">Type</th>
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">Simulate</th>
              </tr>
            </thead>
            <tbody>
              {machines.map((machine, idx) => (
                <tr key={machine.id} className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`} style={{ minHeight: 56 }}>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{machine.id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{machine.name}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${machine.status === "RUNNING" ? "bg-success/90 text-white" : "bg-error/90 text-white"}`} style={{ minWidth: 70, textAlign: 'center' }}>
                      {machine.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{machine.oee}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{machine.line_id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{machine.type || "-"}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <select
                      value={machine.status}
                      onChange={(e) => handleStatusChange(machine, e.target.value)}
                      className="bg-background text-primary px-2 py-1 rounded border border-surface focus:outline-none"
                    >
                      <option value="RUNNING">RUNNING</option>
                      <option value="STOPPED">STOPPED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
} 