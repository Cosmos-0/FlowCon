// src/pages/StopsPage.jsx
import React, { useState, useEffect } from "react";
import { FiPlay, FiEdit, FiTrash2, FiPlus, FiAlertTriangle, FiBarChart2, FiClock, FiList, FiLink } from "react-icons/fi";
import KpiCard from "../components/common/KpiCard";
import { fetchStops, createStop, updateStop, deleteStop, fetchMachines } from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function StopsPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { user: currentUser } = useUser();
  // State for stops
  const [stops, setStops] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [machines, setMachines] = useState([]);
  const [formData, setFormData] = useState({ id: '', machine_id: '', reason: '', start_time: '', end_time: '' });
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [reasonFilter, setReasonFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [alarmStop, setAlarmStop] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [resolveModalOpen, setResolveModalOpen] = useState(false);
  const [resolveStop, setResolveStop] = useState(null);
  const [resolveReason, setResolveReason] = useState("");

  const COMMON_STOP_REASONS = [
    'Maintenance',
    'Breakdown',
    'Power Failure',
    'Material Shortage',
    'Operator Break',
    'Quality Issue',
    'Setup/Changeover',
  ];

  // KPI calculations
  const totalStops = stops.length;
  const totalOccurrences = stops.reduce((a, b) => a + b.count, 0);
  const mostFrequent = stops.reduce((max, s) => (s.count > (max?.count ?? -1) ? s : max), null);
  const longestDuration = stops.reduce((max, s) => {
    // Convert duration to minutes for comparison
    const toMin = (d) => {
      if (!d || typeof d !== 'string') return 0;
      const [h, m] = d.split("h").map(x => x.trim());
      return parseInt(h) * 60 + parseInt(m.replace("m", ""));
    };
    return (!max || toMin(s.duration) > toMin(max.duration)) ? s : max;
  }, null);
  const kpis = [
    { label: "Total Stops", value: totalStops, icon: <FiBarChart2 />, color: "text-blue-400" },
    mostFrequent ? { label: "Most Frequent", value: mostFrequent.reason, icon: <FiList />, color: "text-green-400" } : null,
    longestDuration ? { label: "Longest Duration", value: longestDuration.duration, icon: <FiClock />, color: "text-yellow-400" } : null,
    { label: "Total Occurrences", value: totalOccurrences, icon: <FiPlay />, color: "text-red-400" },
  ].filter(Boolean);

  // Sorting
  const sorted = [...stops].sort((a, b) => {
    if (sortKey === "count") {
      return sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    }
    return sortDir === "asc"
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  // Filtering
  const filtered = sorted.filter(s =>
    (reasonFilter ? s.reason === reasonFilter : true)
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Bulk actions
  const handleSelect = (id) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((sid) => sid !== id) : [...sel, id]
    );
  };
  const handleSelectAll = () => {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map((s) => s.id));
  };
  const handleBulkDelete = () => {
    if (window.confirm("Delete selected stops?")) {
      setStops((ss) => ss.filter((s) => !selected.includes(s.id)));
      setSelected([]);
    }
  };
  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };
  const handleViewAlarms = (stop) => {
    setAlarmStop(stop);
    setAlarmModalOpen(true);
  };
  const handleViewLine = (stop) => {
    alert(`View affected line: ${stop.affectedLine}`);
  };
  // Alarm logic: unresolved or recurring (count > 3)
  function getStopAlarms(stop) {
    let alarms = [];
    if (stop.status !== "Resolved") alarms.push("Unresolved stop");
    if (stop.count > 3) alarms.push("Recurring stop");
    return alarms;
  }

  // Handle add/edit form open
  const openForm = (index = null) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to perform this action.");
      return;
    }
    setEditIndex(index);
    if (index !== null) {
      setFormData(stops[index]);
    } else {
      setFormData({ id: '', machine_id: '', reason: '', start_time: '', end_time: '' });
    }
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to perform this action.");
      return;
    }
    e.preventDefault();
    setLoading(true);
    try {
      if (editIndex !== null) {
        const id = stops[editIndex].id;
        await updateStop(id, formData);
        setStops(stops => stops.map((stop, i) => i === editIndex ? { ...formData, id } : stop));
      } else {
        const res = await createStop(formData);
        setStops(stops => [...stops, { ...formData, id: res.id }]);
      }
      setShowForm(false);
      setEditIndex(null);
      setFormData({ id: '', machine_id: '', reason: '', start_time: '', end_time: '' });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (index) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to perform this action.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this stop?')) {
      setLoading(true);
      try {
        const id = stops[index].id;
        await deleteStop(id);
        setStops(stops => stops.filter((_, i) => i !== index));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  const openResolveModal = (stop) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to perform this action.");
      return;
    }
    setResolveStop(stop);
    setResolveReason("");
    setResolveModalOpen(true);
  };

  const handleResolveSubmit = async (e) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to perform this action.");
      return;
    }
    e.preventDefault();
    if (!resolveReason) return;
    setLoading(true);
    try {
      await updateStop(resolveStop.id, {
        ...resolveStop,
        reason: resolveReason,
        end_time: new Date().toISOString(),
        resolved: true
      });
      setStops(stops => stops.map(s =>
        s.id === resolveStop.id
          ? { ...s, reason: resolveReason, end_time: new Date().toISOString(), resolved: true }
          : s
      ));
      setResolveModalOpen(false);
      setResolveStop(null);
      setResolveReason("");
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchStops()
      .then(setStops)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    fetchMachines()
      .then(setMachines)
      .catch(() => {});
  }, []);

  if (!stops.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* Header */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Stops</h1>
        </div>
        {currentUser?.role === "Admin" && (
          <button
            className="flex items-center gap-2 bg-accent text-white hover:bg-primary px-4 py-2 rounded transition-colors duration-200 font-semibold shadow-md"
            onClick={() => openForm()}
          >
            <FiPlus className="mr-1" /> Add Stop
          </button>
        )}
      </header>
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8 animate-fade-in">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} className="bg-surface text-primary rounded-xl shadow-lg border border-background transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl" />
        ))}
      </div>
      {/* Main content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-primary">All Stops</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <label htmlFor="type-filter" className="text-secondary text-sm font-medium">Type:</label>
          <select
            id="type-filter"
            className="bg-surface text-primary rounded px-2 py-2 border border-background transition-all duration-200 focus:ring-2 focus:ring-accent min-w-[140px]"
            value={reasonFilter}
            onChange={e => setReasonFilter(e.target.value)}
            aria-label="Filter by reason"
          >
            <option value="">All Reasons</option>
            {[...new Set(stops.map(s => s.reason))].map(r => (
              <option key={r} value={r}>{r}</option>
            ))}
          </select>
        </div>
        {selected.length > 0 && (
          <div className="bg-surface px-4 py-2 flex items-center gap-2 mb-2 rounded shadow border border-background transition-all duration-200 animate-fade-in">
            <span>{selected.length} selected</span>
            {currentUser?.role === "Admin" && (
              <button onClick={handleBulkDelete} className="bg-error px-2 py-1 rounded text-white transition-colors duration-200">Delete</button>
            )}
          </div>
        )}
        <div className="overflow-x-auto rounded-xl shadow-lg bg-surface border border-surface transition-all duration-300 animate-fade-in">
          <table className="min-w-full text-sm border border-surface rounded-xl overflow-hidden">
            <thead className="bg-background border-b border-surface">
              <tr className="text-left text-secondary align-middle">
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={handleSelectAll}
                    aria-label="Select all stops"
                  />
                </th>
                {[
                  { key: "id", label: "Stop ID" },
                  { key: "machine", label: "Machine" },
                  { key: "reason", label: "Reason" },
                  { key: "start_time", label: "Start Time" },
                  { key: "end_time", label: "End Time" },
                  { key: "actions", label: "Actions" },
                ].map((h) => (
                  <th
                    key={h.key}
                    className="px-6 py-4 font-bold text-secondary border-b border-surface text-left cursor-pointer select-none whitespace-nowrap"
                    onClick={() => h.key !== "actions" && handleSort(h.key)}
                    aria-label={h.label}
                    style={{ minWidth: 80 }}
                  >
                    {h.label}
                    {sortKey === h.key && (sortDir === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paginated.map((stop, idx) => (
                <tr
                  key={stop.id}
                  className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                  style={{ minHeight: 56 }}
                >
                  <td className="px-6 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.includes(stop.id)}
                      onChange={() => handleSelect(stop.id)}
                      aria-label={`Select stop ${stop.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{stop.id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{machines.find(m => m.id === stop.machine_id)?.name || stop.machine_id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{stop.reason}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{stop.start_time}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{stop.end_time}</td>
                  <td className="px-6 py-4 flex gap-2 align-middle whitespace-nowrap">
                    <button className="text-accent hover:underline transition-colors duration-200" onClick={() => handleViewAlarms(stop)} title="View alarms" aria-label="View alarms">
                      <FiAlertTriangle />
                    </button>
                    <button className="text-accent hover:underline transition-colors duration-200" onClick={() => handleViewLine(stop)} title="View line" aria-label="View line">
                      <FiLink />
                    </button>
                    {currentUser?.role === "Admin" && (
                      <>
                        <button className="text-warning transition-colors duration-200" onClick={() => openForm(idx)} title="Edit" aria-label="Edit stop">
                          <FiEdit />
                        </button>
                        <button className="text-error transition-colors duration-200" onClick={() => handleDelete(idx)} title="Delete" aria-label="Delete stop">
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                    {stop.end_time === null && (
                      currentUser?.role === "Admin" && (
                        <button className="text-green-400" onClick={() => openResolveModal(stop)} title="Resolve" aria-label="Resolve stop">
                          Resolve
                        </button>
                      )
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* Pagination */}
        <div className="flex justify-end mt-4 gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1 rounded bg-background text-primary disabled:opacity-50 transition-colors duration-200"
            aria-label="Previous page"
          >
            Prev
          </button>
          <span className="px-2">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1 rounded bg-background text-primary disabled:opacity-50 transition-colors duration-200"
            aria-label="Next page"
          >
            Next
          </button>
        </div>
        {/* Alarm Modal */}
        {alarmModalOpen && alarmStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
                onClick={() => setAlarmModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Alarms for {alarmStop.reason}</h2>
              <ul className="space-y-2">
                {getStopAlarms(alarmStop).length > 0 ? (
                  getStopAlarms(alarmStop).map((a, i) => (
                    <li key={i} className="text-red-400 flex items-center gap-2">
                      <FiAlertTriangle /> {a}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No active alarms</li>
                )}
              </ul>
            </div>
          </div>
        )}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
              className="bg-surface p-6 rounded shadow-lg flex flex-col gap-4 min-w-[300px] transition-all duration-300 animate-fade-in"
              onSubmit={handleFormSubmit}
            >
              <h3 className="text-lg font-bold mb-2">{editIndex !== null ? 'Edit' : 'Add'} Stop</h3>
              <div className="flex flex-col md:flex-row gap-4">
                {editIndex !== null && (
                  <div className="flex flex-col">
                    <label className="text-gray-300 mb-1">Stop ID</label>
                    <input
                      className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                      placeholder="Stop ID"
                      value={formData.id}
                      onChange={e => setFormData(f => ({ ...f, id: e.target.value }))}
                      required
                      disabled
                    />
                  </div>
                )}
                <div className="flex flex-col">
                  <label className="text-gray-300 mb-1">Machine</label>
                  <select
                    className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                    value={formData.machine_id}
                    onChange={e => setFormData(f => ({ ...f, machine_id: e.target.value }))}
                    required
                  >
                    <option value="">Select Machine</option>
                    {machines.map(m => (
                      <option key={m.id} value={m.id}>{m.name || m.id}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-300 mb-1">Reason</label>
                  <select
                    className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                    value={formData.reason}
                    onChange={e => setFormData(f => ({ ...f, reason: e.target.value }))}
                    required
                  >
                    <option value="">Select Reason</option>
                    {COMMON_STOP_REASONS.map(r => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-300 mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                    value={formData.start_time}
                    onChange={e => setFormData(f => ({ ...f, start_time: e.target.value }))}
                    required
                  />
                </div>
                <div className="flex flex-col">
                  <label className="text-gray-300 mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                    value={formData.end_time}
                    onChange={e => setFormData(f => ({ ...f, end_time: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-success px-4 py-2 rounded text-white transition-colors duration-200">Save</button>
                <button type="button" className="bg-gray-600 px-4 py-2 rounded text-white transition-colors duration-200" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        {resolveModalOpen && resolveStop && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <form onSubmit={handleResolveSubmit} className="bg-gray-800 p-6 rounded-lg shadow-lg max-w-md w-full relative">
              <button
                type="button"
                onClick={() => { setResolveModalOpen(false); setResolveStop(null); setResolveReason(""); }}
                className="absolute top-4 right-4 text-gray-400 hover:text-red-400 text-2xl font-bold"
                aria-label="Close resolve modal"
              >
                ×
              </button>
              <h3 className="text-xl font-bold mb-4 text-white">Resolve Stop</h3>
              <div className="mb-2 text-gray-300"><b>ID:</b> {resolveStop.id}</div>
              <div className="mb-2 text-gray-300"><b>Machine:</b> {machines.find(m => m.id === resolveStop.machine_id)?.name || resolveStop.machine_id}</div>
              <div className="mb-2 text-gray-300"><b>Start Time:</b> {resolveStop.start_time}</div>
              <div className="mb-2 text-gray-300"><b>End Time:</b> {resolveStop.end_time || <span className="text-yellow-400">(not set)</span>}</div>
              <div className="flex flex-col mb-4">
                <label className="text-gray-300 mb-1">Reason <span className="text-red-400">*</span></label>
                <select
                  className="bg-gray-700 text-white rounded px-2 py-1"
                  value={resolveReason}
                  onChange={e => setResolveReason(e.target.value)}
                  required
                >
                  <option value="">Select Reason</option>
                  {COMMON_STOP_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-4 justify-end">
                <button
                  type="button"
                  onClick={() => { setResolveModalOpen(false); setResolveStop(null); setResolveReason(""); }}
                  className="px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-700 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 rounded bg-green-600 text-white font-semibold hover:bg-green-700 transition shadow"
                  disabled={!resolveReason}
                >
                  Resolve
                </button>
              </div>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}
