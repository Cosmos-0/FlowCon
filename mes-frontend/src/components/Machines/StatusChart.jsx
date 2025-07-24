import React from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const StatusChart = ({ statusData }) => (
  <div className="bg-gray-800 p-4 rounded">
    <h2 className="text-gray-400 mb-2">Speed Trend</h2>
    <ResponsiveContainer width="100%" height={150}>
      <LineChart data={statusData}>
        <XAxis dataKey="time" stroke="#9ca3af" />
        <YAxis stroke="#9ca3af" />
        <Tooltip />
        <Line dataKey="value" stroke="#22c55e" isAnimationActive={false} strokeWidth={2} dot={false} />
      </LineChart>
    </ResponsiveContainer>
  </div>
);

export default StatusChart;
