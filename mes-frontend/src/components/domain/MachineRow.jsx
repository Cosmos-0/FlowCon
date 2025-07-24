import React from "react";
import { FiInfo, FiEdit2, FiTrash2, FiAlertTriangle, FiBell } from "react-icons/fi";

function isMaintenanceDue(nextDate) {
  if (!nextDate) return false;
  const now = new Date();
  const next = new Date(nextDate);
  const diff = (next - now) / (1000 * 60 * 60 * 24);
  return diff < 7; // due within 7 days
}

export default function MachineRow({ machine, onInfo, onEdit, onDelete, onViewAlarms }) {
  const maintenanceWarning = isMaintenanceDue(machine.nextMaintenance);
  return (
    <tr className="transition-all duration-200 hover:bg-gray-900 rounded-lg shadow-sm">
      <td className="px-4 py-3 align-middle text-sm">{machine.id}</td>
      <td className="px-4 py-3 align-middle text-sm">{machine.name}</td>
      <td className="px-4 py-3 align-middle text-sm">
        <span className={`px-2 py-0.5 text-xs rounded ${
          machine.status === "RUNNING" ? "bg-green-600" : "bg-red-600"
        }`}>
          {machine.status}
        </span>
      </td>
      <td className="px-4 py-3 align-middle text-sm">{machine.oee}</td>
      <td className="px-4 py-3 align-middle text-sm">{machine.lastMaintenance}</td>
      <td className="px-4 py-3 align-middle text-sm">
        <span className={maintenanceWarning ? "text-yellow-400 font-semibold" : "text-white"}>
          {machine.nextMaintenance}
          {maintenanceWarning && <FiAlertTriangle className="inline ml-1 align-text-bottom" title="Maintenance due soon" />}
        </span>
      </td>
      <td className="px-4 py-3 align-middle text-sm">
        {machine.alarms && machine.alarms.length > 0 ? (
          <button onClick={() => onViewAlarms(machine)} className="flex items-center gap-1 text-red-400 transition-colors duration-200 hover:text-red-600" aria-label="View alarms">
            <FiBell />
            <span className="text-sm">{machine.alarms.length}</span>
          </button>
        ) : (
          <span className="text-gray-500">None</span>
        )}
      </td>
      <td className="px-4 py-3 align-middle text-sm">{machine.workOrder || <span className="text-gray-500">-</span>}</td>
      <td className="px-4 py-3 align-middle flex space-x-3 text-sm">
        <button onClick={() => onInfo(machine.id)} className="hover:text-blue-400 transition-colors duration-200" aria-label="View details">
          <FiInfo />
        </button>
        <button onClick={() => onEdit(machine.id)} className="hover:text-green-400 transition-colors duration-200" aria-label="Edit machine">
          <FiEdit2 />
        </button>
        <button onClick={() => onDelete(machine.id)} className="hover:text-red-400 transition-colors duration-200" aria-label="Delete machine">
          <FiTrash2 />
        </button>
      </td>
    </tr>
  );
}
