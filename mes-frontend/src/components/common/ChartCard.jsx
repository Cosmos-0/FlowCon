import React from "react";

export default function ChartCard({ title, subtitle, children, actions }) {
  return (
    <div className="bg-surface p-4 rounded-xl shadow-lg border border-background text-primary">
      <div className="flex justify-between items-center mb-2">
        <div>
          <h2 className="text-xl font-bold text-primary">{title}</h2>
          {subtitle && <div className="text-secondary text-sm">{subtitle}</div>}
        </div>
        {actions ? actions : <button className="text-secondary hover:text-accent" aria-label="More actions">⋯</button>}
      </div>
      <div className="h-72">{children}</div>
    </div>
  );
} 