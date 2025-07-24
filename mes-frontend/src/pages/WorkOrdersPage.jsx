// src/pages/WorkOrdersPage.jsx
import React, { useState, useEffect } from "react";
import { FiFileText, FiEdit, FiTrash2, FiPlus, FiBarChart2, FiCheckCircle, FiClock, FiAlertTriangle, FiLink, FiClipboard, FiMenu } from "react-icons/fi";
import KpiCard from "../components/common/KpiCard";
import { fetchWorkOrders, createWorkOrder, updateWorkOrder, deleteWorkOrder, fetchUsers, fetchProducts, fetchProductionLines } from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function WorkOrdersPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { user: currentUser } = useUser();
  // State for work orders
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ id: '', productId: '', quantity: '', status: 'Open', dueDate: '', assignedLine: '', progress: 0, alarms: 0, operatorId: '', comments: '' });
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [alarmModalOpen, setAlarmModalOpen] = useState(false);
  const [alarmOrder, setAlarmOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [users, setUsers] = useState([]);
  const [products, setProducts] = useState([]);
  const [lines, setLines] = useState([]);
  const [search, setSearch] = useState('');

  // KPI calculations
  const totalOrders = orders.length;
  const openOrders = orders.filter(o => o.status === "Open").length;
  const inProgress = orders.filter(o => o.status === "In Progress").length;
  const completed = orders.filter(o => o.status === "Completed").length;
  const totalQuantity = orders.reduce((a, b) => a + b.quantity, 0);
  const kpis = [
    { label: "Total Orders", value: totalOrders, icon: <FiBarChart2 />, color: "text-blue-400" },
    { label: "Open", value: openOrders, icon: <FiClock />, color: "text-yellow-400" },
    { label: "In Progress", value: inProgress, icon: <FiFileText />, color: "text-green-400" },
    { label: "Completed", value: completed, icon: <FiCheckCircle />, color: "text-green-600" },
    { label: "Total Quantity", value: totalQuantity, icon: <FiBarChart2 />, color: "text-purple-400" },
  ];

  // Sorting
  const sorted = [...orders].sort((a, b) => {
    if (sortKey === "quantity" || sortKey === "progress" || sortKey === "alarms") {
      return sortDir === "asc" ? a[sortKey] - b[sortKey] : b[sortKey] - a[sortKey];
    }
    return sortDir === "asc"
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  // Filtering
  const filtered = sorted.filter(o =>
    (statusFilter ? o.status === statusFilter : true)
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
    else setSelected(paginated.map((o) => o.id));
  };
  const handleBulkDelete = () => {
    if (window.confirm("Delete selected orders?")) {
      setOrders((os) => os.filter((o) => !selected.includes(o.id)));
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
  const handleViewAlarms = (order) => {
    setAlarmOrder(order);
    setAlarmModalOpen(true);
  };
  const handleViewLine = (order) => {
    alert(`View assigned line: ${order.assignedLine}`);
  };
  // Alarm logic: overdue or blocked (alarms > 0 or dueDate in the past and not completed)
  function getOrderAlarms(order) {
    let alarms = [];
    if (order.alarms > 0) alarms.push("Blocked order");
    if (order.status !== "Completed" && new Date(order.dueDate) < new Date()) alarms.push("Overdue order");
    return alarms;
  }

  // Handle add/edit form open
  const openForm = (index = null) => {
    setEditIndex(index);
    if (index !== null) {
      setFormData({ ...orders[index], productId: orders[index].product_id || '', operatorId: orders[index].operatorId || '', comments: orders[index].comments || '' });
    } else {
      setFormData({ id: '', productId: '', quantity: '', status: 'Open', dueDate: '', assignedLine: '', progress: 0, alarms: 0, operatorId: '', comments: '' });
    }
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...formData, product_id: Number(formData.productId) };
      if (currentUser?.role !== "Admin") { alert("You do not have permission to perform this action."); return; }
      if (editIndex !== null) {
        const id = orders[editIndex].id;
        await updateWorkOrder(id, payload);
        setOrders(orders => orders.map((order, i) => i === editIndex ? { ...formData, id, product_id: Number(formData.productId) } : order));
      } else {
        const res = await createWorkOrder(payload);
        setOrders(orders => [...orders, { ...formData, id: res.id, product_id: Number(formData.productId) }]);
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
    if (window.confirm('Are you sure you want to delete this work order?')) {
      setLoading(true);
      try {
        const id = orders[index].id;
        await deleteWorkOrder(id);
        setOrders(orders => orders.filter((_, i) => i !== index));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchWorkOrders()
      .then(setOrders)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
    fetchUsers().then(setUsers).catch(() => {});
    fetchProducts().then(setProducts).catch(() => {});
    fetchProductionLines().then(setLines).catch(() => {});
  }, []);

  if (!orders.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Work Orders</h1>
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
        <div className="flex items-center bg-background rounded px-3 py-1 border border-surface">
          <input
            type="text"
            placeholder="Search work orders..."
            value={search || ''}
            onChange={e => setSearch && setSearch(e.target.value)}
            className="bg-transparent text-primary placeholder-secondary focus:outline-none"
            aria-label="Search work orders"
          />
        </div>
        <select
          className="bg-background text-primary rounded px-2 py-1 ml-2 border border-surface focus:outline-none"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          aria-label="Filter by status"
        >
          <option value="">All Statuses</option>
          {[...new Set(orders.map(o => o.status))].map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="flex-1" />
        {currentUser?.role === "Admin" && (
          <button
            className="flex items-center bg-accent text-white hover:bg-primary px-4 py-2 rounded transition-colors duration-200 font-semibold shadow-md"
            onClick={() => openForm(null)}
            aria-label="Add work order"
          >
            <FiPlus className="mr-1" /> Add Work Order
          </button>
        )}
      </div>
      {/* Bulk Actions */}
      {selected.length > 0 && (
        <div className="bg-surface px-4 py-2 flex items-center gap-2 mb-2 rounded shadow border border-background">
          <span>{selected.length} selected</span>
          {currentUser?.role === "Admin" && (
            <button onClick={handleBulkDelete} className="bg-error px-2 py-1 rounded text-white transition-colors duration-200">Delete</button>
          )}
        </div>
      )}
      {/* TABLE */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <div className="overflow-x-auto rounded-xl shadow-lg bg-surface border border-surface transition-all duration-300">
          <table className="min-w-full text-sm border border-surface rounded-xl overflow-hidden shadow-lg">
            <thead className="bg-background border-b border-surface">
              <tr className="align-middle">
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left">
                  <input
                    type="checkbox"
                    checked={selected.length === paginated.length && paginated.length > 0}
                    onChange={handleSelectAll}
                    aria-label="Select all orders"
                  />
                </th>
                {[
                  { key: "id", label: "Order ID" },
                  { key: "product", label: "Product" },
                  { key: "quantity", label: "Quantity" },
                  { key: "status", label: "Status" },
                  { key: "dueDate", label: "Due Date" },
                  { key: "assignedLine", label: "Assigned Line" },
                  { key: "operatorId", label: "Operator" },
                  { key: "progress", label: "Progress" },
                  { key: "alarms", label: "Alarms" },
                  { key: "comments", label: "Comments" },
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
              {paginated.map((order, idx) => (
                <tr
                  key={order.id}
                  className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                  style={{ minHeight: 56 }}
                >
                  <td className="px-6 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.includes(order.id)}
                      onChange={() => handleSelect(order.id)}
                      aria-label={`Select order ${order.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{order.id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {products.find(p => p.id === order.product_id)?.name || ''}
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{order.quantity}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <span
                      className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${
                        order.status === "Completed"
                          ? "bg-success/90 text-white"
                          : order.status === "In Progress"
                          ? "bg-warning/90 text-white"
                          : "bg-info/90 text-white"
                      }`}
                      style={{ minWidth: 70, textAlign: 'center' }}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{order.dueDate}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <button className="text-accent hover:underline flex items-center gap-1" onClick={() => handleViewLine(order)} aria-label="View assigned line">
                      <FiLink /> {lines.find(l => l.id === order.assignedLine)?.name || ''}
                    </button>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {users.find(u => u.id === order.operatorId)?.full_name || ''}
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <div className="w-24 h-2 bg-background rounded-full overflow-hidden border border-surface">
                      <div
                        className={`h-full ${order.progress === 1 ? "bg-success" : "bg-warning"}`}
                        style={{ width: `${order.progress * 100}%` }}
                      />
                    </div>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {getOrderAlarms(order).length > 0 ? (
                      <button onClick={() => handleViewAlarms(order)} className="flex items-center gap-1 text-error font-semibold" aria-label="View alarms">
                        <FiAlertTriangle />
                        <span className="text-sm font-semibold">{getOrderAlarms(order).length}</span>
                      </button>
                    ) : (
                      <span className="text-secondary">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {order.comments}
                  </td>
                  <td className="px-6 py-4 flex gap-2 align-middle whitespace-nowrap">
                    {currentUser?.role === "Admin" && (
                      <>
                        <button className="hover:text-success" onClick={() => openForm(idx)} title="Edit" aria-label="Edit order">
                          <FiEdit />
                        </button>
                        <button className="hover:text-error" onClick={() => handleDelete(idx)} title="Delete" aria-label="Delete order">
                          <FiTrash2 />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
          {alarmModalOpen && alarmOrder && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
              <div className="bg-surface rounded-lg p-6 w-full max-w-md relative transition-all duration-300 ease-in-out transform hover:scale-105 shadow-2xl border border-background">
                <button
                  className="absolute top-2 right-2 text-secondary hover:text-error focus:outline-none"
                  onClick={() => setAlarmModalOpen(false)}
                  aria-label="Close modal"
                >
                  ×
                </button>
                <h2 className="text-xl font-bold mb-4">Alarms for {alarmOrder.product}</h2>
                <ul className="space-y-2">
                  {getOrderAlarms(alarmOrder).length > 0 ? (
                    getOrderAlarms(alarmOrder).map((a, i) => (
                      <li key={i} className="text-error flex items-center gap-2">
                        <FiAlertTriangle /> {a}
                      </li>
                    ))
                  ) : (
                    <li className="text-secondary">No active alarms</li>
                  )}
                </ul>
              </div>
            </div>
          )}
          {showForm && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <form
                className="bg-surface p-6 rounded-xl shadow-2xl flex flex-col gap-4 min-w-[300px] border border-background transition-all duration-300 animate-fade-in"
                onSubmit={handleFormSubmit}
              >
                <h3 className="text-lg font-bold mb-2 text-primary">{editIndex !== null ? 'Edit' : 'Add'} Work Order</h3>
                <div className="flex flex-col gap-4">
                  <input
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    placeholder="Order ID"
                    value={formData.id}
                    onChange={e => setFormData(f => ({ ...f, id: e.target.value }))}
                    required
                    disabled={editIndex !== null}
                  />
                  <select
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    value={formData.productId}
                    onChange={e => setFormData(f => ({ ...f, productId: e.target.value }))}
                    required
                  >
                    <option value="">Select product</option>
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.name}</option>
                    ))}
                  </select>
                  <input
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    placeholder="Quantity"
                    type="number"
                    value={formData.quantity}
                    onChange={e => setFormData(f => ({ ...f, quantity: e.target.value }))}
                    required
                  />
                  <select
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    required
                  >
                    <option value="">Select status</option>
                    <option value="Open">Open</option>
                    <option value="In Progress">In Progress</option>
                    <option value="Completed">Completed</option>
                  </select>
                  <input
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    placeholder="Due Date"
                    type="date"
                    value={formData.dueDate}
                    onChange={e => setFormData(f => ({ ...f, dueDate: e.target.value }))}
                    required
                  />
                  <select
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    value={formData.assignedLine}
                    onChange={e => setFormData(f => ({ ...f, assignedLine: e.target.value }))}
                    required
                  >
                    <option value="">Select line</option>
                    {lines.map(l => (
                      <option key={l.id} value={l.id}>{l.name}</option>
                    ))}
                  </select>
                  <select
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    value={formData.operatorId}
                    onChange={e => setFormData(f => ({ ...f, operatorId: e.target.value }))}
                    required
                  >
                    <option value="">Select operator</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.full_name}</option>
                    ))}
                  </select>
                  <input
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    placeholder="Comments"
                    value={formData.comments}
                    onChange={e => setFormData(f => ({ ...f, comments: e.target.value }))}
                  />
                  <div>
                    <label htmlFor="progress" className="block text-secondary mb-1">Progress</label>
                    <input
                      type="range"
                      id="progress"
                      name="progress"
                      value={formData.progress * 100}
                      onChange={e => setFormData(f => ({ ...f, progress: Number(e.target.value) / 100 }))}
                      min="0"
                      max="100"
                      step="1"
                      className="w-full h-2 bg-background rounded-full overflow-hidden appearance-none border border-surface focus:outline-none"
                    />
                    <span className="text-secondary text-sm">{formData.progress * 100}%</span>
                  </div>
                  <input
                    className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none"
                    placeholder="Alarms"
                    type="number"
                    value={formData.alarms}
                    onChange={e => setFormData(f => ({ ...f, alarms: Number(e.target.value) }))}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  {currentUser?.role === "Admin" && (
                    <>
                      <button type="submit" className="bg-accent px-4 py-2 rounded text-white font-semibold transition-colors duration-200 focus:outline-none">Save</button>
                      <button type="button" className="bg-background px-4 py-2 rounded text-primary border border-surface font-semibold transition-colors duration-200 focus:outline-none" onClick={() => setShowForm(false)}>Cancel</button>
                    </>
                  )}
                </div>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
