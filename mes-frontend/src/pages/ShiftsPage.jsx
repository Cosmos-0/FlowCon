// src/pages/ShiftsPage.jsx
import React, { useState, useEffect } from "react";
import { FiClock, FiEdit, FiTrash2, FiPlus, FiUsers, FiCalendar, FiChevronLeft, FiChevronRight, FiBell, FiServer, FiMenu } from "react-icons/fi";
import KpiCard from "../components/common/KpiCard";
import { fetchShifts, createShift, updateShift, deleteShift, fetchProductionLines, fetchUsers } from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function ShiftsPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { user: currentUser } = useUser();
  // State for shifts
  const [shifts, setShifts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ name: '', start_time: '', end_time: '', operator: '', status: '', duration: 8, line_id: '', shift_quantity: 0 });
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [operatorFilter, setOperatorFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [alarmShift, setAlarmShift] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allLines, setAllLines] = useState([]);
  const [allUsers, setAllUsers] = useState([]);

  // KPI calculations
  const totalShifts = shifts.length;
  const uniqueOperators = new Set(shifts.map(s => s.operator)).size;
  const earliestStart = shifts.reduce((earliest, s) => (!earliest || s.start < earliest ? s.start : earliest), null);
  const latestEnd = shifts.reduce((latest, s) => (!latest || s.end > latest ? s.end : latest), null);
  const kpis = [
    { label: "Total Shifts", value: totalShifts, icon: <FiClock />, color: "text-blue-400" },
    { label: "Unique Operators", value: uniqueOperators, icon: <FiUsers />, color: "text-green-400" },
    { label: "Earliest Start", value: earliestStart, icon: <FiChevronLeft />, color: "text-yellow-400" },
    { label: "Latest End", value: latestEnd, icon: <FiChevronRight />, color: "text-red-400" },
  ];

  // Sorting
  const sorted = [...shifts].sort((a, b) => {
    if (sortKey === "duration") {
      return sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    }
    return sortDir === "asc"
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  // Filtering
  const filtered = sorted.filter(s =>
    (operatorFilter ? s.operator === operatorFilter : true)
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
    if (window.confirm("Delete selected shifts?")) {
      setShifts((ss) => ss.filter((s) => !selected.includes(s.id)));
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

  // Handle add/edit form open
  const openForm = (index = null) => {
    if (currentUser?.role !== "Admin") { alert("You do not have permission to perform this action."); return; }
    setEditIndex(index);
    if (index !== null) {
      const { id, start_time, end_time, shift_quantity, ...rest } = shifts[index];
      setFormData({
        ...rest,
        start_time: start_time || '',
        end_time: end_time || '',
        line_id: shifts[index].line_id || '',
        shift_quantity: shift_quantity ?? 0
      });
    } else {
      setFormData({ name: '', start_time: '', end_time: '', operator: '', status: '', duration: 8, line_id: '', shift_quantity: 0 });
    }
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    if (currentUser?.role !== "Admin") { alert("You do not have permission to perform this action."); return; }
    e.preventDefault();
    setLoading(true);
    try {
      let data = { ...formData };
      if (editIndex !== null) {
        const id = shifts[editIndex].id;
        await updateShift(id, data);
        setShifts(shifts => shifts.map((shift, i) => i === editIndex ? { ...data, id } : shift));
      } else {
        const res = await createShift(data);
        setShifts(shifts => [...shifts, { ...data, id: res.id }]);
      }
      setShowForm(false);
      setEditIndex(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  // Handle delete
  const handleDelete = async (index) => {
    if (currentUser?.role !== "Admin") { alert("You do not have permission to perform this action."); return; }
    if (window.confirm('Are you sure you want to delete this shift?')) {
      setLoading(true);
      try {
        const id = shifts[index].id;
        await deleteShift(id);
        setShifts(shifts => shifts.filter((_, i) => i !== index));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  // Simulate shift status based on current time
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchShifts()
      .then(setShifts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Fetch all lines for shift assignment
    fetchProductionLines()
      .then(setAllLines)
      .catch(() => {});
    // Fetch all users for operator dropdown
    fetchUsers()
      .then(setAllUsers)
      .catch(() => {});
  }, []);

  // Alarms: missing operator or overlapping shifts
  function getShiftAlarms(shift, allShifts) {
    let alarms = [];
    if (!shift.operator) alarms.push("Missing operator");
    // Overlap check
    const thisStart = shift.start;
    const thisEnd = shift.end;
    allShifts.forEach(s => {
      if (s.id !== shift.id) {
        if (
          (thisStart < s.end && thisEnd > s.start) ||
          (thisEnd < thisStart && (thisEnd > s.start || thisStart < s.end)) // overnight
        ) {
          alarms.push(`Overlaps with ${s.name}`);
        }
      }
    });
    return alarms;
  }
  const handleViewAlarms = (shift) => {
    setAlarmShift(shift);
    setAlarmModalOpen(true);
  };
  const handleViewLines = (shift) => {
    alert(`View lines/machines for ${shift.name}`);
  };

  // Helper to get operator display name
  function getOperatorName(operatorId) {
    const user = allUsers.find(u => String(u.id) === String(operatorId));
    return user ? (user.full_name || user.username || user.email || user.id) : operatorId;
  }

  if (!shifts.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* Header */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Shifts</h1>
        </div>
        {currentUser?.role === "Admin" && (
          <button
            className="flex items-center gap-2 bg-accent text-white hover:bg-primary px-4 py-2 rounded transition-colors duration-200 font-semibold shadow-md"
            onClick={() => openForm()}
          >
            <FiPlus className="mr-1" /> Add Shift
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
        <h2 className="text-2xl font-bold mb-6 text-primary">All Shifts</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <label htmlFor="status-filter" className="text-secondary text-sm font-medium">Status:</label>
          <select
            id="status-filter"
            className="bg-surface text-primary rounded px-2 py-2 border border-background transition-all duration-200 focus:ring-2 focus:ring-accent min-w-[140px]"
            value={operatorFilter}
            onChange={e => setOperatorFilter(e.target.value)}
            aria-label="Filter by operator"
          >
            <option value="">All Operators</option>
            {[...new Set(shifts.map(s => s.operator))].map(op => (
              <option key={op} value={op}>{op}</option>
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
                    aria-label="Select all shifts"
                  />
                </th>
                {[
                  { key: "id", label: "Shift ID" },
                  { key: "name", label: "Name" },
                  { key: "start_time", label: "Start Time" },
                  { key: "end_time", label: "End Time" },
                  { key: "operator", label: "Operator" },
                  { key: "status", label: "Status" },
                  { key: "duration", label: "Duration (h)" },
                  { key: "shift_quantity", label: "Shift Quantity" },
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
              {paginated.map((shift, idx) => (
                <tr
                  key={shift.id}
                  className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                  style={{ minHeight: 56 }}
                >
                  <td className="px-6 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.includes(shift.id)}
                      onChange={() => handleSelect(shift.id)}
                      aria-label={`Select shift ${shift.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{shift.id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{shift.name}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{shift.start_time}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{shift.end_time}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{getOperatorName(shift.operator) || <span className="text-error">None</span>}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {shift.status}
                    {getShiftAlarms(shift, shifts).length > 0 && (
                      <button onClick={() => handleViewAlarms(shift)} className="ml-2 text-error" aria-label="View alarms">
                        <FiBell />
                        <span className="text-xs font-semibold">{getShiftAlarms(shift, shifts).length}</span>
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{shift.duration}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{shift.shift_quantity}</td>
                  <td className="px-6 py-4 flex gap-2 align-middle whitespace-nowrap">
                    <button className="text-blue-400 hover:underline flex items-center gap-1" onClick={() => handleViewLines(shift)} aria-label="View lines/machines">
                      <FiServer /> Lines
                    </button>
                    {currentUser?.role === "Admin" && (
                      <>
                        <button className="text-yellow-400" onClick={() => openForm(idx)} title="Edit" aria-label="Edit shift">
                          <FiEdit />
                        </button>
                        <button className="text-red-400" onClick={() => handleDelete(idx)} title="Delete" aria-label="Delete shift">
                          <FiTrash2 />
                        </button>
                      </>
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

        {/* Add/Edit Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <form
              className="bg-surface p-6 rounded shadow-lg flex flex-col gap-4 min-w-[300px] transition-all duration-300 animate-fade-in"
              onSubmit={handleFormSubmit}
            >
              <h3 className="text-lg font-bold mb-2">{editIndex !== null ? 'Edit' : 'Add'} Shift</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  placeholder="Shift Name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <input
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  placeholder="Start Time"
                  type="time"
                  value={formData.start_time}
                  onChange={e => setFormData(f => ({ ...f, start_time: e.target.value }))}
                  required
                />
                <input
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  placeholder="End Time"
                  type="time"
                  value={formData.end_time}
                  onChange={e => setFormData(f => ({ ...f, end_time: e.target.value }))}
                  required
                />
                <select
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  value={formData.operator}
                  onChange={e => setFormData(f => ({ ...f, operator: e.target.value }))}
                  required
                >
                  <option value="">-- Select Operator --</option>
                  {allUsers.map(user => (
                    <option key={user.id} value={user.id}>
                      {user.full_name ? `${user.full_name} (ID: ${user.id})` : user.username ? `${user.username} (ID: ${user.id})` : user.email ? `${user.email} (ID: ${user.id})` : `(ID: ${user.id})`}
                    </option>
                  ))}
                </select>
                <select
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  value={formData.status}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  required
                >
                  <option value="Scheduled">Scheduled</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                  <option value="Paused">Paused</option>
                </select>
                <input
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  placeholder="Duration"
                  value={formData.duration}
                  onChange={e => setFormData(f => ({ ...f, duration: Number(e.target.value) }))}
                  required
                />
                <select
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  value={formData.line_id}
                  onChange={e => setFormData(f => ({ ...f, line_id: e.target.value }))}
                  required
                >
                  <option value="">-- Select Production Line --</option>
                  {allLines.map(line => (
                    <option key={line.id} value={line.id}>{line.name} (ID: {line.id})</option>
                  ))}
                </select>
                <label className="flex flex-col">
                  <span className="mb-1 font-medium">Shift Quantity (pieces)</span>
                  <input
                    type="number"
                    min="0"
                    className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                    value={formData.shift_quantity}
                    onChange={e => setFormData(f => ({ ...f, shift_quantity: e.target.value }))}
                    required
                  />
                </label>
              </div>
              <div className="mt-4 flex gap-2">
                {currentUser?.role === "Admin" && (
                  <button type="submit" className="bg-success px-4 py-2 rounded text-white transition-colors duration-200">Save</button>
                )}
                <button type="button" className="bg-gray-600 px-4 py-2 rounded text-white transition-colors duration-200" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Alarm Modal */}
        {alarmModalOpen && alarmShift && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
                onClick={() => setAlarmModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Alarms for {alarmShift.name}</h2>
              <ul className="space-y-2">
                {getShiftAlarms(alarmShift, shifts).length > 0 ? (
                  getShiftAlarms(alarmShift, shifts).map((a, i) => (
                    <li key={i} className="text-red-400 flex items-center gap-2">
                      <FiBell /> {a}
                    </li>
                  ))
                ) : (
                  <li className="text-gray-400">No active alarms</li>
                )}
              </ul>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
