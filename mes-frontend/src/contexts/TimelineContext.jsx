import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { fetchMachines, createStop, updateStop } from "../services/api";

const TimelineContext = createContext();

export function TimelineProvider({ children }) {
  const [timeline, setTimeline] = useState({});
  const pollingRef = useRef();
  const lastStatuses = useRef({});
  const openStopIds = useRef({});

  useEffect(() => {
    // Prevent multiple polling intervals in StrictMode or HMR using a window global
    if (typeof window !== "undefined") {
      if (window.__mesPollingStarted) return;
      window.__mesPollingStarted = true;
    }

    let isMounted = true;

    async function poll() {
      try {
        const machines = await fetchMachines();
        if (!isMounted) return;
        const now = Date.now();

        setTimeline(prev => {
          const updated = { ...prev };

          machines.forEach(({ id, status }) => {
            const prevStatus = lastStatuses.current[id];
            const segments = updated[id] || [];
            const lastSeg = segments[segments.length - 1];

            if (!lastSeg || lastSeg.status !== status) {
              segments.push({ start: now, end: now, status });
            } else {
              lastSeg.end = now;
            }
            updated[id] = segments;

            // RUNNING -> STOPPED
            if (
              prevStatus === "RUNNING" &&
              status === "STOPPED" &&
              !openStopIds.current[id]
            ) {
              openStopIds.current[id] = "PENDING";
              createStop({ machine_id: id, reason: null, start_time: new Date(now).toISOString(), end_time: null })
                .then(res => {
                  if (res?.id) openStopIds.current[id] = res.id;
                  else delete openStopIds.current[id];
                })
                .catch(() => delete openStopIds.current[id]);
            }

            // STOPPED -> RUNNING
            const stopId = openStopIds.current[id];
            if (
              prevStatus === "STOPPED" &&
              status === "RUNNING" &&
              stopId &&
              stopId !== "PENDING"
            ) {
              updateStop(stopId, { end_time: new Date(now).toISOString() }).catch(console.error);
              delete openStopIds.current[id];
            }

            lastStatuses.current[id] = status;
          });
          return { ...updated };
        });
      } catch (err) {
        console.error("Polling error:", err);
      }
    }

    // Initial and recurring polls
    poll();
    pollingRef.current = setInterval(poll, 5000);
    return () => {
      isMounted = false;
      clearInterval(pollingRef.current);
    };
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("mes_timeline");
    if (saved) setTimeline(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("mes_timeline", JSON.stringify(timeline));
  }, [timeline]);

  return <TimelineContext.Provider value={{ timeline }}>{children}</TimelineContext.Provider>;
}

export function useTimeline() {
  return useContext(TimelineContext);
}

export function calculateTRS(segments, windowStart, windowEnd) {
  if (!segments?.length) return 0;
  let runningMs = 0;
  for (const seg of segments) {
    const segStart = Math.max(seg.start, windowStart);
    const segEnd = Math.min(seg.end, windowEnd);
    if (seg.status === "RUNNING" && segEnd > segStart) runningMs += segEnd - segStart;
  }
  return ((runningMs / (windowEnd - windowStart)) * 100) || 0;
}

export function calculateMTBF(segments, windowStart, windowEnd) {
  if (!segments?.length) return 0;
  const durations = segments
    .filter(seg => seg.status === "RUNNING")
    .map(seg => Math.min(seg.end, windowEnd) - Math.max(seg.start, windowStart))
    .filter(duration => duration > 0);
  if (!durations.length) return 0;
  return durations.reduce((a, b) => a + b, 0) / durations.length / 1000;
}
