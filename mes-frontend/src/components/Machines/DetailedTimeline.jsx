import React from "react";
import { FiRefreshCw, FiHelpCircle } from "react-icons/fi";

// Define total minutes and row height
const TOTAL_MINUTES = 480;  // 8h shift
const ROW_HEIGHT = 32;      // px

// Map statuses to Tailwind background classes
const STATUS_CLASSES = {
  RUNNING: "bg-green-600",
  SPEED_LOSS: "bg-yellow-400",
  STOP: "bg-red-700",
  BREAK: "bg-gray-800"
};

export default function TimelineGrid({ rows }) {
  // helper to convert minutes to percent
  const pct = (m) => `${(m / TOTAL_MINUTES) * 100}%`;

  return (
    <div className="relative">
      {/* Tick marks at :15/:30/:45 */}
      <div className="absolute top-0 left-0 right-0 h-6">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className={`absolute top-0 bottom-0 w-px ${
              i === 0 ? "bg-gray-500" : "bg-gray-600"
            }`}
            style={{ left: pct(i * 120) }}
          />
        ))}
        {[15, 30, 45].map((m) => (
          <div
            key={m}
            className="absolute top-0 bottom-0 w-px bg-gray-600"
            style={{ left: pct(m) }}
          />
        ))}
      </div>

      {/* Rows container */}
      <div className="flex no-v-scroll overflow-x-auto">
        {/* Hour labels */}
        <div className="flex flex-col">
          {rows.map((row) => (
            <div
              key={row.id}
              className="h-8 flex items-center justify-end pr-2 text-gray-300 text-sm"
              style={{ height: ROW_HEIGHT }}
            >
              {row.id}
            </div>
          ))}
        </div>

        {/* Timeline + KPI */}
        <div className="relative flex-1">
          {/* Row segments */}
          {rows.map((row, ri) => (
            <div key={row.id} className="relative" style={{ height: ROW_HEIGHT }}>
              {/* Segment spans */}
              {row.segments.map((seg, si) => (
                <div
                  key={si}
                  className={`absolute top-1 bottom-1 ${STATUS_CLASSES[seg.status]} rounded`}
                  style={{
                    left: pct(seg.start),
                    width: pct(seg.end - seg.start)
                  }}
                  title={seg.label || seg.status}
                >
                  {seg.icon && (
                    <div className="absolute left-1 top-1 text-xs text-white">
                      {seg.icon}
                    </div>
                  )}
                  {seg.label && (
                    <div className="absolute inset-0 flex items-center justify-center text-xs text-white">
                      {seg.label}
                    </div>
                  )}
                </div>
              ))}

              {/* Markers */}
              {row.markers.map((m, mi) => (
                <div
                  key={mi}
                  className="absolute w-2 h-2 bg-black border-2 border-white rounded-full"
                  style={{
                    left: pct(m.time),
                    top: "50%",
                    transform: "translate(-50%, -50%)"
                  }}
                  title={m.tooltip}
                />
              ))}
            </div>
          ))}

          {/* KPI column */}
          <div className="absolute top-0 right-0 flex flex-col">
            {rows.map((row, ri) => (
              <div
                key={row.id}
                className={`h-8 flex items-center justify-end pr-2 text-sm ${
                  ri % 2 === 1 ? "bg-gray-800" : ""
                }`}
                style={{ height: ROW_HEIGHT }}
              >
                <span className={row.kpiColor}>{row.kpi}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
