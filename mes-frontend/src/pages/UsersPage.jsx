// src/pages/UsersPage.jsx
import React, { useState, useMemo } from "react";
import { FiUsers, FiSearch, FiChevronDown, FiEdit2, FiTrash2, FiPlus, FiCheck, FiX, FiAlertTriangle, FiBarChart2, FiDownload, FiUserCheck, FiUserX, FiMenu } from "react-icons/fi";
import { fetchUsers, createUser, updateUser, deleteUser } from "../services/api";
import { useUser } from "../contexts/UserContext";

// Sample users data
const sampleUsers = [
  {
    id: 1,
    fullName: "John Smith",
    email: "john.smith@gmail.com",
    username: "jonny77",
    status: "Active",
    role: "Admin",
    joined: "March 12, 2023",
    lastActive: "1 minute ago",
  },
  {
    id: 2,
    avatar: "https://i.pravatar.cc/40?img=2",
    fullName: "Olivia Bennett",
    email: "ollyben@gmail.com",
    username: "olly659",
    status: "Inactive",
    role: "User",
    joined: "June 27, 2022",
    lastActive: "1 month ago",
  },
  {
    id: 3,
    avatar: "https://i.pravatar.cc/40?img=3",
    fullName: "Daniel Warren",
    email: "dwarren3@gmail.com",
    username: "dwarren3",
    status: "Banned",
    role: "User",
    joined: "January 8, 2024",
    lastActive: "4 days ago",
  },
  {
    id: 4,
    avatar: "https://i.pravatar.cc/40?img=4",
    fullName: "Chloe Hayes",
    email: "chloehye@gmail.com",
    username: "chloehh",
    status: "Pending",
    role: "Guest",
    joined: "October 5, 2021",
    lastActive: "10 days ago",
  },
  {
    id: 5,
    avatar: "https://i.pravatar.cc/40?img=5",
    fullName: "Marcus Reed",
    email: "reeds777@gmail.com",
    username: "reeds7",
    status: "Suspended",
    role: "User",
    joined: "February 19, 2023",
    lastActive: "3 months ago",
  },
  {
    id: 6,
    avatar: "https://i.pravatar.cc/40?img=6",
    fullName: "Isabelle Clark",
    email: "belleclark@gmail.com",
    username: "bellecl",
    status: "Active",
    role: "Moderator",
    joined: "August 30, 2022",
    lastActive: "1 week ago",
  },
  {
    id: 7,
    avatar: "https://i.pravatar.cc/40?img=7",
    fullName: "Lucas Mitchell",
    email: "lucamich@gmail.com",
    username: "lucamich",
    status: "Active",
    role: "Guest",
    joined: "April 23, 2024",
    lastActive: "4 hours ago",
  },
  {
    id: 8,
    avatar: "https://i.pravatar.cc/40?img=8",
    fullName: "Mark Wilburg",
    email: "markwill32@gmail.com",
    username: "markwill32",
    status: "Banned",
    role: "User",
    joined: "November 14, 2020",
    lastActive: "2 months ago",
  },
  {
    id: 9,
    avatar: "https://i.pravatar.cc/40?img=9",
    fullName: "Nicholas Agenn",
    email: "nicolass009@gmail.com",
    username: "nicolass009",
    status: "Suspended",
    role: "User",
    joined: "July 6, 2023",
    lastActive: "3 hours ago",
  },
  {
    id: 10,
    avatar: "https://i.pravatar.cc/40?img=10",
    fullName: "Mia Nadinn",
    email: "mianaddiin@gmail.com",
    username: "mianaddiin",
    status: "Inactive",
    role: "Guest",
    joined: "December 31, 2021",
    lastActive: "4 months ago",
  },
  {
    id: 11,
    avatar: "https://i.pravatar.cc/40?img=11",
    fullName: "Noemi Villan",
    email: "noemivill99@gmail.com",
    username: "noemi",
    status: "Active",
    role: "Admin",
    joined: "August 10, 2024",
    lastActive: "15 minutes ago",
  },
];

// badge colors
const statusClasses = {
  Active:    "bg-green-600 text-white",
  Inactive:  "bg-gray-600 text-white",
  Banned:    "bg-red-600 text-white",
  Pending:   "bg-blue-600 text-white",
  Suspended: "bg-yellow-500 text-black",
};

