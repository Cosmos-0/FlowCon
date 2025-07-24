// src/pages/LinesPage.jsx
import React, { useState } from "react";
import { FiPackage, FiEdit, FiTrash2, FiPlus, FiTrendingUp, FiTrendingDown, FiLayers, FiBarChart2, FiBell, FiServer, FiMenu } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import KpiCard from "../components/common/KpiCard";
import { fetchProductionLines, createProductionLine, updateProductionLine, deleteProductionLine, fetchMachines, updateMachine } from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function LinesPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { user: currentUser } = useUser();
  // State for production lines
  const [lines, setLines] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', machines: '', shift_quantity: '', status: 'RUNNING' });
  const navigate = useNavigate();
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [alarmLine, setAlarmLine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [allMachines, setAllMachines] = useState([]);
  const [selectedMachineIds, setSelectedMachineIds] = useState([]);
  const [machinesModalOpen, setMachinesModalOpen] = useState(false);
  const [machinesForLine, setMachinesForLine] = useState([]);
  const [machinesLineName, setMachinesLineName] = useState("");

  // KPI calculations
  const totalLines = lines.length;
  const avgOee = lines.length ? (lines.reduce((a, b) => a + b.oee, 0) / lines.length).toFixed(1) : 0;
  const totalMachines = lines.reduce((a, b) => a + b.machines, 0);
  const bestLine = lines.reduce((best, l) => (l.oee > (best?.oee ?? -1) ? l : best), null);
  const worstLine = lines.reduce((worst, l) => (l.oee < (worst?.oee ?? 101) ? l : worst), null);
  const kpis = [
    { label: "Total Lines", value: totalLines, icon: <FiLayers />, color: "text-blue-400" },
    { label: "Avg OEE", value: avgOee, unit: "%", icon: <FiBarChart2 />, color: "text-green-400" },
    { label: "Total Machines", value: totalMachines, icon: <FiPackage />, color: "text-yellow-400" },
    bestLine ? { label: "Best Line", value: bestLine.name, icon: <FiTrendingUp />, color: "text-green-400" } : null,
    worstLine ? { label: "Worst Line", value: worstLine.name, icon: <FiTrendingDown />, color: "text-red-400" } : null,
  ].filter(Boolean);

  // Sorting
  const sorted = [...lines].sort((a, b) => {
    if (sortKey === "machines" || sortKey === "alarms") {
      return sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    }
    return sortDir === "asc"
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  // Filtering
  const filtered = sorted.filter(l =>
    (statusFilter ? l.status === statusFilter : true)
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
    else setSelected(paginated.map((l) => l.id));
  };
  const handleBulkDelete = () => {
    if (window.confirm("Delete selected lines?")) {
      setLines((ls) => ls.filter((l) => !selected.includes(l.id)));
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
    setEditIndex(index);
    if (index !== null) {
      setFormData({ ...lines[index], status: lines[index].status || 'RUNNING', shift_quantity: lines[index].shift_quantity || '' });
      // Preselect machines assigned to this line
      setSelectedMachineIds(allMachines.filter(m => m.line_id === lines[index].id).map(m => m.id));
    } else {
      setFormData({ id: '', name: '', shift_quantity: '', status: 'RUNNING' });
      setSelectedMachineIds([]);
    }
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let lineId;
      if (currentUser?.role !== "Admin") { alert("You do not have permission to perform this action."); return; }
      if (editIndex !== null) {
        lineId = lines[editIndex].id;
        await updateProductionLine(lineId, formData);
        setLines(lines => lines.map((line, i) => i === editIndex ? { ...formData, id: lineId } : line));
      } else {
        const res = await createProductionLine(formData);
        lineId = res.id;
        setLines(lines => [...lines, { ...formData, id: lineId }]);
      }
      // Assign selected machines to this line
      await Promise.all(
        allMachines.map(m =>
          selectedMachineIds.includes(m.id)
            ? updateMachine(m.id, { ...m, line_id: lineId })
            : m.line_id === lineId
              ? updateMachine(m.id, { ...m, line_id: null })
              : Promise.resolve()
        )
      );
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
    if (window.confirm('Are you sure you want to delete this line?')) {
      setLoading(true);
      try {
        const id = lines[index].id;
        await deleteProductionLine(id);
        setLines(lines => lines.filter((_, i) => i !== index));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  // Handle view details
  const handleView = (lineId) => {
    const line = lines.find(l => l.id === lineId);
    navigate(`/lines/${lineId}`, { state: { line } });
  };

  // Simulate real-time status updates
  React.useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProductionLines()
      .then(setLines)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Fetch all machines for assignment
    fetchMachines()
      .then(setAllMachines)
      .catch(() => {});
  }, []);

  const handleViewAlarms = (line) => {
    setAlarmLine(line);
    setAlarmModalOpen(true);
  };
  const handleViewMachines = (line) => {
    const machines = allMachines.filter(m => m.line_id === line.id);
    setMachinesForLine(machines);
    setMachinesLineName(line.name);
    setMachinesModalOpen(true);
  };

  if (!lines.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* Header */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Production Lines</h1>
        </div>
        {currentUser?.role === "Admin" && (
          <button
            className="flex items-center gap-2 bg-accent text-white hover:bg-primary px-4 py-2 rounded transition-colors duration-200 font-semibold shadow-md"
            onClick={() => openForm()}
          >
            <FiPlus className="mr-1" /> Add Line
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
        <h2 className="text-2xl font-bold mb-6 text-primary">All Production Lines</h2>
        <div className="flex flex-col sm:flex-row items-center gap-2 mb-4">
          <label htmlFor="status-filter" className="text-secondary text-sm font-medium">Status:</label>
          <select
            id="status-filter"
            className="bg-surface text-primary rounded px-2 py-2 border border-background transition-all duration-200 focus:ring-2 focus:ring-accent min-w-[140px]"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All Statuses</option>
            <option value="RUNNING">Running</option>
            <option value="STOPPED">Stopped</option>
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
                    aria-label="Select all lines"
                  />
                </th>
                {[
                  { key: "id", label: "Line ID" },
                  { key: "name", label: "Name" },
                  { key: "machines", label: "# Machines" },
                  { key: "status", label: "Status" },
                  { key: "alarms", label: "Alarms" },
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
              {paginated.map((line, idx) => (
                <tr
                  key={line.id}
                  className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                  style={{ minHeight: 56 }}
                >
                  <td className="px-6 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.includes(line.id)}
                      onChange={() => handleSelect(line.id)}
                      aria-label={`Select line ${line.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{line.id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{line.name}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{line.machines}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${line.status === "RUNNING" ? "bg-success/90 text-white" : "bg-error/90 text-white"}`}
                      style={{ minWidth: 70, textAlign: 'center' }}>
                      {line.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {line.alarms > 0 ? (
                      <button onClick={() => handleViewAlarms(line)} className="flex items-center gap-1 text-error transition-colors duration-200" aria-label="View alarms">
                        <FiBell />
                        <span className="text-sm font-semibold">{line.alarms}</span>
                      </button>
                    ) : (
                      <span className="text-secondary">0</span>
                    )}
                  </td>
                  <td className="px-6 py-4 flex gap-2 align-middle whitespace-nowrap">
                    <button className="text-accent hover:underline transition-colors duration-200" onClick={() => handleView(line.id)} aria-label="View details">
                      View
                    </button>
                    <button className="text-info hover:underline flex items-center gap-1 transition-colors duration-200" onClick={() => handleViewMachines(line)} aria-label="View machines">
                      <FiServer /> Machines
                    </button>
                    {currentUser?.role === "Admin" && (
                      <>
                        <button className="text-warning transition-colors duration-200" onClick={() => openForm(idx)} title="Edit" aria-label="Edit line">
                          <FiEdit />
                        </button>
                        <button className="text-error transition-colors duration-200" onClick={() => handleDelete(idx)} title="Delete" aria-label="Delete line">
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
              <h3 className="text-lg font-bold mb-2">{editIndex !== null ? 'Edit' : 'Add'} Production Line</h3>
              <div className="flex flex-col md:flex-row gap-4">
                <input
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  placeholder="Line Name"
                  value={formData.name}
                  onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                  required
                />
                <input
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  placeholder="Shift Quantity"
                  type="number"
                  value={formData.shift_quantity}
                  onChange={e => setFormData(f => ({ ...f, shift_quantity: e.target.value }))}
                />
                <select
                  className="bg-background text-primary rounded px-2 py-1 flex-1 transition-all duration-200"
                  value={formData.status}
                  onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                  required
                >
                  <option value="RUNNING">Running</option>
                  <option value="STOPPED">Stopped</option>
                </select>
              </div>
              <div className="flex flex-col gap-2 mt-4">
                <label className="text-secondary font-semibold mb-1">Assign Machines to this Line:</label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {allMachines.map(machine => (
                    <label key={machine.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={selectedMachineIds.includes(machine.id)}
                        onChange={e => {
                          setSelectedMachineIds(ids =>
                            e.target.checked
                              ? [...ids, machine.id]
                              : ids.filter(id => id !== machine.id)
                          );
                        }}
                      />
                      <span>{machine.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button type="submit" className="bg-success px-4 py-2 rounded text-white transition-colors duration-200">Save</button>
                <button type="button" className="bg-gray-600 px-4 py-2 rounded text-white transition-colors duration-200" onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        )}
        {/* Alarm Modal */}
        {alarmModalOpen && alarmLine && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-surface rounded-lg p-6 w-full max-w-md relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
                onClick={() => setAlarmModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Alarms for Line: {alarmLine.name}</h2>
              <ul className="space-y-2">
                {alarmLine.alarms > 0 ? (
                  Array.from({ length: alarmLine.alarms }).map((_, i) => (
                    <li key={i} className="text-error flex items-center gap-2">
                      <FiBell /> Alarm #{i + 1}
                    </li>
                  ))
                ) : (
                  <li className="text-secondary">No active alarms</li>
                )}
              </ul>
            </div>
          </div>
        )}
        {/* Machines Modal */}
        {machinesModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
            <div className="bg-surface rounded-lg p-6 w-full max-w-2xl relative">
              <button
                className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
                onClick={() => setMachinesModalOpen(false)}
                aria-label="Close modal"
              >
                ×
              </button>
              <h2 className="text-xl font-bold mb-4">Machines for Line: {machinesLineName}</h2>
              {machinesForLine.length === 0 ? (
                <div className="text-secondary">No machines assigned to this line.</div>
              ) : (
                <table className="min-w-full bg-surface rounded mb-2">
                  <thead>
                    <tr className="text-left text-secondary">
                      <th className="px-4 py-2">ID</th>
                      <th className="px-4 py-2">Name</th>
                    </tr>
                  </thead>
                  <tbody>
                    {machinesForLine.map(machine => (
                      <tr key={machine.id} className="border-t border-background">
                        <td className="px-4 py-2">{machine.id}</td>
                        <td className="px-4 py-2">{machine.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
