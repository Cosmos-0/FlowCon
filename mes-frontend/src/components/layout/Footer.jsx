import React, { useState, useRef, useEffect } from "react";
import {
  FiMoreHorizontal,
  FiUser,
  FiRefreshCw,
  FiClock,
  FiActivity,
  FiAlertCircle,
  FiMail,
} from "react-icons/fi";
import { useNotifications } from '../../contexts/NotificationContext';

export default function Footer({
  operatorName = "Mr Evocon",
  onMenuClick = () => {},
  onOperatorClick = () => {},
  onRefreshClick = () => {},
  onDowntimeClick = () => {},
  onSpeedLossClick = () => {},
  onScrapClick = () => {},
  onMailClick = () => {},
  counts = { downtime: 1, speedLoss: 1, scrap: 5 },
}) {
  const { notifications, clearNotifications } = useNotifications();
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    const onClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onClickOutside);
    return () => document.removeEventListener("click", onClickOutside);
  }, []);

  return (
    <footer className="relative bg-surface text-primary flex items-center justify-between px-4 py-2">
      {/* Left side */}
      <div className="flex items-center space-x-4">
        <button
          onClick={onMenuClick}
          title="Menu"
          className="p-1 hover:text-accent transition-colors"
        >
          <FiMoreHorizontal size={20} />
        </button>
        <button
          onClick={onOperatorClick}
          title={`Operator: ${operatorName}`}
          className="flex items-center space-x-1 hover:text-accent transition-colors"
        >
          <FiUser size={20} />
          <span>{operatorName}</span>
        </button>
      </div>

      {/* Mail icon with badge & dropdown */}
      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setOpen((o) => !o)}
          title="Notifications"
          className="p-1 hover:text-accent relative transition-colors"
        >
          <FiMail size={20} />
          {notifications.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-error text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
              {notifications.length}
            </span>
          )}
        </button>

        {open && (
          <div
            className="
              absolute right-0 bottom-full mb-2
              w-64 max-h-64 overflow-y-auto
              bg-surface border border-background rounded shadow-lg z-50
            "
          >
            <div className="flex justify-between items-center px-3 py-2 border-b border-background">
              <span className="font-semibold">Notifications</span>
              <button
                onClick={clearNotifications}
                className="text-xs text-secondary hover:text-primary transition-colors"
              >
                Clear
              </button>
            </div>
            {notifications.length === 0 ? (
              <div className="p-4 text-secondary text-sm">No notifications</div>
            ) : (
              notifications.map((n, i) => (
                <div
                  key={i}
                  className="px-3 py-2 hover:bg-background border-b border-background text-sm transition-colors"
                >
                  {n.message}
                  <div className="text-xs text-secondary mt-1">{n.time}</div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </footer>
  );
}