const roles = ["Admin", "Moderator", "User", "Guest"];
const statuses = ["Active", "Inactive", "Banned", "Pending", "Suspended"];

export default function UsersPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { user: currentUser } = useUser();
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortKey, setSortKey] = useState("full_name");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [selected, setSelected] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ fullName: '', email: '', username: '', password: '', status: 'Active', role: 'User' });
  const [showDelete, setShowDelete] = useState(false);
  const [deleteIndex, setDeleteIndex] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [detailsUser, setDetailsUser] = useState(null);
  const [showAlarm, setShowAlarm] = useState(false);
  const [alarmUser, setAlarmUser] = useState(null);

  // KPI calculations
  const kpis = [
    { label: "Total Users", value: users.length, icon: <FiUsers />, color: "text-blue-400" },
    { label: "Active", value: users.filter(u => u.status === "Active").length, icon: <FiUserCheck />, color: "text-green-400" },
    { label: "Inactive", value: users.filter(u => u.status === "Inactive").length, icon: <FiUserX />, color: "text-gray-400" },
    { label: "Banned", value: users.filter(u => u.status === "Banned").length, icon: <FiAlertTriangle />, color: "text-red-400" },
    { label: "Admins", value: users.filter(u => u.role === "Admin").length, icon: <FiBarChart2 />, color: "text-purple-400" },
  ];

  // Filtering, sorting, searching
  const filtered = useMemo(() => {
    let arr = users;
    if (roleFilter) arr = arr.filter(u => u.role === roleFilter);
    if (statusFilter) arr = arr.filter(u => u.status === statusFilter);
    if (search) arr = arr.filter(u =>
      (u.full_name || u.fullName || "").toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.username.toLowerCase().includes(search.toLowerCase())
    );
    return arr;
  }, [users, roleFilter, statusFilter, search]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      if (sortKey === "joined" || sortKey === "lastActive") {
        return sortDir === "asc"
          ? new Date(a[sortKey]) - new Date(b[sortKey])
          : new Date(b[sortKey]) - new Date(a[sortKey]);
      }
      // For full_name, fallback to fullName if needed
      const aVal = sortKey === "full_name" ? (a.full_name || a.fullName || "") : (a[sortKey] || "");
      const bVal = sortKey === "full_name" ? (b.full_name || b.fullName || "") : (b[sortKey] || "");
      return sortDir === "asc"
        ? String(aVal).localeCompare(String(bVal))
        : String(bVal).localeCompare(String(aVal));
    });
  }, [filtered, sortKey, sortDir]);

  const total = sorted.length;
  const pages = Math.max(1, Math.ceil(total / perPage));
  const paged = sorted.slice((page - 1) * perPage, page * perPage);

  // Bulk actions
  const handleSelect = (id) => {
    setSelected(sel => sel.includes(id) ? sel.filter(sid => sid !== id) : [...sel, id]);
  };
  const handleSelectAll = () => {
    if (selected.length === paged.length) setSelected([]);
    else setSelected(paged.map(u => u.id));
  };
  const handleBulkDelete = () => {
    if (window.confirm("Delete selected users?")) {
      setUsers(us => us.filter(u => !selected.includes(u.id)));
      setSelected([]);
    }
  };

  // Add/Edit/Delete logic
  const openForm = (idx = null) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to add users.");
      return;
    }
    setEditIndex(idx);
    if (idx !== null) {
      const { id, ...rest } = users[idx];
      setFormData(rest);
    } else {
      setFormData({ fullName: '', email: '', username: '', password: '', status: 'Active', role: 'User' });
    }
    setShowForm(true);
  };
  const handleFormSubmit = async (e) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to add users.");
      return;
    }
    e.preventDefault();
    setLoading(true);
    try {
      let data = { ...formData };
      data.full_name = data.fullName;
      delete data.fullName;
      // Always send status
      if (!data.status) data.status = "Active";
      if (editIndex !== null) {
        delete data.password;
        const id = users[editIndex].id;
        await updateUser(id, data);
        setUsers(users => users.map((user, i) => i === editIndex ? { ...data, id } : user));
      } else {
        if (!data.password) throw new Error('Password is required');
        const res = await createUser(data);
        setUsers(users => [...users, { ...data, id: res.id }]);
      }
      setShowForm(false);
      setEditIndex(null);
    } catch (err) {
      if (err.message && (err.message.toLowerCase().includes('already exists') || err.message.toLowerCase().includes('duplicate')) ) {
        setError('A user with this email already exists.');
      } else {
        setError(err.message);
      }
    }
    setLoading(false);
  };
  const openDelete = (idx) => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to delete users.");
      return;
    }
    setDeleteIndex(idx);
    setShowDelete(true);
  };
  const handleDelete = async () => {
    if (currentUser?.role !== "Admin") {
      alert("You do not have permission to delete users.");
      return;
    }
    if (window.confirm('Are you sure you want to delete this user?')) {
      setLoading(true);
      try {
        const id = users[deleteIndex].id;
        await deleteUser(id);
        setUsers(users => users.filter((_, i) => i !== deleteIndex));
        setShowDelete(false);
        setDeleteIndex(null);
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  // Details modal
  const openDetails = (user) => { setDetailsUser(user); setShowDetails(true); };

  // Inline status/role change
  const handleStatusChange = (id, status) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, status } : u));
  };
  const handleRoleChange = (id, role) => {
    setUsers(us => us.map(u => u.id === id ? { ...u, role } : u));
  };

  // Simulated loading
  React.useEffect(() => {
    setLoading(true);
    setError("");
    fetchUsers()
      .then(setUsers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // MES-style alarms (e.g. banned, suspended, pending)
  const getUserAlarms = (user) => {
    let alarms = [];
    if (user.status === "Banned") alarms.push("User is banned");
    if (user.status === "Suspended") alarms.push("User is suspended");
    if (user.status === "Pending") alarms.push("User onboarding pending");
    return alarms;
  };
  const openAlarm = (user) => { setAlarmUser(user); setShowAlarm(true); };

  // Export
  const handleExport = () => {
    const csv = [
      ["Full Name", "Email", "Username", "Status", "Role", "Joined", "Last Active"],
      ...users.map(u => [u.full_name || u.fullName, u.email, u.username, u.status, u.role, u.joined, u.lastActive])
    ].map(row => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'users.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Trends (stub)
  // const trends = ...

  if (!users.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Users</h1>
        </div>
        <div className="flex-1" />
      </header>
      {/* KPI CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, idx) => (
          <div key={idx} className="bg-surface text-primary rounded-xl shadow-lg border border-background flex items-center gap-4 p-4">
            <span className={`text-2xl ${kpi.color}`}>{kpi.icon}</span>
            <div>
              <div className="text-lg font-bold">{kpi.value}</div>
              <div className="text-secondary text-sm">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>
      {/* Toolbar */}
      <div className="flex-none bg-surface rounded-xl shadow-md px-4 py-4 mb-6 flex flex-col sm:flex-row items-center gap-4">
        <div className="flex items-center bg-background rounded px-3 py-1 border border-surface">
          <FiSearch className="text-secondary mr-2" />
          <input
            type="text"
            placeholder="Search users..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="bg-transparent text-primary placeholder-secondary focus:outline-none"
            aria-label="Search users"
          />
        </div>
        <select className="bg-background text-primary rounded px-2 py-1 ml-2 border border-surface focus:outline-none" value={roleFilter} onChange={e => setRoleFilter(e.target.value)} aria-label="Filter by role">
          <option value="">All Roles</option>
          {roles.map(r => <option key={r} value={r}>{r}</option>)}
        </select>
        <select className="bg-background text-primary rounded px-2 py-1 ml-2 border border-surface focus:outline-none" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} aria-label="Filter by status">
          <option value="">All Statuses</option>
          {statuses.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <div className="flex-1" />
        {selected.length > 0 && currentUser?.role === "Admin" && (
          <button onClick={handleBulkDelete} className="bg-error px-2 py-1 rounded text-white transition-colors duration-200">Delete Selected</button>
        )}
        <button className="flex items-center bg-background px-3 py-1 rounded border border-surface hover:bg-surface transition-all duration-300" onClick={handleExport} aria-label="Export users">
          <FiDownload className="mr-1 text-secondary" /> Export
        </button>
        {currentUser?.role === "Admin" && (
          <button className="flex items-center bg-accent text-white px-4 py-2 rounded hover:bg-primary transition-colors duration-200 font-semibold shadow-md" onClick={() => openForm()} aria-label="Add user">
            <FiPlus className="mr-1" /> Add User
          </button>
        )}
      </div>
      {/* TABLE */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <div className="overflow-x-auto rounded-xl shadow-lg bg-surface border border-surface transition-all duration-300 animate-fade-in">
          <table className="min-w-full text-sm border border-surface rounded-xl overflow-hidden shadow-lg">
            <thead className="bg-background border-b border-surface">
              <tr className="align-middle">
                <th className="px-6 py-4 font-bold text-secondary border-b border-surface text-left"><input type="checkbox" checked={selected.length === paged.length && paged.length > 0} onChange={handleSelectAll} aria-label="Select all users" /></th>
                {[
                  { key: "full_name", label: "Full Name" },
                  { key: "email", label: "Email" },
                  { key: "username", label: "Username" },
                  { key: "status", label: "Status" },
                  { key: "role", label: "Role" },
                  { key: "alarms", label: "Alarms" },
                  { key: "actions", label: "Actions" },
                ].map(h => (
                  <th key={h.key} className="px-6 py-4 font-bold text-secondary border-b border-surface text-left cursor-pointer select-none whitespace-nowrap" onClick={() => h.key !== "actions" && h.key !== "alarms" && (setSortKey(h.key), setSortDir(sortKey === h.key && sortDir === "asc" ? "desc" : "asc"))} aria-label={h.label} style={{ minWidth: 80 }}>
                    {h.label}{sortKey === h.key && (sortDir === "asc" ? " ▲" : " ▼")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((user, idx) => (
                <tr
                  key={user.id}
                  className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                  style={{ minHeight: 56 }}
                >
                  <td className="px-6 py-4 align-middle"><input type="checkbox" checked={selected.includes(user.id)} onChange={() => handleSelect(user.id)} aria-label={`Select user ${user.full_name || user.fullName}`} /></td>
                  <td className="px-6 py-4 align-middle cursor-pointer" onClick={() => openDetails(user)} tabIndex={0} aria-label={`View details for ${user.full_name || user.fullName}`}>{user.full_name || user.fullName}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{user.email}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{user.username}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <select className={`px-2 py-0.5 text-xs rounded ${statusClasses[user.status] || "bg-gray-600 text-white"}`} value={user.status} onChange={e => handleStatusChange(user.id, e.target.value)} aria-label="Change status" disabled={editIndex !== idx}>
                      {statuses.map(s => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <select className="bg-background text-primary rounded px-2 py-1 border border-surface focus:outline-none" value={user.role} onChange={e => handleRoleChange(user.id, e.target.value)} aria-label="Change role" disabled={editIndex !== idx}>
                      {roles.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    {getUserAlarms(user).length > 0 ? (
                      <button onClick={() => openAlarm(user)} className="flex items-center gap-1 text-error font-semibold" aria-label="View alarms">
                        <FiAlertTriangle />
                        <span className="text-sm font-semibold">{getUserAlarms(user).length}</span>
                      </button>
                    ) : (<span className="text-secondary">None</span>)}
                  </td>
                  <td className="px-6 py-4 flex gap-2 align-middle whitespace-nowrap">
                    {currentUser?.role === "Admin" && (
                      <>
                        <button className="hover:text-success" onClick={() => openForm(users.findIndex(u => u.id === user.id))} title="Edit" aria-label="Edit user"><FiEdit2 /></button>
                        <button className="hover:text-error" onClick={() => openDelete(users.findIndex(u => u.id === user.id))} title="Delete" aria-label="Delete user"><FiTrash2 /></button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* pagination */}
        <div className="flex justify-end mt-4 gap-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-background text-primary disabled:opacity-50 transition-colors duration-200" disabled={page === 1} aria-label="Previous page">&lt;</button>
          <span>{page}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-1 rounded bg-background text-primary disabled:opacity-50 transition-colors duration-200" disabled={page === pages} aria-label="Next page">&gt;</button>
        </div>
      </main>
      {/* Add/Edit Modal */}
      {showForm && currentUser?.role === "Admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <form onSubmit={handleFormSubmit} className="bg-surface p-6 rounded-xl shadow-2xl flex flex-col gap-4 min-w-[300px] border border-background transition-all duration-300 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-4">
              <input
                className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none flex-1"
                placeholder="Full Name"
                value={formData.fullName}
                onChange={e => setFormData(f => ({ ...f, fullName: e.target.value }))}
                required
              />
              <input
                className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none flex-1"
                placeholder="Email"
                value={formData.email}
                onChange={e => setFormData(f => ({ ...f, email: e.target.value }))}
                required
                type="email"
              />
              <input
                className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none flex-1"
                placeholder="Username"
                value={formData.username}
                onChange={e => setFormData(f => ({ ...f, username: e.target.value }))}
                required
              />
              {/* Password field only for add */}
              {editIndex === null && (
                <input
                  className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none flex-1"
                  placeholder="Password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData(f => ({ ...f, password: e.target.value }))}
                  required
                />
              )}
              <select
                className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none flex-1"
                value={formData.status}
                onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                required
              >
                {statuses.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <select
                className="bg-background text-primary rounded px-2 py-2 border border-surface focus:outline-none flex-1"
                value={formData.role}
                onChange={e => setFormData(f => ({ ...f, role: e.target.value }))}
                required
              >
                {roles.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {error && <div className="text-error">{error}</div>}
            <div className="flex gap-2 justify-end">
              <button type="button" className="px-4 py-2 bg-background text-primary border border-surface rounded hover:bg-surface transition-all duration-300" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit" className="px-4 py-2 bg-accent text-white rounded hover:bg-primary transition-all duration-200 font-semibold">{editIndex !== null ? 'Save' : 'Add'}</button>
            </div>
          </form>
        </div>
      )}
      {/* Delete Modal */}
      {showDelete && currentUser?.role === "Admin" && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-xl shadow-2xl flex flex-col gap-4 min-w-[300px] border border-background transition-all duration-300 animate-fade-in">
            <h3 className="text-lg font-bold mb-2">Delete User</h3>
            <div>Are you sure you want to delete this user?</div>
            <div className="flex gap-2 justify-end">
              <button className="px-4 py-2 bg-background text-primary border border-surface rounded hover:bg-surface transition-all duration-300" onClick={() => setShowDelete(false)}>Cancel</button>
              <button className="px-4 py-2 bg-error text-white rounded hover:bg-error/80 transition-all duration-200 font-semibold" onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </div>
      )}
      {/* Details Modal */}
      {showDetails && detailsUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-surface p-6 rounded-xl shadow-2xl flex flex-col gap-4 min-w-[300px] border border-background transition-all duration-300 animate-fade-in">
            <h3 className="text-lg font-bold mb-2">User Details</h3>
            <div className="font-bold text-lg">{detailsUser.full_name || detailsUser.fullName}</div>
            <div>Email: {detailsUser.email}</div>
            <div>Username: {detailsUser.username}</div>
            <div>Status: {detailsUser.status}</div>
            <div>Role: {detailsUser.role}</div>
            <div className="flex gap-2 justify-end"><button className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-all duration-300" onClick={() => setShowDetails(false)}>Close</button></div>
          </div>
        </div>
      )}
      {/* Alarm Modal */}
      {showAlarm && alarmUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60">
          <div className="bg-surface rounded-lg p-6 w-full max-w-md relative transition-all duration-300 animate-fade-in border border-background shadow-2xl">
            <button className="absolute top-2 right-2 text-secondary hover:text-error focus:outline-none" onClick={() => setShowAlarm(false)} aria-label="Close modal">×</button>
            <h2 className="text-xl font-bold mb-4">Alarms for {alarmUser.full_name || alarmUser.fullName}</h2>
            <ul className="space-y-2">{getUserAlarms(alarmUser).length > 0 ? (getUserAlarms(alarmUser).map((a, i) => (<li key={i} className="text-error flex items-center gap-2"><FiAlertTriangle /> {a}</li>))) : (<li className="text-secondary">No active alarms</li>)}</ul>
          </div>
        </div>
      )}
    </div>
  );
}
