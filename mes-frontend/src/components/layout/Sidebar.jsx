// src/components/Sidebar.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiX,
  FiHome,
  FiCpu,
  FiPackage,
  FiClock,
  FiPlay,
  FiFileText,
  FiUsers,
  FiBarChart2,
  FiSettings,
  FiLogOut,
  FiRefreshCw,
  FiBox,
} from "react-icons/fi";
import { NavLink } from "react-router-dom";

const navSections = [
  {
    title: "Main",
    items: [
      { key: "dashboard", label: "Dashboard", icon: <FiHome /> },
      { key: "machines",  label: "Machines",  icon: <FiCpu /> },
      { key: "lines",     label: "Lines",     icon: <FiPackage /> },
      { key: "products",  label: "Products",  icon: <FiBox /> },
      { key: "shifts",    label: "Shifts",    icon: <FiClock /> },
      { key: "stops",     label: "Stops",     icon: <FiPlay /> },
      { key: "orders",    label: "Work Orders", icon: <FiFileText /> },
      { key: "simulate",  label: "Simulate", icon: <FiRefreshCw /> },
    ]
  },
  {
    title: "Admin",
    items: [
      { key: "users",    label: "Users",    icon: <FiUsers /> },
      { key: "settings", label: "Settings", icon: <FiSettings /> },
    ]
  }
];

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 0.5 },
};

const drawerVariants = {
  hidden: { x: "-100%" },
  visible: { x: 0 },
};

export default function Sidebar({
  isOpen,
  onClose,
  onLogout = () => {}
}) {
  // Map nav keys to routes
  const routeMap = {
    dashboard: "/dashboard",
    machines: "/machines",
    lines: "/lines",
    products: "/products",
    shifts: "/shifts",
    stops: "/stops",
    orders: "/orders",
    users: "/users",
    settings: "/settings",
    simulate: "/simulate",
  };
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 bg-black z-40"
            variants={backdropVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ duration: 0.2 }}
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.nav
            className="fixed inset-y-0 left-0 z-50 w-64 bg-background text-white flex flex-col"
            variants={drawerVariants}
            initial="hidden"
            animate="visible"
            exit="hidden"
            transition={{ type: "tween", duration: 0.3 }}
          >
            {/* Close Button */}
            <div className="flex justify-end p-4">
              <button onClick={onClose} className="hover:text-accent transition-colors">
                <FiX size={24} />
              </button>
            </div>

            {/* Logo / Title */}
            <div className="px-6 py-2 text-lg font-bold uppercase border-b border-surface text-primary">
              FlowCon
            </div>

            {/* Navigation Sections */}
            <div className="flex-1 overflow-y-auto">
              {navSections.map((section) => (
                <div key={section.title} className="mt-4">
                  <div className="px-6 text-xs text-secondary uppercase mb-2">
                    {section.title}
                  </div>
                  <ul>
                    {section.items.map((item) => (
                      <li key={item.key}>
                        <NavLink
                          to={routeMap[item.key]}
                          className={({ isActive }) =>
                            `w-full flex items-center px-6 py-2 space-x-3 text-sm hover:bg-surface transition-colors ` +
                            (isActive ? "bg-surface text-accent" : "")
                          }
                          onClick={onClose}
                        >
                          <span className="text-lg">{item.icon}</span>
                          <span>{item.label}</span>
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>

            {/* Logout */}
            <div className="border-t border-surface p-4">
              <button
                onClick={onLogout}
                className="flex items-center space-x-2 text-sm hover:text-error transition-colors"
              >
                <FiLogOut />
                <span>Log Out</span>
              </button>
            </div>
          </motion.nav>
        </>
      )}
    </AnimatePresence>
  );
}
