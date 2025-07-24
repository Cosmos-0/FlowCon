// src/pages/MachinesPage.jsx
import React, { useState, useEffect } from "react";
import { FiCpu, FiSearch, FiPlus, FiBell, FiInfo, FiEdit2, FiTrash2, FiMenu } from "react-icons/fi";
import { useNotifications } from "../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import KpiCard from "../components/common/KpiCard";
import MachineRow from "../components/domain/MachineRow";
import MachineModal from "../components/domain/MachineModal";
import { fetchMachines, createMachine, updateMachine, deleteMachine, fetchProductionLines, fetchProducts } from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function MachinesPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { addNotification } = useNotifications();
  const navigate = useNavigate();
  const [machines, setMachines] = useState([]);
  const [search, setSearch] = useState("");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [editMachine, setEditMachine] = useState({ id: "", name: "", status: "RUNNING", line_id: "", productId: "", counter_type: 'status', avg_pieces_per_sec: '' });
  const [addMachine, setAddMachine] = useState({ id: "", name: "", status: "RUNNING", line_id: "", productId: "", counter_type: 'status', avg_pieces_per_sec: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [selected, setSelected] = useState([]);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [alarmMachine, setAlarmMachine] = useState(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [workOrderFilter, setWorkOrderFilter] = useState("");
  const [allLines, setAllLines] = useState([]);
  const [products, setProducts] = useState([]);
  const { user: currentUser } = useUser();

  useEffect(() => {
    const timer = setTimeout(() => {
      if (machines[1]) {
        const m = machines[1];
        const now = new Date().toLocaleTimeString();
        addNotification({
          message: `You need to qualify the stop for ${m.name} (ID: ${m.id})`,
          time: now,
        });
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [addNotification, machines]);

  // Simulate real-time status updates
  useEffect(() => {
    const interval = setInterval(() => {
      setMachines((ms) =>
        ms.filter(Boolean).map((m) =>
          Math.random() < 0.1
            ? { ...m, status: m.status === "RUNNING" ? "STOPPED" : "RUNNING" }
            : m
        )
      );
    }, 8000);
    return () => clearInterval(interval);
  }, []);

  // KPI values
  const running = machines.filter(m => m.status === "RUNNING").length;
  const stopped = machines.filter(m => m.status === "STOPPED").length;
  const avgOee = machines.length ? (machines.reduce((a, b) => a + b.oee, 0) / machines.length).toFixed(1) : 0;
  const kpis = [
    { label: "Total Machines", value: machines.length, icon: <FiCpu />, color: "text-blue-400" },
    { label: "Running", value: running, icon: <FiCpu />, color: "text-green-400" },
    { label: "Stopped", value: stopped, icon: <FiCpu />, color: "text-red-400" },
    { label: "Avg OEE", value: avgOee, unit: "%", icon: <FiCpu />, color: "text-yellow-400" },
  ];

  // Sorting
  const sorted = [...machines.filter(Boolean)].sort((a, b) => {
    if (sortKey === "oee") {
      return sortDir === "asc" ? a.oee - b.oee : b.oee - a.oee;
    }
    return sortDir === "asc"
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  // Filtering by status and work order
  let filtered = sorted.filter((m) =>
    (statusFilter ? m.status === statusFilter : true) &&
    (workOrderFilter ? m.workOrder === workOrderFilter : true) &&
    (m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.id.toLowerCase().includes(search.toLowerCase()))
  );

  // Pagination
  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  // Handlers
  const handleDelete = async (id) => {
    if (window.confirm("Delete this machine?")) {
      setLoading(true);
      try {
        await deleteMachine(id);
        setMachines((ms) => ms.filter((m) => m.id !== id));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };
  const handleEdit = (id) => {
    const machine = machines.find((m) => m.id === id);
    setEditMachine({
      ...machine,
      productId: machine.product_id ? String(machine.product_id) : ""
    });
    setEditModalOpen(true);
  };
  const handleInfo = (id) => navigate(`/machines/${id}`);

  const handleEditSave = async () => {
    setLoading(true);
    try {
      await updateMachine(editMachine.id, editMachine);
      setMachines((ms) =>
        ms.map((m) => (m.id === editMachine.id ? { ...editMachine } : m))
      );
      setEditModalOpen(false);
      setEditMachine(null);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleAddSave = async () => {
    setLoading(true);
    try {
      const res = await createMachine(addMachine);
      setMachines((ms) => [...ms, { ...addMachine, id: res.id }]);
      setAddModalOpen(false);
      setAddMachine({ id: "", name: "", status: "RUNNING", line_id: "", productId: "", counter_type: 'status', avg_pieces_per_sec: '' });
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleSort = (key) => {
    if (sortKey === key) setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    else {
      setSortKey(key);
      setSortDir("asc");
    }
  };

  // Bulk actions
  const handleSelect = (id) => {
    setSelected((sel) =>
      sel.includes(id) ? sel.filter((sid) => sid !== id) : [...sel, id]
    );
  };
  const handleSelectAll = () => {
    if (selected.length === paginated.length) setSelected([]);
    else setSelected(paginated.map((m) => m.id));
  };
  const handleBulkDelete = () => {
    if (window.confirm("Delete selected machines?")) {
      setMachines((ms) => ms.filter((m) => !selected.includes(m.id)));
      setSelected([]);
    }
  };
  const handleBulkStatus = (status) => {
    setMachines((ms) =>
      ms.map((m) => (selected.includes(m.id) ? { ...m, status } : m))
    );
    setSelected([]);
  };
  const handleViewAlarms = (machine) => {
    setAlarmMachine(machine);
    setAlarmModalOpen(true);
  };

  // Loading simulation
  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchMachines()
      .then(setMachines)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    // Fetch all lines for machine assignment
    fetchProductionLines()
      .then(setAllLines)
      .catch(() => {});
    fetchProducts().then(setProducts).catch(() => {});
  }, []);

  if (!machines.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Machines</h1>
        </div>
        <div className="flex-1" />
      </header>
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <KpiCard key={idx} {...kpi} className="bg-surface text-primary rounded-xl shadow-lg border border-background transition-all duration-300 ease-in-out transform hover:scale-105 hover:shadow-2xl" />
        ))}
      </div>
      {/* Toolbar */}
      <div className="flex-none bg-surface rounded-xl shadow-md px-4 py-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center bg-gray-700 rounded px-3 py-1">
          <FiSearch className="text-gray-400 mr-2" />
          <input
            type="text"
            placeholder="Search machines..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-transparent text-primary placeholder-secondary focus:outline-none"
            aria-label="Search machines"
          />
        </div>
        <select
          className="bg-background text-primary rounded px-2 py-1 ml-2"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          <option value="RUNNING">Running</option>
          <option value="STOPPED">Stopped</option>
        </select>
        <select
          className="bg-background text-primary rounded px-2 py-1 ml-2"
          value={workOrderFilter}
          onChange={e => setWorkOrderFilter(e.target.value)}
          aria-label="Filter by work order"
        >
          <option value="">All Work Orders</option>
          {[...new Set(machines.map(m => m.workOrder).filter(Boolean))].map(wo => (
            <option key={wo} value={wo}>{wo}</option>
          ))}
        </select>
        <div className="flex-1" />
        {currentUser?.role === "Admin" && (
          <button
            onClick={() => setAddModalOpen(true)}
            className="flex items-center bg-accent text-white hover:bg-primary px-4 py-2 rounded transition-colors duration-200 font-semibold shadow-md"
            aria-label="Add machine"
          >
            <FiPlus className="mr-1" /> Add Machine
          </button>
        )}
      </div>
      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-surface px-4 py-2 flex items-center gap-2 mb-2 rounded shadow border border-background">
          <span>{selected.length} selected</span>
          {currentUser?.role === "Admin" && (
            <>
              <button onClick={handleBulkDelete} className="bg-error px-2 py-1 rounded text-white transition-colors duration-200">Delete</button>
              <button onClick={() => handleBulkStatus("RUNNING")} className="bg-success px-2 py-1 rounded text-white transition-colors duration-200">Set Running</button>
              <button onClick={() => handleBulkStatus("STOPPED")} className="bg-warning px-2 py-1 rounded text-white transition-colors duration-200">Set Stopped</button>
            </>
          )}
        </div>
      )}
      {/* TABLE */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <div className="overflow-x-auto rounded-xl shadow-lg bg-surface border border-surface transition-all duration-300">
          {error && <div className="bg-error text-white p-4 rounded mb-4">{error}</div>}
          {loading ? (
            <div className="bg-surface p-4 rounded h-64 animate-pulse" />
          ) : (
            <table className="min-w-full text-sm border border-surface rounded-xl overflow-hidden shadow-lg">
              <thead className="bg-background border-b border-surface">
                <tr className="align-middle">
                  <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">
                    <input
                      type="checkbox"
                      checked={selected.length === paginated.length && paginated.length > 0}
                      onChange={handleSelectAll}
                      aria-label="Select all machines"
                    />
                  </th>
                  {[
                    { key: "id", label: "Machine ID" },
                    { key: "name", label: "Name" },
                    { key: "status", label: "Status" },
                    { key: "oee", label: "OEE (%)" },
                    { key: "alarms", label: "Alarms" },
                    { key: "workOrder", label: "Work Order" },
                    { key: "counter_type", label: "Counter Type" },
                    { key: "avg_pieces_per_sec", label: "Avg Pieces/Sec" },
                    { key: "product", label: "Product" },
                    { key: "actions", label: "Actions" },
                  ].map((h) => (
                    <th
                      key={h.key}
                      className="px-6 py-4 font-bold text-secondary border-b border-surface text-left cursor-pointer select-none whitespace-nowrap"
                      onClick={() => h.key !== "actions" && h.key !== "alarms" && handleSort(h.key)}
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
                {paginated.map((m, idx) => (
                  <tr
                    key={m.id}
                    className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                    style={{ minHeight: 56 }}
                  >
                    <td className="px-6 py-4 align-middle">
                      <input
                        type="checkbox"
                        checked={selected.includes(m.id)}
                        onChange={() => handleSelect(m.id)}
                        aria-label={`Select machine ${m.id}`}
                      />
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{m.id}</td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{m.name}</td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${m.status === "RUNNING" ? "bg-success/90 text-white" : "bg-error/90 text-white"}`}
                        style={{ minWidth: 70, textAlign: 'center' }}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{m.oee}</td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">
                      {m.alarms && m.alarms.length > 0 ? (
                        <button onClick={() => handleViewAlarms(m)} className="flex items-center gap-1 text-error" aria-label="View alarms">
                          <FiBell />
                          <span className="text-sm">{m.alarms.length}</span>
                        </button>
                      ) : (
                        <span className="text-secondary">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{m.workOrder || <span className="text-secondary">-</span>}</td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{m.counter_type}</td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{m.avg_pieces_per_sec}</td>
                    <td className="px-6 py-4 align-middle whitespace-nowrap">{products.find(p => p.id === Number(m.product_id))?.name || ''}</td>
                    <td className="px-6 py-4 align-middle flex space-x-3 whitespace-nowrap">
                      <button onClick={() => handleInfo(m.id)} className="hover:text-info" aria-label="View details"><FiInfo /></button>
                      {currentUser?.role === "Admin" && (
                        <>
                          <button onClick={() => handleEdit(m.id)} className="hover:text-success" aria-label="Edit machine"><FiEdit2 /></button>
                          <button onClick={() => handleDelete(m.id)} className="hover:text-error" aria-label="Delete machine"><FiTrash2 /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
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
          {/* Edit Modal */}
          {editModalOpen && (
            <MachineModal
              open={editModalOpen}
              machine={editMachine}
              onChange={setEditMachine}
              onSave={handleEditSave}
              onClose={() => setEditModalOpen(false)}
              isEdit={true}
              lines={allLines}
              products={products}
            />
          )}
          {/* Add Modal */}
          {addModalOpen && (
            <MachineModal
              open={addModalOpen}
              machine={addMachine}
              onChange={setAddMachine}
              onSave={handleAddSave}
              onClose={() => setAddModalOpen(false)}
              isEdit={false}
              lines={allLines}
              products={products}
            />
          )}
        </div>
      </main>
      {/* Alarm Modal */}
      {alarmModalOpen && alarmMachine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md relative transition-all duration-300 ease-in-out transform hover:scale-105 shadow-2xl">
            <button
              className="absolute top-2 right-2 text-gray-400 hover:text-red-400"
              onClick={() => setAlarmModalOpen(false)}
              aria-label="Close modal"
            >
              ×
            </button>
            <h2 className="text-xl font-bold mb-4">Alarms for {alarmMachine.name}</h2>
            <ul className="space-y-2">
              {alarmMachine.alarms && alarmMachine.alarms.length > 0 ? (
                alarmMachine.alarms.map((a, i) => (
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
    </div>
  );
}
