
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';

// Layout imports
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Page imports
import { Index } from '@/pages/Index';
import { Dashboard } from '@/pages/Dashboard/Dashboard';
import { Login } from '@/pages/Auth/Login';
import { Register } from '@/pages/Auth/Register';
import { ForgotPassword } from '@/pages/Auth/ForgotPassword';
import { EmailConfirmation } from '@/pages/Auth/EmailConfirmation';
import { Settings } from '@/pages/Settings/Settings';
import { NotFound } from '@/pages/NotFound';
import { LeadsList } from '@/pages/Leads/LeadsList';
import { LeadApprovals } from '@/pages/Leads/LeadApprovals';
import { AssignOwnerRole } from '@/pages/Admin/AssignOwnerRole';
import { AssignRole } from '@/pages/Admin/AssignRole';
import { LandingManager } from '@/pages/Admin/LandingManager';
import { MonitoringPage } from '@/pages/Monitoring/MonitoringPage';
import { SupplyChainMonitoring } from '@/pages/Monitoring/SupplyChainMonitoring';
import { ForensicAuditPage } from '@/pages/Monitoring/ForensicAuditPage';
import { TicketsList } from '@/pages/Tickets/TicketsList';
import { ServicesPage } from '@/pages/Services/ServicesPage';
import RendimientoPage from '@/pages/Services/RendimientoPage';
import { InstallerManagement } from '@/pages/Installers/InstallerManagement';
import { InstallationCalendar } from '@/pages/Installers/InstallationCalendar';
import { InstallationSchedule } from '@/pages/Installers/InstallationSchedule';
import { InstallerPortal } from '@/pages/Installers/InstallerPortal';
import { Landing } from '@/pages/Landing/Landing';

// Components
import { ProtectedRoute } from '@/components/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route path="/landing" element={<Landing />} />
              
              {/* Auth routes */}
              <Route element={<AuthLayout />}>
                <Route path="/auth/login" element={<Login />} />
                <Route path="/auth/register" element={<Register />} />
                <Route path="/auth/forgot-password" element={<ForgotPassword />} />
                <Route path="/auth/email-confirmation" element={<EmailConfirmation />} />
              </Route>

              {/* Protected routes */}
              <Route element={<ProtectedRoute><DashboardLayout><Index /></DashboardLayout></ProtectedRoute>}>
                <Route path="/" element={<></>} />
              </Route>
              
              <Route path="/dashboard" element={<ProtectedRoute><DashboardLayout><Dashboard /></DashboardLayout></ProtectedRoute>} />
              <Route path="/settings" element={<ProtectedRoute><DashboardLayout><Settings /></DashboardLayout></ProtectedRoute>} />
              <Route path="/leads" element={<ProtectedRoute><DashboardLayout><LeadsList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/leads/approvals" element={<ProtectedRoute><DashboardLayout><LeadApprovals /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/assign-owner" element={<ProtectedRoute><DashboardLayout><AssignOwnerRole /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/assign-role" element={<ProtectedRoute><DashboardLayout><AssignRole /></DashboardLayout></ProtectedRoute>} />
              <Route path="/admin/landing" element={<ProtectedRoute><DashboardLayout><LandingManager /></DashboardLayout></ProtectedRoute>} />
              <Route path="/monitoring" element={<ProtectedRoute><DashboardLayout><MonitoringPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/monitoring/supply-chain" element={<ProtectedRoute><DashboardLayout><SupplyChainMonitoring /></DashboardLayout></ProtectedRoute>} />
              <Route path="/monitoring/forensic-audit" element={<ProtectedRoute><DashboardLayout><ForensicAuditPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/tickets" element={<ProtectedRoute><DashboardLayout><TicketsList /></DashboardLayout></ProtectedRoute>} />
              <Route path="/services" element={<ProtectedRoute><DashboardLayout><ServicesPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/services/rendimiento" element={<ProtectedRoute><DashboardLayout><RendimientoPage /></DashboardLayout></ProtectedRoute>} />
              <Route path="/installers" element={<ProtectedRoute><DashboardLayout><InstallerManagement /></DashboardLayout></ProtectedRoute>} />
              <Route path="/installers/calendar" element={<ProtectedRoute><DashboardLayout><InstallationCalendar /></DashboardLayout></ProtectedRoute>} />
              <Route path="/installers/schedule" element={<ProtectedRoute><DashboardLayout><InstallationSchedule /></DashboardLayout></ProtectedRoute>} />
              <Route path="/installers/portal" element={<ProtectedRoute><DashboardLayout><InstallerPortal /></DashboardLayout></ProtectedRoute>} />

              {/* 404 route */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
