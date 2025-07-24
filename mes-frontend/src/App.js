// src/App.jsx
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { UserProvider, useUser } from "./contexts/UserContext";
import { TimelineProvider } from "./contexts/TimelineContext";

import Layout from "./components/layout/Layout";

import DashboardPage      from "./pages/Dashboard";
import MachinesTimeline   from "./pages/MachinesTimeline";
import MachinesPage       from "./pages/MachinesPage";
import MachineDetailPage  from "./pages/MachineDetailPage";
import LinesPage          from "./pages/LinesPage";
import ShiftsPage         from "./pages/ShiftsPage";
import StopsPage          from "./pages/StopsPage";
import WorkOrdersPage     from "./pages/WorkOrdersPage";
import UsersPage          from "./pages/UsersPage";
import SettingsPage       from "./pages/SettingsPage";
import LoginPage          from "./pages/LoginPage";
import SimulateMachinesPage from "./pages/SimulateMachinesPage";
import ProductsPage from "./pages/ProductsPage";

function ProtectedRoute({ children }) {
  const { user } = useUser();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <TimelineProvider>
      <UserProvider>
        <Routes>
          {/* Redirect root to dashboard */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />

          {/* Login */}
          <Route path="/login" element={<LoginPage />} />

          {/* Dashboard */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Layout>
                  <DashboardPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Production line overview */}
          <Route
            path="/production"
            element={
              <ProtectedRoute>
                <Layout>
                  <MachinesTimeline />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Machines list */}
          <Route
            path="/machines"
            element={
              <ProtectedRoute>
                <Layout>
                  <MachinesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Machine detail */}
          <Route
            path="/machines/:id"
            element={
              <ProtectedRoute>
                <Layout>
                  <MachineDetailPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Other pages */}
          <Route
            path="/lines"
            element={
              <ProtectedRoute>
                <Layout>
                  <LinesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/lines/:lineId"
            element={
              <ProtectedRoute>
                <Layout>
                  <MachinesTimeline />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/shifts"
            element={
              <ProtectedRoute>
                <Layout>
                  <ShiftsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/stops"
            element={
              <ProtectedRoute>
                <Layout>
                  <StopsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/orders"
            element={
              <ProtectedRoute>
                <Layout>
                  <WorkOrdersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute>
                <Layout>
                  <UsersPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <ProtectedRoute>
                <Layout>
                  <SettingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/simulate"
            element={
              <ProtectedRoute>
                <Layout>
                  <SimulateMachinesPage />
                </Layout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/products"
            element={
              <ProtectedRoute>
                <Layout>
                  <ProductsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </UserProvider>
    </TimelineProvider>
  );
}