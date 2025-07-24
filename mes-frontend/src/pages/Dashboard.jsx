// src/pages/DashboardPage.jsx
import React, { useState, useEffect } from "react";
import { FiHome, FiActivity, FiCheckCircle, FiUsers, FiClock, FiMenu, FiTrendingUp, FiRepeat, FiAlertTriangle } from "react-icons/fi";
import KpiCard from "../components/common/KpiCard";
import ChartCard from "../components/common/ChartCard";
import RecentEvents from "../components/Machines/RecentEvents";
import { fetchStops } from "../services/api";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip
} from "recharts";
import { fetchMachines, fetchWorkOrders, fetchShifts, fetchProductionLines, fetchEvents } from "../services/api";
import { useTimeline, calculateTRS, calculateMTBF } from "../contexts/TimelineContext";

const COLORS = ["#10B981", "#EAB308", "#F59E0B"];

// RecentStops component (inline for now)
function RecentStops({ stops, machines }) {
  // Map machine id to name for display
  const machineMap = {};
  machines.forEach(m => { machineMap[m.id] = m.name || m.id; });
  return (
    <div className="bg-gray-800 rounded-lg p-4 shadow-lg">
      <h3 className="text-lg font-bold mb-4">Recent Stops</h3>
      {stops.length === 0 ? (
        <div className="text-gray-400">No recent stops.</div>
      ) : (
        <ul className="divide-y divide-gray-700">
          {stops.slice(0, 8).map((stop, idx) => {
            const start = stop.start_time ? new Date(stop.start_time) : null;
            const end = stop.end_time ? new Date(stop.end_time) : null;
            const duration = start && end ? Math.round((end - start) / 1000) : null;
            return (
              <li key={stop.id || idx} className="py-2 flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-green-400">{machineMap[stop.machine_id] || stop.machine_id}</span>
                  <span className="text-xs text-gray-400">{start ? start.toLocaleString() : "-"} - {end ? end.toLocaleString() : "Ongoing"}</span>
                  {duration !== null && <span className="text-xs text-yellow-400">{duration}s</span>}
                </div>
                <div className="text-sm text-gray-300">{stop.reason || "No reason specified"}</div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function DashboardPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState("7d");
  const [machines, setMachines] = useState([]);
  const [workOrders, setWorkOrders] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [lines, setLines] = useState([]);
  const [events, setEvents] = useState([]);
  const [stops, setStops] = useState([]);

  useEffect(() => {
    setLoading(true);
    setError(null);
    Promise.all([
      fetchMachines(),
      fetchWorkOrders(),
      fetchShifts(),
      fetchProductionLines(),
      fetchStops()
    ])
      .then(([machines, workOrders, shifts, lines, stops]) => {
        setMachines(machines);
        setWorkOrders(workOrders);
        setShifts(shifts);
        setLines(lines);
        setStops(stops || []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [dateRange]);

  const { timeline } = useTimeline();
  // Calculate MTBF and TRS for all machines for today
  const today = new Date();
  const windowStart = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0).getTime();
  const windowEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999).getTime();
  let mtbf = '-';
  let trs = '-';
  if (machines.length && timeline) {
    const mtbfVals = machines.map(m => calculateMTBF(timeline[m.id], windowStart, windowEnd)).filter(Boolean);
    const trsVals = machines.map(m => calculateTRS(timeline[m.id], windowStart, windowEnd)).filter(Boolean);
    mtbf = mtbfVals.length ? (mtbfVals.reduce((a, b) => a + b, 0) / mtbfVals.length / 60).toFixed(1) : '-'; // in minutes
    trs = trsVals.length ? (trsVals.reduce((a, b) => a + b, 0) / trsVals.length).toFixed(1) : '-'; // in %
  }

  // KPIs from backend data
  const oeeToday = machines.length ? (machines.reduce((a, b) => a + (Number(b.oee) || 0), 0) / machines.length).toFixed(1) : 0;
  const oeeValues = machines.map(m => Number(m.oee) || 0);
  const maxOee = oeeValues.length ? Math.max(...oeeValues).toFixed(1) : "-";
  const minOee = oeeValues.length ? Math.min(...oeeValues).toFixed(1) : "-";
  const runningMachines = machines.filter(m => m.status === "RUNNING").length;
  const activeOrders = workOrders.filter(w => w.status && w.status.toLowerCase().includes("active")).length;
  // Current shift: find shift where now is between start and end
  const now = new Date();
  let currentShift = "-";
  for (const shift of shifts) {
    if (shift.start_time && shift.end_time) {
      const today = now.toISOString().split("T")[0];
      const start = new Date(`${today}T${shift.start_time}`);
      const end = new Date(`${today}T${shift.end_time}`);
      if (now >= start && now <= end) {
        currentShift = shift.name;
        break;
      }
    }
  }

  // Calculate average downtime per machine for today (in minutes)
  let avgDowntime = '-';
  if (machines.length && stops.length) {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 23, 59, 59, 999);
    // Filter stops for today
    const todayStops = stops.filter(s => {
      const start = new Date(s.start_time);
      return start >= startOfDay && start <= endOfDay;
    });
    // Group by machine
    const downtimeByMachine = {};
    todayStops.forEach(s => {
      const start = new Date(s.start_time);
      const end = s.end_time ? new Date(s.end_time) : new Date();
      const duration = (end - start) / 1000 / 60; // minutes
      if (!downtimeByMachine[s.machine_id]) downtimeByMachine[s.machine_id] = 0;
      downtimeByMachine[s.machine_id] += duration > 0 ? duration : 0;
    });
    const downtimeVals = Object.values(downtimeByMachine);
    avgDowntime = downtimeVals.length ? (downtimeVals.reduce((a, b) => a + b, 0) / downtimeVals.length).toFixed(1) : '-';
  }

  const kpis = [
    { label: "OEE Today", value: oeeToday, unit: "%", icon: <FiActivity />, color: "text-green-400" },
    { label: "MTBF", value: mtbf, unit: "min", icon: <FiRepeat />, color: "text-yellow-400" },
    { label: "TRS", value: trs, unit: "%", icon: <FiTrendingUp />, color: "text-blue-400" },
    { label: "Avg Downtime", value: avgDowntime, unit: "min", icon: <FiAlertTriangle />, color: "text-red-400" },
    { label: "Max OEE", value: maxOee, unit: "%", icon: <FiActivity />, color: "text-blue-400" },
    { label: "Min OEE", value: minOee, unit: "%", icon: <FiActivity />, color: "text-red-400" },
    { label: "Machines Running", value: runningMachines + " / " + machines.length, icon: <FiCheckCircle />, color: "text-blue-400" },
    { label: "Active Orders", value: activeOrders, icon: <FiUsers />, color: "text-yellow-400" },
  ];

  // OEE Donut Chart (Quality, Performance, Availability) - use machine averages from backend
  const donutData = [
    { name: "Quality", value: machines.length ? (machines.reduce((a, b) => a + (Number(b.quality) || 0), 0) / machines.length) : 0 },
    { name: "Performance", value: machines.length ? (machines.reduce((a, b) => a + (Number(b.performance) || 0), 0) / machines.length) : 0 },
    { name: "Availability", value: machines.length ? (machines.reduce((a, b) => a + (Number(b.availability) || 0), 0) / machines.length) : 0 },
  ];

  // Availability Bar Chart (last 7/30 days) - fallback to random if not available
  const availabilityData = Array.from({ length: dateRange === "7d" ? 7 : 30 }, (_, i) => ({
    day: i + 1,
    value: machines.length ? (machines.reduce((a, b) => a + (Number(b.availability) || 0), 0) / machines.length) : 0
  }));

  // Downtime by group - fallback to stops if available
  // For demo, fallback to empty or random
  const downtimeData = [];

  // Recent events - use events if available, else fallback
  const recentEvents = events && events.length > 0 ? events.map(e => ({
    title: e.title || e.event_type || e.type || "Event",
    time: e.created_at ? new Date(e.created_at).toLocaleString() : "",
    description: e.description || e.message || ""
  })) : [];

  // Date range options
  const dateOptions = [
    { value: "7d", label: "Last 7 days" },
    { value: "30d", label: "Last 30 days" },
  ];

  if (!machines.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Dashboard</h1>
        </div>
        <div className="flex-1" />
      </header>

      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} className="bg-surface text-primary rounded-xl shadow-lg border border-background transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl" />
        ))}
      </div>

      {/* CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {/* Date Range Picker */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-2 mb-6">
          <label htmlFor="date-range" className="text-secondary text-sm font-medium">Date Range:</label>
          <select
            id="date-range"
            className="bg-background text-primary p-2 rounded border border-surface transition-colors duration-200 focus:ring-2 focus:ring-accent min-w-[140px]"
            value={dateRange}
            onChange={e => setDateRange(e.target.value)}
            aria-label="Select date range"
          >
            {dateOptions.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        </div>

        {error && (
          <div className="bg-error text-white p-4 rounded mb-4">{error}</div>
        )}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 animate-pulse">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-surface p-4 rounded h-64" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* OEE Donut Chart */}
            <ChartCard title="OEE" subtitle={dateRange === "7d" ? "Last 7 days" : "Last 30 days"} className="bg-surface text-primary border border-background rounded-xl shadow-lg" >
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    dataKey="value"
                    innerRadius="60%"
                    outerRadius="80%"
                    startAngle={90}
                    endAngle={-270}
                  >
                    {donutData.map((entry, idx) => (
                      <Cell key={idx} fill={COLORS[idx]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={value => `${value.toFixed(2)}%`}
                    contentStyle={{ backgroundColor: "#23232a", border: "none" }}
                  />
                </PieChart>
              </ResponsiveContainer>
              {/* Legend below the chart */}
              <div className="flex justify-center gap-6 mt-4">
                {donutData.map((entry, idx) => (
                  <div key={entry.name} className="flex items-center gap-2">
                    <span className="inline-block w-4 h-4 rounded-full" style={{ backgroundColor: COLORS[idx] }}></span>
                    <span className="text-sm text-secondary">{entry.name}</span>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Stops per Hour Bar Chart */}
            <ChartCard title="Stops per Hour" subtitle="Today" className="bg-surface text-primary border border-background rounded-xl shadow-lg" >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={(() => {
                  // Prepare stops per hour data for today
                  const today = new Date();
                  const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 0, 0, 0);
                  const stopsPerHour = Array.from({ length: 24 }, (_, h) => ({ hour: `${h}:00`, count: 0 }));
                  stops.forEach(s => {
                    const start = new Date(s.start_time);
                    if (start >= startOfDay && start.getDate() === today.getDate()) {
                      stopsPerHour[start.getHours()].count++;
                    }
                  });
                  return stopsPerHour;
                })()}>
                  <CartesianGrid stroke="#333" vertical={false} />
                  <XAxis dataKey="hour" stroke="#888" />
                  <YAxis stroke="#888" allowDecimals={false} />
                  <Tooltip contentStyle={{ backgroundColor: "#23232a", border: "none" }} />
                  <Bar dataKey="count" fill="#F59E0B" />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Recent Stops List */}
            <div className="bg-surface text-primary border border-background rounded-xl shadow-lg">
              <RecentStops stops={stops} machines={machines} />
            </div>

            {/* Sixth slot left blank to preserve grid */}
            <div className="bg-surface p-4 rounded-xl opacity-0" />
          </div>
        )}
      </main>
    </div>
  );
}
