import React, { useState, useEffect } from "react";
import { FiPackage, FiEdit, FiTrash2, FiPlus, FiMenu } from "react-icons/fi";
import { fetchProducts, createProduct, updateProduct, deleteProduct } from "../services/api";
import { useUser } from "../contexts/UserContext";

export default function ProductsPage({
  menuOpen,
  setMenuOpen,
  activeNav,
  setActiveNav,
  toggleMenu,
}) {
  const { user: currentUser } = useUser();
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [formData, setFormData] = useState({ id: '', name: '', description: '', status: 'Active' });
  const [sortKey, setSortKey] = useState("id");
  const [sortDir, setSortDir] = useState("asc");
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [statusFilter, setStatusFilter] = useState("");
  const [selected, setSelected] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Sorting
  const sorted = [...products].sort((a, b) => {
    return sortDir === "asc"
      ? String(a[sortKey]).localeCompare(String(b[sortKey]))
      : String(b[sortKey]).localeCompare(String(a[sortKey]));
  });

  // Filtering
  const filtered = sorted.filter(p =>
    (statusFilter ? p.status === statusFilter : true)
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
    else setSelected(paginated.map((p) => p.id));
  };
  const handleBulkDelete = () => {
    if (window.confirm("Delete selected products?")) {
      setProducts((ps) => ps.filter((p) => !selected.includes(p.id)));
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
      setFormData(products[index]);
    } else {
      setFormData({ id: '', name: '', description: '', status: 'Active' });
    }
    setShowForm(true);
  };

  // Handle form submit
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (currentUser?.role !== "Admin") { alert("You do not have permission to perform this action."); return; }
      if (editIndex !== null) {
        const id = products[editIndex].id;
        await updateProduct(id, formData);
        setProducts(products => products.map((product, i) => i === editIndex ? { ...formData, id } : product));
      } else {
        const res = await createProduct(formData);
        setProducts(products => [...products, { ...formData, id: res.id }]);
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
    if (window.confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        const id = products[index].id;
        await deleteProduct(id);
        setProducts(products => products.filter((_, i) => i !== index));
      } catch (err) {
        setError(err.message);
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchProducts()
      .then(setProducts)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (!products.length && loading) return <div>Loading...</div>;
  if (error) return <div className="text-red-500">Error: {error}</div>;

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Products</h1>
        </div>
        {currentUser?.role === "Admin" && (
          <button
            className="flex items-center gap-2 bg-accent text-white hover:bg-primary px-4 py-2 rounded transition-colors duration-200 font-semibold shadow-md"
            onClick={() => openForm()}
          >
            <FiPlus className="mr-1" /> Add Product
          </button>
        )}
      </header>
      {/* Main content */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        <h2 className="text-2xl font-bold mb-6 text-primary">All Products</h2>
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
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
        {selected.length > 0 && (
          <div className="bg-surface px-4 py-2 flex items-center gap-2 mb-2 rounded shadow transition-all duration-200 animate-fade-in border border-background">
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
                    aria-label="Select all products"
                  />
                </th>
                {[
                  { key: "id", label: "Product ID" },
                  { key: "name", label: "Name" },
                  { key: "description", label: "Description" },
                  { key: "status", label: "Status" },
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
              {paginated.map((product, idx) => (
                <tr
                  key={product.id}
                  className={`transition-colors duration-200 ${idx % 2 === 0 ? 'bg-background/90' : 'bg-background'} hover:bg-surface border-b border-surface min-h-[56px]`}
                  style={{ minHeight: 56 }}
                >
                  <td className="px-6 py-4 align-middle">
                    <input
                      type="checkbox"
                      checked={selected.includes(product.id)}
                      onChange={() => handleSelect(product.id)}
                      aria-label={`Select product ${product.id}`}
                    />
                  </td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{product.id}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{product.name}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">{product.description}</td>
                  <td className="px-6 py-4 align-middle whitespace-nowrap">
                    <span className={`inline-block px-3 py-1 text-xs font-semibold rounded-full ${product.status === "Active" ? "bg-success/90 text-white" : "bg-error/90 text-white"}`}
                      style={{ minWidth: 70, textAlign: 'center' }}>
                      {product.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 flex gap-2 align-middle whitespace-nowrap">
                    {currentUser?.role === "Admin" && (
                      <>
                        <button className="text-yellow-400" onClick={() => openForm(idx)} title="Edit" aria-label="Edit product">
                          <FiEdit />
                        </button>
                        <button className="text-red-400" onClick={() => handleDelete(idx)} title="Delete" aria-label="Delete product">
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
            {currentUser?.role === "Admin" && (
              <form
                className="bg-surface p-6 rounded shadow-lg flex flex-col gap-4 min-w-[300px] transition-all duration-300 animate-fade-in"
                onSubmit={handleFormSubmit}
              >
                <h3 className="text-lg font-bold mb-2">{editIndex !== null ? 'Edit' : 'Add'} Product</h3>
                <div className="flex flex-col gap-4">
                  <input
                    className="bg-background text-primary rounded px-2 py-1"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={e => setFormData(f => ({ ...f, name: e.target.value }))}
                    required
                  />
                  <input
                    className="bg-background text-primary rounded px-2 py-1"
                    placeholder="Description"
                    value={formData.description}
                    onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
                  />
                  <select
                    className="bg-background text-primary rounded px-2 py-1"
                    value={formData.status}
                    onChange={e => setFormData(f => ({ ...f, status: e.target.value }))}
                    required
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
                <div className="mt-4 flex gap-2">
                  <button type="submit" className="bg-success px-4 py-2 rounded text-white transition-colors duration-200">Save</button>
                  <button type="button" className="bg-gray-600 px-4 py-2 rounded text-white transition-colors duration-200" onClick={() => setShowForm(false)}>Cancel</button>
                </div>
              </form>
            )}
          </div>
        )}
      </main>
    </div>
  );
} 