import React from "react";

const statusColors = {
  RUNNING: "bg-green-600",
  STOP: "bg-red-600",
  SPEED_LOSS: "bg-yellow-400",
};

const StatusBadge = ({ status }) => (
  <span className={`text-white px-3 py-1 rounded-full ${statusColors[status]}`}>
    {status}
  </span>
);

export default StatusBadge;
