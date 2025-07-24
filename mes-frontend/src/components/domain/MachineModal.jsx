import React from "react";
import { FiX } from "react-icons/fi";

export default function MachineModal({ open, onClose, onSave, machine, onChange, isEdit, lines = [], products = [] }) {
  if (!open) return null;
  // Defensive: ensure machine is always a valid object
  const safeMachine = machine || { id: "", name: "", status: "RUNNING", line_id: "", productId: "" };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm transition-all duration-500 animate-fade-in">
      <div className="bg-gray-800 rounded-2xl p-6 w-full max-w-md relative shadow-2xl transition-all duration-500 animate-slide-in">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-red-400 transition-colors duration-200"
          onClick={onClose}
          aria-label="Close modal"
        >
          <FiX size={24} />
        </button>
        <h2 className="text-xl font-bold mb-4">{isEdit ? "Edit Machine" : "Add Machine"}</h2>
        <form
          onSubmit={e => {
            e.preventDefault();
            onSave();
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-gray-300 mb-1">Machine ID</label>
            <input
              name="id"
              value={safeMachine.id}
              onChange={e => onChange(m => ({ ...m, id: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
              required
              disabled={isEdit}
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Name</label>
            <input
              name="name"
              value={safeMachine.name}
              onChange={e => onChange(m => ({ ...m, name: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
              required
            />
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Status</label>
            <select
              name="status"
              value={safeMachine.status}
              onChange={e => onChange(m => ({ ...m, status: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
              required
            >
              <option value="RUNNING">RUNNING</option>
              <option value="STOPPED">STOPPED</option>
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Production Line</label>
            <select
              name="line_id"
              value={safeMachine.line_id || ""}
              onChange={e => onChange(m => ({ ...m, line_id: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
              required
            >
              <option value="">-- Select a Line --</option>
              {lines.map(line => (
                <option key={line.id} value={line.id}>{line.name} (ID: {line.id})</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Product</label>
            <select
              name="productId"
              value={safeMachine.productId || ""}
              onChange={e => onChange(m => ({ ...m, productId: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
              required
            >
              <option value="">-- Select a Product --</option>
              {products.map(product => (
                <option key={product.id} value={product.id}>{product.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-gray-300 mb-1">Counter Type</label>
            <select
              name="counter_type"
              value={safeMachine.counter_type || 'status'}
              onChange={e => onChange(m => ({ ...m, counter_type: e.target.value }))}
              className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
              required
            >
              <option value="status">Status</option>
              <option value="piece">Piece</option>
            </select>
          </div>
          {safeMachine.counter_type === 'piece' && (
            <div>
              <label className="block text-gray-300 mb-1">Average Pieces Per Second</label>
              <input
                name="avg_pieces_per_sec"
                type="number"
                step="0.0001"
                min="0"
                value={safeMachine.avg_pieces_per_sec || ''}
                onChange={e => onChange(m => ({ ...m, avg_pieces_per_sec: e.target.value }))}
                className="w-full px-3 py-2 rounded bg-gray-700 text-white focus:outline-none"
                required
              />
            </div>
          )}
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 transition-colors duration-200"
              onClick={onClose}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 rounded hover:bg-green-500 transition-colors duration-200 shadow-md"
            >
              {isEdit ? "Save" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 