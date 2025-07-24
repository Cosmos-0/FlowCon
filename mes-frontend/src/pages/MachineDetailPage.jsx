// src/pages/MachineDetailPage.jsx
import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { FiCpu } from "react-icons/fi";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import Layout from "../components/layout/Layout";

const SHIFTS = [
  { key: "morning", label: "Morning Shift", times: ["06:00","07:00","08:00","09:00","10:00","11:00","12:00","13:00","14:00"] },
  { key: "afternoon", label: "Afternoon Shift", times: ["14:00","15:00","16:00","17:00","18:00","19:00","20:00","21:00","22:00"] },
  { key: "night", label: "Night Shift", times: ["22:00","23:00","00:00","01:00","02:00","03:00","04:00","05:00","06:00"] },
];

function MachineDetailContent(props) {
  const { id } = useParams();
  const [machine, setMachine] = useState(null);
  const [selectedShift, setSelectedShift] = useState(SHIFTS[0].key);

  // Mock fetch of machine metadata
  useEffect(() => {
    setMachine({
      id,
      name: `Machine ${id}`,
      model: "EV-2000",
      location: "Line 1",
      installed: "2023-01-15",
      operator: "Alice Smith",
    });
  }, [id]);

  // Generate mock timeseries data for each shift
  const shiftObj = SHIFTS.find(s => s.key === selectedShift);
  const times = shiftObj.times;
  const trsData = times.map(t => ({ time: t, value: 0.7 + Math.random() * 0.2 }));
  const mtbfData = times.map(t => ({ time: t, value: 50 + Math.random() * 30 }));
  const cadenceData = times.map(t => ({ time: t, value: 100 + Math.random() * 20 }));

  return (
    <div className="flex flex-col bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={props.toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <FiCpu size={32} />
          </button>
          <div>
            <h1 className="text-3xl font-extrabold text-primary tracking-tight">{machine ? machine.name : "Loading..."}</h1>
            <div className="text-secondary text-sm">Details & Metrics</div>
          </div>
        </div>
        {/* Shift Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="shift-select" className="text-secondary text-sm font-medium">Shift:</label>
          <select
            id="shift-select"
            value={selectedShift}
            onChange={e => setSelectedShift(e.target.value)}
            className="bg-background text-primary p-2 rounded border border-surface transition-colors duration-200 focus:ring-2 focus:ring-accent min-w-[140px]"
          >
            {SHIFTS.map(shift => (
              <option key={shift.key} value={shift.key}>{shift.label}</option>
            ))}
          </select>
        </div>
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6 w-full max-w-7xl mx-auto">
        {machine && (
          <div className="bg-surface text-primary rounded-xl shadow-lg border border-background flex flex-col p-6 w-full">
            <span className="text-secondary text-sm">TRS (%)</span>
            <span className="text-2xl font-bold mt-1">
              {((trsData.reduce((sum, d) => sum + d.value, 0) / trsData.length) * 100).toFixed(1)}%
            </span>
          </div>
        )}
        {machine && (
          <div className="bg-surface text-primary rounded-xl shadow-lg border border-background flex flex-col p-6 w-full">
            <span className="text-secondary text-sm">MTBF (min)</span>
            <span className="text-2xl font-bold mt-1">
              {Math.round(mtbfData.reduce((sum, d) => sum + d.value, 0) / mtbfData.length)}
            </span>
          </div>
        )}
        {machine && (
          <div className="bg-surface text-primary rounded-xl shadow-lg border border-background flex flex-col p-6 w-full">
            <span className="text-secondary text-sm">Cadence (pcs/hr)</span>
            <span className="text-2xl font-bold mt-1">
              {Math.round(cadenceData.reduce((sum, d) => sum + d.value, 0) / cadenceData.length)}
            </span>
          </div>
        )}
      </div>

      {/* CONTENT */}
      <main className="w-full max-w-7xl mx-auto">
        {/* TRS Chart */}
        <div className="bg-surface rounded-xl shadow-lg border border-background p-6 mb-6 w-full">
          <h2 className="text-lg font-semibold mb-2">TRS Over Shift</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={trsData}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" domain={[0,1]} />
              <Tooltip contentStyle={{ backgroundColor: "#23232a", border: "none" }} />
              <Line type="monotone" dataKey="value" stroke="#10B981" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* MTBF Chart */}
        <div className="bg-surface rounded-xl shadow-lg border border-background p-6 mb-6 w-full">
          <h2 className="text-lg font-semibold mb-2">MTBF Over Shift</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={mtbfData}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: "#23232a", border: "none" }} />
              <Line type="monotone" dataKey="value" stroke="#F59E0B" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Cadence Chart */}
        <div className="bg-surface rounded-xl shadow-lg border border-background p-6 mb-6 w-full">
          <h2 className="text-lg font-semibold mb-2">Cadence Over Shift</h2>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={cadenceData}>
              <CartesianGrid stroke="#333" />
              <XAxis dataKey="time" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip contentStyle={{ backgroundColor: "#23232a", border: "none" }} />
              <Line type="monotone" dataKey="value" stroke="#3B82F6" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Machine Metadata */}
        {machine && (
          <div className="bg-surface rounded-xl shadow-lg border border-background p-6 grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4 w-full">
            {[
              "model",
              "location",
              "installed",
              "operator"
            ].map(key => (
              <div key={key}>
                <span className="text-secondary text-sm">
                  {key.charAt(0).toUpperCase() + key.slice(1)}
                </span>
                <div className="mt-1">{machine[key]}</div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default MachineDetailContent;
