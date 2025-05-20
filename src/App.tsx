
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";

// Layouts
import AuthLayout from "./layouts/AuthLayout";
import DashboardLayout from "./layouts/DashboardLayout";

// Auth Pages
import Login from "./pages/Auth/Login";
import Register from "./pages/Auth/Register";
import ForgotPassword from "./pages/Auth/ForgotPassword";

// Landing Page
import Landing from "./pages/Landing/Landing";

// Dashboard Pages
import Dashboard from "./pages/Dashboard/Dashboard";
import LeadsList from "./pages/Leads/LeadsList";
import InstallerPortal from "./pages/Installers/InstallerPortal";
import TicketsList from "./pages/Tickets/TicketsList";
import Settings from "./pages/Settings/Settings";
import NotFound from "./pages/NotFound";
import MonitoringPage from "./pages/Monitoring/MonitoringPage";
import SupplyChainMonitoring from "./pages/Monitoring/SupplyChainMonitoring";

// Admin Pages
import LandingManager from "./pages/Admin/LandingManager";
import AssignRole from "./pages/Admin/AssignRole";

// Query client for React Query
const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Landing page para usuarios no autenticados */}
              <Route path="/" element={<Landing />} />
              <Route path="/index" element={<Navigate to="/" replace />} />
              
              {/* Auth Routes */}
              <Route element={<AuthLayout />}>
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
              </Route>
              
              {/* Dashboard Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                
                {/* Lead Management */}
                <Route path="/leads" element={<LeadsList />} />
                <Route path="/leads/approval" element={<LeadsList />} />
                <Route path="/leads/new" element={<div>Crear Lead Form</div>} />
                
                {/* Services */}
                <Route path="/services" element={<div>Lista de Servicios</div>} />
                <Route path="/services/performance" element={<div>Rendimiento de Servicios</div>} />
                
                {/* Installations */}
                <Route path="/installations" element={<div>Instalaciones GPS</div>} />
                <Route path="/installations/installers" element={<InstallerPortal />} />
                
                {/* Monitoring */}
                <Route path="/monitoring" element={<MonitoringPage />} />
                <Route path="/supply-chain" element={<SupplyChainMonitoring />} />
                
                {/* Tickets */}
                <Route path="/tickets" element={<TicketsList />} />
                <Route path="/tickets/new" element={<div>Crear Ticket Form</div>} />
                
                {/* Settings */}
                <Route path="/settings" element={<Settings />} />
                
                {/* Admin Routes */}
                <Route path="/admin/landing" element={<LandingManager />} />
                <Route path="/admin/assign-role" element={<AssignRole />} />
              </Route>
              
              {/* Catch-all route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
