// src/components/Layout.jsx
import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Footer from "./Footer";
import { useNavigate } from "react-router-dom";
import { useUser } from "../../contexts/UserContext";

export default function Layout({ children }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeNav, setActiveNav] = useState("dashboard");
  const { user, logout } = useUser();
  const navigate = useNavigate();

  // Toggle helper
  const toggleMenu = () => setMenuOpen((o) => !o);

  // Clone the child page and inject sidebar props
  const page = React.cloneElement(children, {
    menuOpen,
    setMenuOpen,
    activeNav,
    setActiveNav,
    toggleMenu,
  });

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  // Get user display name
  const operatorName = user?.name || user?.fullName || user?.username || user?.email || "User";

  return (
    <div className="flex min-h-screen">
      {/* Sidebar always here */}
      <Sidebar
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        activeKey={activeNav}
        onNavigate={(key) => {
          setActiveNav(key);
          // Let pages handle navigate(...) themselves
        }}
        onLogout={handleLogout}
      />

      {/* Page content */}
      <div className="flex-1 flex flex-col">
        {page}
        
        {/* Footer */}
        <footer className="flex-none">
          <Footer
            operatorName={operatorName}
            onMenuClick={toggleMenu}
            onOperatorClick={() => navigate("/settings")}
            onRefreshClick={() => {}}
            onDowntimeClick={() => {}}
            onSpeedLossClick={() => {}}
            onScrapClick={() => {}}
            onMailClick={() => {}}
            counts={{ downtime: 0, speedLoss: 0, scrap: 0 }}
          />
        </footer>
      </div>
    </div>
  );
}
