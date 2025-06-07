import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from '@/components/ui/toaster';
import { AuthProvider } from '@/contexts/AuthContext';

// Layout imports
import DashboardLayout from '@/layouts/DashboardLayout';

// Page imports
import Index from '@/pages/Index';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import EmailConfirmation from '@/pages/Auth/EmailConfirmation';
import Dashboard from '@/pages/Dashboard/Dashboard';
import LeadsList from '@/pages/Leads/LeadsList';
import LeadApprovals from '@/pages/Leads/LeadApprovals';
import MonitoringPage from '@/pages/Monitoring/MonitoringPage';
import SupplyChainMonitoring from '@/pages/Monitoring/SupplyChainMonitoring';
import ForensicAuditPage from '@/pages/Monitoring/ForensicAuditPage';
import { ServicesPage } from '@/pages/Services/ServicesPage';
import Settings from '@/pages/Settings/Settings';
import TicketsList from '@/pages/Tickets/TicketsList';
import InstallerPortal from '@/pages/Installers/InstallerPortal';
import LandingManager from '@/pages/Admin/LandingManager';
import AssignRole from '@/pages/Admin/AssignRole';
import AssignOwnerRole from '@/pages/Admin/AssignOwnerRole';
import NotFound from '@/pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <Router>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
          <Toaster />
          <AuthProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth/login" element={<Login />} />
              <Route path="/auth/register" element={<Register />} />
              <Route path="/auth/forgot-password" element={<ForgotPassword />} />
              <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />
              
              {/* Protected Routes */}
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/leads" element={<LeadsList />} />
                <Route path="/leads/approvals" element={<LeadApprovals />} />
                <Route path="/monitoring" element={<MonitoringPage />} />
                <Route path="/monitoring/supply-chain" element={<SupplyChainMonitoring />} />
                <Route path="/monitoring/forensic-audit" element={<ForensicAuditPage />} />
                <Route path="/services" element={<ServicesPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/tickets" element={<TicketsList />} />
                <Route path="/installers" element={<InstallerPortal />} />
                <Route path="/admin/landing" element={<LandingManager />} />
                <Route path="/admin/assign-role" element={<AssignRole />} />
                <Route path="/admin/assign-owner-role" element={<AssignOwnerRole />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </Router>
  );
}

export default App;
