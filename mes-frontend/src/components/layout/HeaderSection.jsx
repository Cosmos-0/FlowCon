import React from "react";
import { FiMenu, FiMonitor, FiInfo } from "react-icons/fi";

export default function HeaderSection({
  lineName = "Evocon production line 1",
  shiftQuantity = 242,
  oee = 73,
  batch = {
    id: "EDL00X",
    name: "Evocon device",
    current: 241,
    target: 500,
    elapsed: "5h 10min"
  },
  history = [
    { code: "MAN007", label: "Evocon instruction manual", qty: "88/0 pcs" },
    { code: "EDLS00Y", label: "Evocon wireless device",    qty: "2 556/500 pcs" }
  ],
  onMenuClick
}) {
  const progress = Math.min(100, (batch.current / batch.target) * 100);

  return (
    <div className="bg-surface text-primary p-6 space-y-6 rounded-xl shadow-lg border border-background">
      <div className="flex items-center space-x-4">
        <button onClick={onMenuClick} className="text-primary hover:text-accent transition-colors focus:outline-none" aria-label="Open menu">
          <FiMenu size={24} />
        </button>
        <FiMonitor size={20} className="text-secondary" />
        <h1 className="text-2xl font-extrabold text-primary tracking-tight">{lineName}</h1>
        <div className="ml-auto text-success font-bold text-3xl">{oee}%</div>
      </div>

      <div className="flex items-baseline space-x-2">
        <div className="text-secondary uppercase text-xs">shift quantity</div>
        <div className="text-4xl font-bold text-primary">{shiftQuantity}</div>
        <div className="text-secondary">pcs</div>
      </div>

      <div className="flex items-center space-x-4">
        <div className="text-secondary uppercase text-xs">current batch</div>
        <div className="font-medium text-primary">{batch.id}</div>
        <div className="flex-1 bg-background h-2 rounded-full overflow-hidden border border-surface">
          <div
            className="bg-success h-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex items-center space-x-1 text-secondary text-sm">
          <span>{batch.elapsed}</span>
          <FiInfo />
        </div>
        <div className="font-semibold text-sm text-primary">
          {batch.current}/{batch.target}
        </div>
      </div>

      <div className="flex items-center space-x-8 text-secondary text-sm">
        <button className="font-medium border-b-2 border-accent text-primary">Previous</button>
        <button className="font-medium text-secondary/70">Next</button>
      </div>

      <div className="grid grid-cols-3 gap-4 text-secondary text-sm">
        {history.map((h, i) => (
          <div key={i} className="flex justify-between items-center">
            <div>
              <div className="font-medium text-primary">{h.code}</div>
              <div>{h.label}</div>
            </div>
            <div className="text-right">{h.qty}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
