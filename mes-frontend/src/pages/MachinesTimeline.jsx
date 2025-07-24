import React, { useEffect, useState, useRef } from "react";
import { fetchProductionLines, fetchShifts, fetchMachines, fetchUsers } from "../services/api";
import { useLocation } from "react-router-dom";
import { useNotifications } from "../contexts/NotificationContext";
import { useTimeline, calculateTRS, calculateMTBF } from "../contexts/TimelineContext";

/*
The conversation covers a comprehensive development and debugging process for a manufacturing management web application (MES) with both frontend (React) and backend (FastAPI/PostgreSQL) components. Here's a detailed summary:

1. **User Table and Profile Management**
   - The user requested the removal of the avatar holder from the users table and details modal, which was implemented.
   - An issue was found where the full name field for users was not persisting after refresh. Investigation revealed the backend was not handling the `full_name` field. The backend and frontend were updated to use `full_name` consistently, and the frontend was updated to map `fullName` to `full_name`.
   - The settings page was updated to pre-fill all fields (except password) with the current user's information, using `user.full_name`, `user.username`, and `user.email`.
   - The backend settings/profile update endpoint was improved to only update fields that are present and non-empty in the request.
   - The login endpoint was updated to return `email` and `full_name` so the frontend could pre-fill the settings form.
   - Error handling was improved in the backend user update endpoint to avoid KeyErrors when fields like `password_hash` or `role` are missing.
   - The frontend was updated to display the operator's full name in the shifts table, using a helper to look up the user by ID and show their `full_name`, `username`, or `email`.

2. **Machines Table and Timeline**
   - A new field `counter_type` was added to the machines table (either `piece` or `status`), with corresponding backend and frontend support. The frontend form and table were updated to allow selection and display of this field.
   - An `avg_pieces_per_sec` field was added for machines with a `piece` counter, with conditional display in the form and table.
   - The backend was updated to handle these new fields in both creation and update endpoints.
   - The OEE field was added to the machines table and handled by the backend.
   - The frontend machines table layout was fixed to ensure all columns are aligned and readable.

3. **Shifts Table Enhancements**
   - A `shift_quantity` field was added to the shifts table, with backend and frontend support for adding, editing, and displaying this value.
   - The form for editing a shift was updated to pre-fill all fields, including `shift_quantity`.
   - `operator` and `duration` fields were added to the shifts table, with backend and frontend support.
   - The frontend was updated to display the operator's full name in the shifts table, fixing type mismatches in ID comparison.

4. **Machines Timeline Page**
   - The timeline page was implemented to show machine statuses over time for a selected line and shift, with live polling and a visual timeline.
   - The timeline was improved to:
     - Always span from the shift's start to end time.
     - Show time tick indicators aligned with the timeline.
     - Render segments and indicators from left (start) to right (end).
     - Be visually wider and more readable.
     - Include hover tooltips on timeline segments.
   - KPI cards for TRS, MTBF, and OEE were added to the header.
   - The timeline was refactored to ensure it updates correctly when the shift or line changes, and segments are clipped to the shift window.
   - The shift quantity for the current shift is displayed in the header.
   - The "Current Batch" section was explained as a placeholder for real-time batch tracking.

5. **Navigation and State Passing**
   - When viewing a line, the selected line is passed to the timeline page and auto-selected.
   - The timeline page auto-selects the current shift based on the current time, or picks one randomly if none match.

6. **General Improvements and Bug Fixes**
   - The backend and frontend were kept in sync for all new fields and logic.
   - Error handling and data consistency were improved throughout.
   - The assistant provided detailed code edits, explanations, and best practices for UI/UX, data loading, and authentication.

Overall, the conversation demonstrates a thorough, iterative process of feature development, bug fixing, and UI/UX refinement for a complex MES dashboard application.
*/

// Helper to get current time in seconds since shift start
function getSecondsSince(start) {
  return Math.floor((Date.now() - new Date(start).getTime()) / 1000);
}

