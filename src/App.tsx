
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "next-themes";

// Import layouts
import { AuthLayout } from "@/layouts/AuthLayout";
import { DashboardLayout } from "@/layouts/DashboardLayout";

// Import pages
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard/Dashboard";
import Login from "@/pages/Auth/Login";
import Register from "@/pages/Auth/Register";
import ForgotPassword from "@/pages/Auth/ForgotPassword";
import EmailConfirmation from "@/pages/Auth/EmailConfirmation";
import Settings from "@/pages/Settings/Settings";
import LeadsList from "@/pages/Leads/LeadsList";
import TicketsList from "@/pages/Tickets/TicketsList";
import MonitoringPage from "@/pages/Monitoring/MonitoringPage";
import SupplyChainMonitoring from "@/pages/Monitoring/SupplyChainMonitoring";
import InstallerPortal from "@/pages/Installers/InstallerPortal";
import AssignRole from "@/pages/Admin/AssignRole";
import AssignOwnerRole from "@/pages/Admin/AssignOwnerRole";
import LandingManager from "@/pages/Admin/LandingManager";
import Landing from "@/pages/Landing/Landing";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
        <TooltipProvider>
          <BrowserRouter>
            <AuthProvider>
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<Landing />} />
                
                {/* Auth routes */}
                <Route path="/auth" element={<AuthLayout />}>
                  <Route path="login" element={<Login />} />
                  <Route path="register" element={<Register />} />
                  <Route path="forgot-password" element={<ForgotPassword />} />
                </Route>
                
                {/* Email confirmation route (standalone) */}
                <Route path="/auth/confirm" element={<EmailConfirmation />} />
                
                {/* Legacy auth routes for compatibility */}
                <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                <Route path="/register" element={<Navigate to="/auth/register" replace />} />
                <Route path="/forgot-password" element={<Navigate to="/auth/forgot-password" replace />} />
                
                {/* Protected leads route (standalone with dashboard layout) */}
                <Route path="/leads" element={<DashboardLayout />}>
                  <Route index element={<LeadsList />} />
                </Route>
                
                {/* Protected dashboard routes */}
                <Route path="/dashboard" element={<DashboardLayout />}>
                  <Route index element={<Dashboard />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="tickets" element={<TicketsList />} />
                  <Route path="monitoring" element={<MonitoringPage />} />
                  <Route path="supply-chain" element={<SupplyChainMonitoring />} />
                  <Route path="installers" element={<InstallerPortal />} />
                  <Route path="admin/assign-role" element={<AssignRole />} />
                  <Route path="admin/assign-owner" element={<AssignOwnerRole />} />
                  <Route path="admin/landing" element={<LandingManager />} />
                </Route>
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
              <Toaster />
              <Sonner />
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
