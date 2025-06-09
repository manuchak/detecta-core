
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import DashboardLayout from "@/layouts/DashboardLayout";
import AuthLayout from "@/layouts/AuthLayout";

// Auth pages
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import EmailConfirmation from "@/pages/Auth/EmailConfirmation";

// Main pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Landing from "@/pages/Landing/Landing";
import NotFound from "@/pages/NotFound";

// Feature pages
import LeadsList from "@/pages/Leads/LeadsList";
import LeadApprovals from "@/pages/Leads/LeadApprovals";
import { ServicesPage } from "@/pages/Services/ServicesPage";
import TicketsList from "@/pages/Tickets/TicketsList";
import Settings from "@/pages/Settings/Settings";

// Monitoring pages
import MonitoringPage from "@/pages/Monitoring/MonitoringPage";
import SupplyChainMonitoring from "@/pages/Monitoring/SupplyChainMonitoring";
import ForensicAuditPage from "@/pages/Monitoring/ForensicAuditPage";

// Installer pages
import InstallerPortal from "@/pages/Installers/InstallerPortal";
import InstallationSchedule from "@/pages/Installers/InstallationSchedule";
import InstallerManagement from "@/pages/Installers/InstallerManagement";

// Admin pages
import LandingManager from "@/pages/Admin/LandingManager";
import AssignRole from "@/pages/Admin/AssignRole";
import AssignOwnerRole from "@/pages/Admin/AssignOwnerRole";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            {/* Public routes */}
            <Route path="/landing" element={<Landing />} />
            
            {/* Auth routes */}
            <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
            <Route path="/auth/register" element={<AuthLayout><Register /></AuthLayout>} />
            <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
            <Route path="/auth/email-confirmation" element={<AuthLayout><EmailConfirmation /></AuthLayout>} />

            {/* Protected routes */}
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Index />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Dashboard />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Leads routes */}
            <Route
              path="/leads"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeadsList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/leads/approvals"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LeadApprovals />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Services routes */}
            <Route
              path="/services"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ServicesPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Monitoring routes */}
            <Route
              path="/monitoring"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <MonitoringPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring/supply-chain"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <SupplyChainMonitoring />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/monitoring/forensic-audit"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <ForensicAuditPage />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Installer routes */}
            <Route
              path="/installers"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InstallerPortal />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/installers/schedule"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InstallationSchedule />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/installers/management"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <InstallerManagement />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Tickets routes */}
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <TicketsList />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Settings routes */}
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <Settings />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* Admin routes */}
            <Route
              path="/admin/landing"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <LandingManager />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assign-role"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AssignRole />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/assign-owner"
              element={
                <ProtectedRoute>
                  <DashboardLayout>
                    <AssignOwnerRole />
                  </DashboardLayout>
                </ProtectedRoute>
              }
            />

            {/* 404 route */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
