// @ts-nocheck
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/contexts/AuthContext';
import { lazy, Suspense } from 'react';

// Layout imports
import DashboardLayout from '@/layouts/DashboardLayout';
import AuthLayout from '@/layouts/AuthLayout';

// Lazy load pages to reduce initial bundle size and fix build timeout
const Index = lazy(() => import('@/pages/Index'));
const Home = lazy(() => import('@/pages/Home/Home'));
const HomeRobust = lazy(() => import('@/pages/Home/HomeRobust'));
const Dashboard = lazy(() => import('@/pages/Dashboard/Dashboard'));
const ExecutiveDashboard = lazy(() => import('@/pages/Dashboard/ExecutiveDashboard'));
const KPIDashboard = lazy(() => import('@/pages/Dashboard/KPIDashboard'));
const Login = lazy(() => import('@/pages/Auth/Login'));
const Register = lazy(() => import('@/pages/Auth/Register'));
const ForgotPassword = lazy(() => import('@/pages/Auth/ForgotPassword').then(module => ({ default: module.ForgotPassword })));
const EmailConfirmation = lazy(() => import('@/pages/Auth/EmailConfirmation'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const SimpleLeadsPage = lazy(() => import('@/pages/Leads/SimpleLeadsPage'));
const LeadApprovals = lazy(() => import('@/pages/Leads/LeadApprovals'));
const AssignOwnerRole = lazy(() => import('@/pages/Admin/AssignOwnerRole'));
const AssignRole = lazy(() => import('@/pages/Admin/AssignRole'));
const LandingManager = lazy(() => import('@/pages/Admin/LandingManager'));
const MonitoringPage = lazy(() => import('@/pages/Monitoring/MonitoringPage'));
const SupplyChainMonitoring = lazy(() => import('@/pages/Monitoring/SupplyChainMonitoring'));
const ForensicAuditPage = lazy(() => import('@/pages/Monitoring/ForensicAuditPage'));
const TicketsList = lazy(() => import('@/pages/Tickets/TicketsList'));
const ServicesPage = lazy(() => import('@/pages/Services/ServicesPage').then(module => ({ default: module.ServicesPage })));
const RendimientoPage = lazy(() => import('@/pages/Services/RendimientoPage'));
const InstallerManagement = lazy(() => import('@/pages/Installers/InstallerManagement'));
const InstallationCalendar = lazy(() => import('@/pages/Installers/InstallationCalendar'));
const InstallationSchedule = lazy(() => import('@/pages/Installers/InstallationSchedule'));
const InstallerPortal = lazy(() => import('@/pages/Installers/InstallerPortal'));
const GestionInstaladores = lazy(() => import('@/pages/Installers/GestionInstaladores'));
const RegistroInstaladores = lazy(() => import('@/pages/Installers/RegistroInstaladores').then(module => ({ default: module.RegistroInstaladores })));
const Landing = lazy(() => import('@/pages/Landing/Landing'));
const WMSPage = lazy(() => import('@/pages/WMS/WMSPage'));
const CustodianPortal = lazy(() => import('@/pages/custodian/CustodianPortal'));
const CustodianDashboard = lazy(() => import('@/pages/custodian/CustodianDashboard'));
const CustodianTickets = lazy(() => import('@/pages/custodian/CustodianTickets'));
const CustodianPortalAdmin = lazy(() => import('@/pages/admin/CustodianPortalAdmin'));
const RecruitmentStrategy = lazy(() => import('@/pages/RecruitmentStrategy'));
const ModernRecruitment = lazy(() => import('@/pages/ModernRecruitment'));
const SimulationScenarios = lazy(() => import('@/pages/SimulationScenarios'));
const ExecutiveRecruitmentDashboard = lazy(() => import('@/pages/ExecutiveRecruitmentDashboard'));
const SupplyDashboardExtended = lazy(() => import('@/pages/supply/SupplyDashboardExtended'));
const SIERCPPage = lazy(() => import('@/pages/evaluation/SIERCPPage'));
const SIERCPMethodologyPage = lazy(() => import('@/pages/evaluation/SIERCPMethodologyPage'));
const ServiceWorkflowDocumentation = lazy(() => import('@/pages/Documentation/ServiceWorkflowDocumentation'));
const PlaneacionDashboard = lazy(() => import('@/pages/Planeacion/PlaneacionDashboard'));
const DuplicateCleanupPage = lazy(() => import('@/pages/Maintenance/DuplicateCleanupPage'));
const VersionControlPage = lazy(() => import('@/pages/Administration/VersionControlPage'));
const SystemTestingPage = lazy(() => import('@/pages/SystemTestingPage'));
const SignUp = lazy(() => import('@/pages/Auth/SignUp'));

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import PermissionProtectedRoute from '@/components/PermissionProtectedRoute';

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

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
              <Suspense fallback={<LoadingFallback />}>
                <Routes>
                {/* Main route - Leads as principal page */}
                <Route path="/" element={<SimpleLeadsPage />} />
                <Route path="/landing" element={<Landing />} />
                
                {/* Auth routes */}
                <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
                <Route path="/auth/register" element={<SignUp />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                <Route path="/auth/email-confirmation" element={<AuthLayout><EmailConfirmation /></AuthLayout>} />
                
                {/* Protected routes - Home accessible to all authenticated users */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <Home />
                    </ProtectedRoute>
                  }
                />
                
                {/* Legacy dashboard route - redirect to executive dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <PermissionProtectedRoute permissionType="page" permissionId="dashboard" showMessage={true}>
                        <DashboardLayout>
                          <ExecutiveDashboard />
                        </DashboardLayout>
                      </PermissionProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Executive Dashboard - Permission Protected */}
                <Route
                  path="/executive-dashboard"
                  element={
                    <ProtectedRoute>
                      <PermissionProtectedRoute permissionType="page" permissionId="dashboard" showMessage={true}>
                        <DashboardLayout>
                          <ExecutiveDashboard />
                        </DashboardLayout>
                      </PermissionProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* KPI Dashboard - Permission Protected */}
                <Route
                  path="/dashboard/kpis"
                  element={
                    <ProtectedRoute>
                      <PermissionProtectedRoute permissionType="page" permissionId="dashboard" showMessage={true}>
                        <DashboardLayout>
                          <KPIDashboard />
                        </DashboardLayout>
                      </PermissionProtectedRoute>
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
                
                {/* Leads routes */}
                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute>
                      <SimpleLeadsPage />
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/leads/approvals"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead', 'ejecutivo_ventas']}>
                        <DashboardLayout>
                          <LeadApprovals />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Recruitment Strategy routes */}
                <Route
                  path="/recruitment-strategy"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'coordinador_operaciones']}>
                        <ModernRecruitment />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Simulation Scenarios routes */}
                <Route
                  path="/simulation-scenarios"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'manager', 'coordinador_operaciones']}>
                        <DashboardLayout>
                          <SimulationScenarios />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Executive Recruitment Dashboard */}
                <Route
                  path="/executive-recruitment"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'manager']}>
                        <DashboardLayout>
                          <ExecutiveRecruitmentDashboard />
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
            path="/installers/gestion"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin']}>
                  <DashboardLayout>
                    <GestionInstaladores />
                  </DashboardLayout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/installers/registro"
            element={
              <ProtectedRoute>
                <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones']}>
                  <DashboardLayout>
                    <RegistroInstaladores />
                  </DashboardLayout>
                </RoleProtectedRoute>
              </ProtectedRoute>
            }
          />
                
                <Route
                  path="/wms"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'monitoring_supervisor', 'monitoring', 'coordinador_operaciones']}>
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
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <DashboardLayout>
                          <Settings />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/assign-role"
                  element={
                    <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                      <AssignRole />
                    </RoleProtectedRoute>
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
                      <PermissionProtectedRoute 
                        permissionType="page" 
                        permissionId="landing_management"
                        fallbackPath="/dashboard"
                      >
                        <DashboardLayout>
                          <LandingManager />
                        </DashboardLayout>
                      </PermissionProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Maintenance routes */}
                <Route
                  path="/maintenance/duplicate-cleanup"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'bi', 'supply_admin']}>
                        <DashboardLayout>
                          <DuplicateCleanupPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Administration routes */}
                <Route
                  path="/admin/version-control"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <DashboardLayout>
                          <VersionControlPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                {/* Supply Dashboard Extended */}
                <Route
                  path="/supply/dashboard-extended"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead']}>
                        <DashboardLayout>
                          <SupplyDashboardExtended />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Admin Custodian Portal View */}
                <Route
                  path="/admin/custodian-portal"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <DashboardLayout>
                          <CustodianPortalAdmin />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* SIERCP Evaluation Route */}
                <Route
                  path="/evaluation/siercp"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'jefe_seguridad', 'analista_seguridad']}>
                        <DashboardLayout>
                          <SIERCPPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* SIERCP Methodology Route */}
                <Route
                  path="/evaluation/siercp/methodology"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'jefe_seguridad', 'analista_seguridad']}>
                        <DashboardLayout>
                          <SIERCPMethodologyPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Service Workflow Documentation Route */}
                <Route
                  path="/documentation/workflow"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'analista_seguridad']}>
                        <ServiceWorkflowDocumentation />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Custodian Portal Routes */}
                <Route path="/custodian" element={<CustodianPortal />}>
                  <Route index element={<CustodianDashboard />} />
                  <Route path="tickets" element={<CustodianTickets />} />
                </Route>
                
                {/* Planeación Custodias */}
                <Route
                  path="/planeacion"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones', 'planificador']}>
                        <DashboardLayout>
                          <PlaneacionDashboard />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* System Testing Route - Admin Only */}
                <Route
                  path="/system-testing"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <DashboardLayout>
                          <SystemTestingPage />
                        </DashboardLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 route - MUST BE LAST */}
                <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </div>
          </Router>
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
