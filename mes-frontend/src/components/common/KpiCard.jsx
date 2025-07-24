import React from "react";

export default function KpiCard({ label, value, unit, icon, color = "text-green-400", className = "" }) {
  return (
    <div className={`bg-surface rounded-lg p-4 shadow flex flex-col items-center justify-center space-y-2 border border-background ${className || ''}`}>
      <div className={`text-3xl ${color}`}>{icon}</div>
      <div className="text-3xl font-bold text-primary">{value}{unit && <span className="text-base font-normal ml-1">{unit}</span>}</div>
      <div className="text-sm text-secondary font-semibold uppercase tracking-wide">{label}</div>
    </div>
  );
} 