function formatTime(date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Helper: get fixed shift windows
function getShiftWindow(shift) {
  // For testing: always return a 1-hour window starting from now
  const now = new Date();
  const start = new Date(now);
  const end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour later
  return { start, end };
}

export default function MachinesTimeline({ menuOpen, setMenuOpen, activeNav, setActiveNav, toggleMenu }) {
  const location = useLocation();
  const [lines, setLines] = useState([]);
  const [shifts, setShifts] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedLine, setSelectedLine] = useState(null);
  const [selectedShift, setSelectedShift] = useState(null);
  const [machines, setMachines] = useState([]);
  const { timeline } = useTimeline();
  const [now, setNow] = useState(new Date());
  const [hoveredSegment, setHoveredSegment] = useState(null);
  const { addNotification } = useNotifications();
  const [selectedMachineId, setSelectedMachineId] = useState(null);

  // Always use the current hour for the timeline window
  const nowDate = now;
  const shiftStart = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), nowDate.getHours(), 0, 0, 0);
  const shiftEnd = new Date(nowDate.getFullYear(), nowDate.getMonth(), nowDate.getDate(), nowDate.getHours() + 1, 0, 0, 0);
  const shiftDuration = (shiftEnd - shiftStart) / 1000;

  // Timeline ticks (every 15 min)
  const tickInterval = 15 * 60; // 15 min in seconds
  const numTicks = Math.ceil(shiftDuration / tickInterval) + 1;
  const ticks = Array.from({ length: numTicks }, (_, i) => {
    const t = new Date(shiftStart.getTime() + i * tickInterval * 1000);
    return { label: formatTime(t), pos: (i * tickInterval) / shiftDuration };
  });

  // Digital clock
  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  // Fetch lines and shifts on mount
  useEffect(() => {
    fetchProductionLines().then(setLines);
    fetchShifts().then(setShifts);
  }, []);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers().then(setUsers);
  }, []);

  // When selectedLine or selectedShift changes, fetch its machines and reset timeline
  useEffect(() => {
    if (!selectedLine) return;
    fetchMachines().then(all => {
      const filtered = all.filter(m => m.line_id === selectedLine.id);
      setMachines(filtered);
    });
  }, [selectedLine, selectedShift]);

  // Auto-select line if passed via navigation state
  useEffect(() => {
    if (location.state && location.state.line) {
      setSelectedLine(location.state.line);
    }
  }, [location.state]);

  // Auto-select shift based on current time or pick one randomly if none matches
  useEffect(() => {
    if (shifts.length > 0 && !selectedShift) {
      const now = new Date();
      const hour = now.getHours();
      let found = null;
      if (hour >= 8 && hour < 16) {
        found = shifts.find(s => s.name === 'Shift 1' || s.id === 1);
      } else if (hour >= 16 || hour < 0) {
        found = shifts.find(s => s.name === 'Shift 2' || s.id === 2);
      } else {
        found = shifts.find(s => s.name === 'Shift 3' || s.id === 3);
      }
      setSelectedShift(found || shifts[0]);
    }
  }, [shifts, selectedShift]);

  // Find operator name for selected line
  let operatorName = "-";
  if (selectedLine && selectedLine.assigned_operator_id) {
    const op = users.find(u => u.id === selectedLine.assigned_operator_id);
    operatorName = op ? op.name || op.username || op.email : "-";
  }

  // WebSocket for stop notifications
  useEffect(() => {
    const ws = new WebSocket("ws://localhost:8000/ws/notifications"); // Change host if needed
    ws.onmessage = (event) => {
      console.log("WebSocket message:", event.data);
      try {
        const data = JSON.parse(event.data);
        if (data.type === "stop") {
          addNotification({
            message: `Machine ${data.machine_id} has stopped!`,
            machineId: data.machine_id,
            stopId: data.stop_id,
            type: "stop"
          });
        }
      } catch (e) {}
    };
    return () => ws.close();
  }, [addNotification]);

  // Determine which machine to show KPIs for
  const machineOptions = machines;
  const selectedMachine = machineOptions.find(m => m.id === selectedMachineId);
  // Calculate TRS and MTBF for selected machine in current shift window
  let trs = 0, mtbf = 0;
  if (selectedMachine && timeline[selectedMachine.id]) {
    trs = calculateTRS(timeline[selectedMachine.id], shiftStart.getTime(), shiftEnd.getTime());
    mtbf = calculateMTBF(timeline[selectedMachine.id], shiftStart.getTime(), shiftEnd.getTime());
  }

  useEffect(() => {
    if (
      machines.length > 0 &&
      (!selectedMachineId || !machines.some(m => m.id === selectedMachineId))
    ) {
      setSelectedMachineId(machines[0].id);
    }
    // Only depend on machines!
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [machines]);

  return (
    <div className="flex flex-col min-h-screen bg-background text-primary px-2 sm:px-4 md:px-8 py-4">
      {/* HEADER */}
      <header className="flex-none bg-surface rounded-xl shadow-lg p-6 mb-6 flex flex-col sm:flex-row items-center justify-between gap-4 sticky top-0 z-20 border-b border-surface">
        <div className="flex items-center gap-4 w-full sm:w-auto">
          <button onClick={toggleMenu} className="text-primary hover:text-accent transition-colors" aria-label="Open menu">
            <img src="/flowcon.png" alt="Open menu" className="w-8 h-8" />
          </button>
          <h1 className="text-3xl font-extrabold text-primary tracking-tight">Machines Timeline</h1>
        </div>
        <div className="flex-1" />
      </header>
      {/* MAIN CONTENT */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {/* Controls and KPIs */}
        <div className="bg-surface rounded-xl shadow-lg border border-background p-6 mb-8">
          {/* Controls and KPIs from old header section */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1 flex flex-col gap-2">
              <div className="flex items-center gap-4 flex-wrap">
                <label>Line:</label>
                <select
                  value={selectedLine?.id || ""}
                  onChange={e => setSelectedLine(lines.find(l => l.id === Number(e.target.value)))}
                  className="bg-gray-800 text-white px-2 py-1 rounded transition-colors duration-200 focus:ring-2 focus:ring-green-400"
                >
                  <option value="">Select a line</option>
                  {lines.map(line => (
                    <option key={line.id} value={line.id}>{line.name}</option>
                  ))}
                </select>
                <label>Shift:</label>
                <select
                  value={selectedShift?.id || ""}
                  onChange={e => setSelectedShift(shifts.find(s => s.id === Number(e.target.value)))}
                  className="bg-gray-800 text-white px-2 py-1 rounded transition-colors duration-200 focus:ring-2 focus:ring-green-400"
                >
                  {shifts.map(shift => (
                    <option key={shift.id} value={shift.id}>{shift.name || shift.id}</option>
                  ))}
                </select>
              </div>
              {selectedLine && (
                <div className="flex flex-wrap items-center gap-8 mt-2">
                  {/* KPI Cards */}
                  <div className="flex gap-6 mb-4 flex-wrap">
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center min-w-[120px] shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl animate-fade-in">
                      <div className="text-xs text-gray-400">TRS</div>
                      <div className="text-2xl font-bold text-blue-400">{selectedMachine ? trs.toFixed(1) + '%' : '-'}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center min-w-[120px] shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl animate-fade-in">
                      <div className="text-xs text-gray-400">MTBF</div>
                      <div className="text-2xl font-bold text-yellow-400">{selectedMachine ? (mtbf > 3600 ? `${Math.floor(mtbf/3600)}h ${Math.floor((mtbf%3600)/60)}m` : mtbf > 60 ? `${Math.floor(mtbf/60)}m ${Math.floor(mtbf%60)}s` : `${Math.floor(mtbf)}s`) : '-'}</div>
                    </div>
                    <div className="bg-gray-800 rounded-lg p-4 flex flex-col items-center min-w-[120px] shadow-lg transition-all duration-300 ease-in-out hover:shadow-2xl animate-fade-in">
                      <div className="text-xs text-gray-400">OEE</div>
                      <div className="text-2xl font-bold text-green-400">{selectedMachine && selectedMachine.oee !== undefined ? selectedMachine.oee + "%" : "-"}</div>
                    </div>
                  </div>
                  {/* Machine selector */}
                  <div>
                    <div className="text-lg font-semibold">Machine</div>
                    <select
                      value={selectedMachineId || ''}
                      onChange={e => {
                        const val = e.target.value;
                        // Find the machine with matching id (string or number)
                        const match = machines.find(m => String(m.id) === val);
                        setSelectedMachineId(match ? match.id : val);
                      }}
                      className="bg-gray-800 text-white px-2 py-1 rounded transition-colors duration-200 focus:ring-2 focus:ring-green-400"
                    >
                      {machineOptions.map(m => (
                        <option key={m.id} value={m.id}>{m.name || m.id}</option>
                      ))}
                    </select>
                  </div>
                  {/* End KPI Cards and selector */}
                  <div>
                    <div className="text-lg font-semibold">Shift Quantity</div>
                    <div className="text-2xl">{selectedShift?.shift_quantity ?? '-'} pcs</div>
                  </div>
                  <div>
                    <div className="text-lg font-semibold">Current Batch</div>
                    {(() => {
                      // Calculate produced pieces and progress
                      let produced = 0;
                      const goal = selectedShift?.shift_quantity || 0;
                      const shiftElapsedSeconds = (now - shiftStart) / 1000;
                      if (selectedMachine) {
                        if (selectedMachine.counter_type === "status") {
                          produced = Math.floor(shiftElapsedSeconds); // 1 piece/sec
                        } else if (selectedMachine.counter_type === "piece") {
                          produced = Math.floor(shiftElapsedSeconds * (selectedMachine.avg_pieces_per_sec || 0));
                        }
                      }
                      const progress = goal > 0 ? Math.min(100, (produced / goal) * 100) : 0;
                      return (
                        <div className="flex items-center gap-2">
                          <span className="font-mono">EDL00X</span>
                          <div className="w-40 h-2 bg-gray-700 rounded overflow-hidden">
                            <div className="bg-green-500 h-full" style={{ width: `${progress}%` }} />
                          </div>
                          <span className="text-xs text-gray-400">{produced}/{goal}</span>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}
            </div>
            <div className="flex flex-col items-end gap-2">
              {selectedShift && (
                <div className="text-lg font-semibold">{selectedShift.name || selectedShift.id}</div>
              )}
              <div className="text-4xl font-mono text-green-400">{formatTime(now)}</div>
            </div>
          </div>
        </div>
        {/* Timeline Section */}
        <div className="flex-1 overflow-y-auto p-6 bg-black overflow-x-auto rounded-xl shadow-lg transition-all duration-500 animate-fade-in">
          {/* X-axis time ticks */}
          <div className="relative mb-2 h-6 w-full flex items-center">
            <div className="w-28 pr-4" /> {/* Spacer for machine label width */}
            <div className="relative flex-1 h-6">
              {ticks.map((tick, i) => (
                <div
                  key={i}
                  className="absolute top-0 text-xs text-gray-400 font-mono transition-all duration-300"
                  style={{ left: `${tick.pos * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {tick.label}
                </div>
              ))}
            </div>
          </div>
          {/* Timeline grid */}
          <div>
            {machines.map(machine => (
              <div key={machine.id} className="flex items-center mb-6 transition-all duration-300 animate-fade-in">
                {/* Machine label */}
                <div className="w-28 text-right pr-4 text-sm text-gray-300 font-mono">{machine.name || machine.id}</div>
                {/* Timeline bar */}
                <div className="relative flex-1 h-6 bg-gray-900 rounded-2xl overflow-visible shadow-lg border border-gray-800 min-w-[400px] transition-all duration-300">
                  {/* Markers (vertical lines) */}
                  {ticks.map((tick, i) => (
                    <div
                      key={i}
                      className="absolute top-0 h-6 border-l border-gray-700"
                      style={{ left: `${tick.pos * 100}%` }}
                    />
                  ))}
                  {/* White dots at regular intervals */}
                  {ticks.map((tick, i) => (
                    <div
                      key={i}
                      className="absolute top-1/2 -translate-y-1/2"
                      style={{ left: `${tick.pos * 100}%` }}
                    >
                      <div className="w-3 h-3 bg-white rounded-full border border-gray-700 shadow transition-all duration-300" />
                    </div>
                  ))}
                  {/* Timeline segments with indicators and hover */}
                  {(timeline[machine.id]?.slice().sort((a, b) => a.start - b.start) || []).map((seg, i) => {
                    const total = shiftEnd.getTime() - shiftStart.getTime(); // ms
                    const segStart = Math.max(seg.start - shiftStart.getTime(), 0); // ms
                    const segEnd = Math.min(seg.end - shiftStart.getTime(), total); // ms
                    const left = (segStart / total) * 100;
                    const width = ((segEnd - segStart) / total) * 100;
                    const durationSec = Math.round((seg.end - seg.start) / 1000);
                    let color = seg.status === "RUNNING" ? "bg-green-600" : seg.status === "STOPPED" ? "bg-red-600" : "bg-yellow-400";
                    return (
                      <React.Fragment key={i}>
                        <div
                          className={`absolute top-0 h-6 rounded-2xl shadow-md ${color} transition-all duration-500 animate-fade-in`}
                          style={{ left: `${left}%`, width: `${width}%` }}
                          onMouseEnter={() => setHoveredSegment({ machineId: machine.id, segIdx: i })}
                          onMouseLeave={() => setHoveredSegment(null)}
                        />
                        {/* Tooltip on hover */}
                        {hoveredSegment && hoveredSegment.machineId === machine.id && hoveredSegment.segIdx === i && (
                          <div
                            className="absolute z-50 px-3 py-2 bg-gray-900 text-white text-xs rounded shadow-lg border border-gray-700 transition-all duration-300 animate-fade-in"
                            style={{ left: `${left}%`, top: '-2.5rem', minWidth: 120 }}
                          >
                            <div>Status: <span className="font-bold">{seg.status}</span></div>
                            <div>Start: {new Date(seg.start).toLocaleTimeString()}</div>
                            <div>End: {new Date(seg.end).toLocaleTimeString()}</div>
                            <div>Duration: {durationSec}s</div>
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Footer/Legend */}
        <div className="bg-gray-900 p-4 border-t border-gray-800 flex items-center gap-8 text-sm rounded-b-xl mt-4">
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-green-600 inline-block rounded" /> Running
          </div>
          <div className="flex items-center gap-2">
            <span className="w-4 h-4 bg-red-600 inline-block rounded" /> Stopped
          </div>
          <div className="ml-auto text-gray-400">Operator: {operatorName}</div>
        </div>
      </main>
    </div>
  );
}
