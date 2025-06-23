import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';

// Layout imports
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Page imports - Fixed to use default imports
import Index from '@/pages/Index';
import Home from '@/pages/Home/Home';
import Dashboard from '@/pages/Dashboard/Dashboard';
import ExecutiveDashboard from '@/pages/Dashboard/ExecutiveDashboard';
import Login from '@/pages/Auth/Login';
import Register from '@/pages/Auth/Register';
import ForgotPassword from '@/pages/Auth/ForgotPassword';
import EmailConfirmation from '@/pages/Auth/EmailConfirmation';
import Settings from '@/pages/Settings/Settings';
import NotFound from '@/pages/NotFound';
import LeadsList from '@/pages/Leads/LeadsList';
import LeadApprovals from '@/pages/Leads/LeadApprovals';
import AssignOwnerRole from '@/pages/Admin/AssignOwnerRole';
import AssignRole from '@/pages/Admin/AssignRole';
import LandingManager from '@/pages/Admin/LandingManager';
import MonitoringPage from '@/pages/Monitoring/MonitoringPage';
import SupplyChainMonitoring from '@/pages/Monitoring/SupplyChainMonitoring';
import ForensicAuditPage from '@/pages/Monitoring/ForensicAuditPage';
import TicketsList from '@/pages/Tickets/TicketsList';
import { ServicesPage } from '@/pages/Services/ServicesPage';
import RendimientoPage from '@/pages/Services/RendimientoPage';
import InstallerManagement from '@/pages/Installers/InstallerManagement';
import InstallationCalendar from '@/pages/Installers/InstallationCalendar';
import InstallationSchedule from '@/pages/Installers/InstallationSchedule';
import InstallerPortal from '@/pages/Installers/InstallerPortal';
import Landing from '@/pages/Landing/Landing';
import WMSPage from '@/pages/WMS/WMSPage';

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';

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
            <div className="min-h-screen bg-background">
              <Routes>
                {/* Public routes */}
                <Route path="/" element={<Index />} />
                <Route path="/landing" element={<Landing />} />
                
                {/* Auth routes */}
                <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
                <Route path="/auth/register" element={<AuthLayout><Register /></AuthLayout>} />
                <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                <Route path="/auth/email-confirmation" element={<AuthLayout><EmailConfirmation /></AuthLayout>} />
                
                {/* Protected routes - Home accessible to all authenticated users */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <Home />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Legacy dashboard route - redirect to executive dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi']}>
                        <DashboardLayout>
                          <ExecutiveDashboard />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Executive Dashboard - Role Protected */}
                <Route
                  path="/executive-dashboard"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi']}>
                        <DashboardLayout>
                          <ExecutiveDashboard />
                        </DashboardLayout>
                      </RoleProtectedRoute>
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
                
                <Route
                  path="/services/rendimiento"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi']}>
                        <DashboardLayout>
                          <RendimientoPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Leads routes - Role protected */}
                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'ejecutivo_ventas', 'coordinador_operaciones']}>
                        <DashboardLayout>
                          <LeadsList />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/leads/approvals"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones']}>
                        <DashboardLayout>
                          <LeadApprovals />
                        </DashboardLayout>
                      </RoleProtectedRoute>
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
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones']}>
                        <DashboardLayout>
                          <SupplyChainMonitoring />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/monitoring/forensic-audit"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'jefe_seguridad', 'analista_seguridad']}>
                        <DashboardLayout>
                          <ForensicAuditPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* ... keep existing code for remaining routes */}
                <Route
                  path="/installers"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <InstallerManagement />
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
                  path="/installers/calendar"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <InstallationCalendar />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/installers/portal"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout>
                        <InstallerPortal />
                      </DashboardLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/wms"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply']}>
                        <DashboardLayout>
                          <WMSPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
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
                
                <Route
                  path="/admin/assign-role"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <DashboardLayout>
                          <AssignRole />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/assign-owner-role"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['owner']}>
                        <DashboardLayout>
                          <AssignOwnerRole />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/landing-manager"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <DashboardLayout>
                          <LandingManager />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
