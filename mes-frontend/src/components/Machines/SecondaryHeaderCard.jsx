// src/components/SecondaryHeaderCard.jsx
import React, { useState, useEffect } from "react";
import { FiChevronLeft, FiChevronRight, FiChevronsRight, FiCalendar } from "react-icons/fi";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const sampleSpeed = [
  { time: "00:00", value: 0.5 },
  { time: "06:00", value: 0.7 },
  { time: "09:00", value: 1.0 },
  { time: "12:00", value: 0.4 },
  { time: "14:00", value: 0.9 },
];
const sampleOee = [
  { time: "00:00", value: 0.6 },
  { time: "06:00", value: 0.8 },
  { time: "09:00", value: 0.9 },
  { time: "12:00", value: 0.7 },
  { time: "14:00", value: 0.85 },
];

const SecondaryHeaderCard = ({
  shiftLabel = "Tuesday 28.09.2021 – First shift"
}) => {
  const [now, setNow] = useState(new Date());
  const [tab, setTab] = useState("Speed");

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const data = tab === "Speed" ? sampleSpeed : sampleOee;
  const lineColor = tab === "Speed" ? "#facc15" : "#22c55e";

  return (
    <div className="bg-gray-900 text-white p-4 rounded flex items-center space-x-6">
      {/* Shift nav & title */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center space-x-2 text-gray-400">
          <FiCalendar />
          <span className="uppercase text-sm">shift</span>
          <FiChevronLeft className="cursor-pointer" />
          <FiChevronsRight className="cursor-pointer" />
          <FiChevronRight className="cursor-pointer" />
        </div>
        <div className="text-lg font-medium">{shiftLabel}</div>
        {/* Tabs */}
        <div className="flex space-x-4 mt-2">
          {["Speed", "OEE"].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-sm pb-1 ${
                tab === t
                  ? "text-white border-b-2 border-green-500"
                  : "text-gray-500"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Mini-chart */}
      <div className="flex-1 bg-gray-800 p-2 rounded">
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={data}>
            <XAxis dataKey="time" stroke="#6b7280" tick={{ fontSize: 10 }} />
            <YAxis domain={[0, 1]} stroke="#6b7280" tick={false} />
            <Tooltip
              wrapperStyle={{ backgroundColor: "#2d2d2d", border: "none" }}
              contentStyle={{ color: "#fff" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={lineColor}
              dot={false}
              isAnimationActive={false}
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Clock */}
      <div className="flex flex-col items-end space-y-1">
        <div className="text-5xl font-light">
          {now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="text-gray-400 text-sm">
          {now.toLocaleTimeString([], { second: "2-digit" })}
        </div>
      </div>
    </div>
  );
};

export default SecondaryHeaderCard;
