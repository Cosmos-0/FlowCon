import React from "react";

export default function RecentEvents({ events = [] }) {
  return (
    <div className="bg-surface p-4 rounded-xl shadow-lg border border-background text-primary">
      <h2 className="text-xl font-bold mb-2 text-primary">Recent Events</h2>
      <ul className="divide-y divide-surface max-h-48 overflow-y-auto">
        {events.length === 0 ? (
          <li className="text-secondary text-sm py-2">No recent events</li>
        ) : (
          events.map((event, idx) => (
            <li key={idx} className="py-2 flex flex-col">
              <span className="font-medium text-primary">{event.title}</span>
              <span className="text-xs text-secondary">{event.time}</span>
              {event.description && <span className="text-xs text-secondary/80">{event.description}</span>}
            </li>
          ))
        )}
      </ul>
    </div>
  );
} 