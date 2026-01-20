// @ts-nocheck
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as SonnerToaster } from '@/components/ui/sonner';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider, useAuth } from '@/contexts/AuthContext';
import { DraftResumeProvider, useDraftResume } from '@/contexts/DraftResumeContext';
import { SandboxProvider, useSandbox } from '@/contexts/SandboxContext';
import { SandboxRouteGuard } from '@/components/sandbox/SandboxRouteGuard';
import { lazy, Suspense, useEffect } from 'react';
import { LastRouteRestorer } from '@/components/global/LastRouteRestorer';
import { GlobalResumeCTA } from '@/components/global/GlobalResumeCTA';
import { SIERCP_ALLOWED_ROLES } from '@/constants/accessControl';

// Layout imports
import DashboardLayout from '@/layouts/DashboardLayout';
import UnifiedLayout from '@/layouts/UnifiedLayout';
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
const ResetPassword = lazy(() => import('@/pages/Auth/ResetPassword').then(module => ({ default: module.ResetPassword })));
const EmailConfirmation = lazy(() => import('@/pages/Auth/EmailConfirmation'));
const Settings = lazy(() => import('@/pages/Settings/Settings'));
const NotFound = lazy(() => import('@/pages/NotFound'));
const SimpleLeadsPage = lazy(() => import('@/pages/Leads/SimpleLeadsPage'));
const LeadApprovals = lazy(() => import('@/pages/Leads/LeadApprovals'));
const LiberacionPage = lazy(() => import('@/pages/Leads/LiberacionPage'));
const EvaluacionesPage = lazy(() => import('@/pages/Leads/EvaluacionesPage'));
const AssignOwnerRole = lazy(() => import('@/pages/Admin/AssignOwnerRole'));
const AssignRole = lazy(() => import('@/pages/Admin/AssignRole'));
const LandingManager = lazy(() => import('@/pages/Admin/LandingManager'));
const CustodianInvitationsPage = lazy(() => import('@/pages/Admin/CustodianInvitationsPage'));
const MonitoringPage = lazy(() => import('@/pages/Monitoring/MonitoringPage'));
const SupplyChainMonitoring = lazy(() => import('@/pages/Monitoring/SupplyChainMonitoring'));
const ForensicAuditPage = lazy(() => import('@/pages/Monitoring/ForensicAuditPage'));
const IncidentesRRSSPage = lazy(() => import('@/pages/Incidentes/IncidentesRRSSPage'));
const TicketsList = lazy(() => import('@/pages/Tickets/TicketsList'));
const TicketDetailPage = lazy(() => import('@/pages/Tickets/TicketDetailPage'));
const TicketConfigPage = lazy(() => import('@/pages/Admin/TicketConfigPage'));
const TicketMetricsPage = lazy(() => import('@/pages/Admin/TicketMetricsPage'));
const TicketTemplatesPage = lazy(() => import('@/pages/Admin/TicketTemplatesPage'));
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
const SandboxTesting = lazy(() => import('@/pages/SandboxTesting'));
const SandboxDeployment = lazy(() => import('@/pages/SandboxDeployment'));
const CustodianDashboard = lazy(() => import('@/pages/custodian/CustodianDashboard'));
const CustodianTickets = lazy(() => import('@/pages/custodian/CustodianTickets'));
const CustodianServicesPage = lazy(() => import('@/pages/custodian/CustodianServicesPage'));
const CustodianVehiclePage = lazy(() => import('@/pages/custodian/CustodianVehiclePage'));
const CustodianSupportPage = lazy(() => import('@/pages/custodian/CustodianSupportPage'));
const CustodianPortalAdmin = lazy(() => import('@/pages/admin/CustodianPortalAdmin'));
const RecruitmentStrategy = lazy(() => import('@/pages/RecruitmentStrategy'));
const ModernRecruitment = lazy(() => import('@/pages/ModernRecruitment'));
const SimulationScenarios = lazy(() => import('@/pages/SimulationScenarios'));
const ExecutiveRecruitmentDashboard = lazy(() => import('@/pages/ExecutiveRecruitmentDashboard'));
const SupplyDashboardExtended = lazy(() => import('@/pages/supply/SupplyDashboardExtended'));
const SIERCPPage = lazy(() => import('@/pages/evaluation/SIERCPPage'));
const SIERCPMethodologyPage = lazy(() => import('@/pages/evaluation/SIERCPMethodologyPage'));
const SIERCPAssessmentPage = lazy(() => import('@/pages/assessment/SIERCPAssessmentPage'));
const ServiceWorkflowDocumentation = lazy(() => import('@/pages/Documentation/ServiceWorkflowDocumentation'));
const ProductArchitecturePage = lazy(() => import('@/pages/Documentation/ProductArchitecturePage'));
const PlaneacionDashboard = lazy(() => import('@/pages/Planeacion/PlaneacionDashboard'));
const ServiceCreationPage = lazy(() => import('@/pages/Planeacion/ServiceCreation'));
const ReportesHub = lazy(() => import('@/pages/Reportes'));
const DuplicateCleanupPage = lazy(() => import('@/pages/Maintenance/DuplicateCleanupPage'));
const VersionControlPage = lazy(() => import('@/pages/Administration/VersionControlPage'));
const AdministrationHub = lazy(() => import('@/pages/Administration/AdministrationHub'));
const SystemTestingPage = lazy(() => import('@/pages/SystemTestingPage'));
const SignUp = lazy(() => import('@/pages/Auth/SignUp'));
const PendingActivation = lazy(() => import('@/pages/Auth/PendingActivation'));
const CustodianSignup = lazy(() => import('@/pages/Auth/CustodianSignup'));
const ReportsPage = lazy(() => import('@/pages/Dashboard/ReportsPage'));
const LMSDashboard = lazy(() => import('@/pages/LMS/LMSDashboard'));
const CursoViewer = lazy(() => import('@/pages/LMS/CursoViewer'));
const LMSAdmin = lazy(() => import('@/pages/LMS/LMSAdmin'));
const VerificarCertificado = lazy(() => import('@/pages/LMS/VerificarCertificado'));
const LMSReportes = lazy(() => import('@/pages/LMS/LMSReportes'));
const LMSAdminCursoNuevo = lazy(() => import('@/pages/LMS/LMSAdminCursoNuevo'));
const LMSAdminCursoEditar = lazy(() => import('@/pages/LMS/LMSAdminCursoEditar'));
const LMSCursoDetalle = lazy(() => import('@/components/lms/admin/LMSCursoDetalle').then(m => ({ default: m.LMSCursoDetalle })));

// Components
import ProtectedRoute from '@/components/ProtectedRoute';
import RoleProtectedRoute from '@/components/RoleProtectedRoute';
import PermissionProtectedRoute from '@/components/PermissionProtectedRoute';
import SmartHomeRedirect from '@/components/SmartHomeRedirect';

// Componente para sincronizar userRole entre AuthContext y SandboxContext
function SandboxRoleSync({ children }: { children: React.ReactNode }) {
  const { userRole } = useAuth();
  const { updateUserRole } = useSandbox();
  
  useEffect(() => {
    if (updateUserRole) {
      updateUserRole(userRole);
    }
  }, [userRole, updateUserRole]);
  
  return <>{children}</>;
}

// Resume Route Handler Component
function ResumeRouteHandler() {
  const { getDraftCatalog } = useDraftResume();
  const { user } = useAuth();
  
  return (
    <Routes>
      {getDraftCatalog().map((draft) => (
        <Route
          key={draft.id}
          path={`/${draft.id}`}
          element={
            <Navigate 
              to={`${draft.resumePath}?resume=1`}
              replace
              state={{ draftId: draft.id }}
            />
          }
        />
      ))}
    </Routes>
  );
}

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
  </div>
);

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1 * 60 * 1000, // 1 minute - reduced for fresher data
      retry: 1,
      refetchOnWindowFocus: true, // Enable refetch on tab switch for fresh data
      refetchOnMount: true, // Enable refetch when component mounts
    },
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="vite-ui-theme">
        <AuthProvider>
          <SandboxProvider>
            <SandboxRoleSync>
              <DraftResumeProvider>
                <Router>
                <LastRouteRestorer />
                <SandboxRouteGuard>
                  <div className="min-h-screen bg-background">
                    <Suspense fallback={<LoadingFallback />}>
                      <Routes>
                  {/* Main route - Smart redirect based on auth */}
                  <Route path="/" element={<SmartHomeRedirect />} />
                  
                  {/* Deep-link routes for draft resumption */}
                  <Route path="/resume/*" element={
                    <ProtectedRoute>
                      <ResumeRouteHandler />
                    </ProtectedRoute>
                  } />
                <Route path="/landing" element={<Landing />} />
                
                {/* SIERCP Assessment - Public route for external candidates */}
                <Route path="/assessment/:token" element={<SIERCPAssessmentPage />} />
                
                {/* Auth routes */}
                <Route path="/auth/login" element={<AuthLayout><Login /></AuthLayout>} />
                <Route path="/login" element={<Navigate to="/auth/login" replace />} />
                <Route path="/auth/register" element={<SignUp />} />
                <Route path="/auth/signup" element={<SignUp />} />
                <Route path="/auth/forgot-password" element={<AuthLayout><ForgotPassword /></AuthLayout>} />
                <Route path="/reset-password" element={<AuthLayout><ResetPassword /></AuthLayout>} />
                <Route path="/auth/email-confirmation" element={<AuthLayout><EmailConfirmation /></AuthLayout>} />
                <Route path="/auth/pending-activation" element={<PendingActivation />} />
                <Route path="/auth/registro-custodio" element={<CustodianSignup />} />
                
                {/* Protected routes - Home accessible to all authenticated users */}
                <Route
                  path="/home"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <Home />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                {/* Legacy dashboard route - redirect to executive dashboard */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <PermissionProtectedRoute permissionType="page" permissionId="dashboard" showMessage={true}>
                        <UnifiedLayout>
                          <ExecutiveDashboard />
                        </UnifiedLayout>
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
                        <UnifiedLayout>
                          <ExecutiveDashboard />
                        </UnifiedLayout>
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
                        <UnifiedLayout>
                          <KPIDashboard />
                        </UnifiedLayout>
                      </PermissionProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Strategic Plan Dashboard - Permission Protected */}
                <Route
                  path="/dashboard/plan"
                  element={
                    <ProtectedRoute>
                      <PermissionProtectedRoute permissionType="page" permissionId="dashboard" showMessage={true}>
                        <UnifiedLayout>
                          <ExecutiveDashboard />
                        </UnifiedLayout>
                      </PermissionProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Reports Page */}
                <Route
                  path="/dashboard/reports"
                  element={
                    <ProtectedRoute>
                      <PermissionProtectedRoute permissionType="page" permissionId="dashboard" showMessage={true}>
                        <UnifiedLayout>
                          <ReportsPage />
                        </UnifiedLayout>
                      </PermissionProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Services routes */}
                <Route
                  path="/services"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <ServicesPage />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/services/rendimiento"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'coordinador_operaciones', 'jefe_seguridad', 'bi']}>
                        <UnifiedLayout>
                          <RendimientoPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Leads routes */}
                <Route
                  path="/leads"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <SimpleLeadsPage />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/leads/approvals"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones', 'supply_admin', 'supply_lead', 'ejecutivo_ventas']}>
                        <UnifiedLayout>
                          <LeadApprovals />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/leads/liberacion"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead']}>
                        <UnifiedLayout>
                          <LiberacionPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/leads/evaluaciones"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'coordinador_operaciones']}>
                        <UnifiedLayout>
                          <EvaluacionesPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Custodian Invitations - Admin/Supply */}
                <Route
                  path="/admin/custodian-invitations"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply']}>
                        <UnifiedLayout>
                          <CustodianInvitationsPage />
                        </UnifiedLayout>
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
                        <UnifiedLayout>
                          <ModernRecruitment />
                        </UnifiedLayout>
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
                        <UnifiedLayout>
                          <SimulationScenarios />
                        </UnifiedLayout>
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
                        <UnifiedLayout>
                          <ExecutiveRecruitmentDashboard />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Monitoring routes */}
                <Route
                  path="/monitoring"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <MonitoringPage />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/monitoring/supply-chain"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'supply_lead', 'supply', 'coordinador_operaciones']}>
                        <UnifiedLayout>
                          <SupplyChainMonitoring />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/monitoring/forensic-audit"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'jefe_seguridad', 'analista_seguridad']}>
                        <UnifiedLayout>
                          <ForensicAuditPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Incidentes RRSS - Intelligence */}
                <Route
                  path="/incidentes-rrss"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'jefe_seguridad', 'analista_seguridad']}>
                        <UnifiedLayout>
                          <IncidentesRRSSPage />
                        </UnifiedLayout>
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
                        <UnifiedLayout>
                          <WMSPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/tickets"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <TicketsList />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/tickets/:ticketId"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <TicketDetailPage />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/ticket-config"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'bi']}>
                        <UnifiedLayout>
                          <TicketConfigPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/ticket-metrics"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'bi', 'supply_admin']}>
                        <UnifiedLayout>
                          <TicketMetricsPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/admin/ticket-templates"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin']}>
                        <UnifiedLayout>
                          <TicketTemplatesPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/settings"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <UnifiedLayout>
                          <Settings />
                        </UnifiedLayout>
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
                
                {/* Administration Hub */}
                <Route
                  path="/administration"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'bi', 'supply_admin']}>
                        <UnifiedLayout>
                          <AdministrationHub />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Legacy Maintenance routes - redirect to hub */}
                <Route
                  path="/maintenance/duplicate-cleanup"
                  element={<Navigate to="/administration" replace />}
                />
                
                <Route
                  path="/admin/version-control"
                  element={<Navigate to="/administration" replace />}
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
                      <RoleProtectedRoute allowedRoles={[...SIERCP_ALLOWED_ROLES]}>
                        <UnifiedLayout>
                          <SIERCPPage />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />

                {/* SIERCP Methodology Route */}
                <Route
                  path="/evaluation/siercp/methodology"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={[...SIERCP_ALLOWED_ROLES]}>
                        <UnifiedLayout>
                          <SIERCPMethodologyPage />
                        </UnifiedLayout>
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
                  <Route path="services" element={<CustodianServicesPage />} />
                  <Route path="vehicle" element={<CustodianVehiclePage />} />
                  <Route path="support" element={<CustodianSupportPage />} />
                  <Route path="tickets" element={<Navigate to="/custodian/support" replace />} />
                </Route>
                
                {/* Planeación Custodias */}
                <Route
                  path="/planeacion"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones', 'planificador']}>
                        <PlaneacionDashboard />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Service Creation - New full-page experience */}
                <Route
                  path="/planeacion/nuevo-servicio"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'coordinador_operaciones', 'planificador']}>
                        <ServiceCreationPage />
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Reportes de Planeación - Solo Admin/Owner */}
                <Route
                  path="/planeacion/reportes"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <UnifiedLayout>
                          <ReportesHub />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* LMS Routes */}
                {/* Public certificate verification - no auth required */}
                <Route path="/verificar-certificado" element={<VerificarCertificado />} />
                <Route path="/verificar-certificado/:codigo" element={<VerificarCertificado />} />
                
                <Route
                  path="/lms"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <LMSDashboard />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/lms/curso/:cursoId"
                  element={
                    <ProtectedRoute>
                      <UnifiedLayout>
                        <CursoViewer />
                      </UnifiedLayout>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/lms/admin"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'capacitacion_admin']}>
                        <UnifiedLayout>
                          <LMSAdmin />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
              />
                <Route
                  path="/lms/reportes"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'capacitacion_admin']}>
                        <UnifiedLayout>
                          <LMSReportes />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* LMS Admin Routes */}
                <Route
                  path="/lms/admin/cursos/nuevo"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'capacitacion_admin']}>
                        <UnifiedLayout>
                          <LMSAdminCursoNuevo />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lms/admin/cursos/:cursoId"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'capacitacion_admin']}>
                        <UnifiedLayout>
                          <LMSCursoDetalle />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/lms/admin/cursos/:cursoId/editar"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner', 'supply_admin', 'capacitacion_admin']}>
                        <UnifiedLayout>
                          <LMSAdminCursoEditar />
                        </UnifiedLayout>
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
                
                {/* Sandbox Routes */}
                <Route
                  path="/sandbox-testing"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <UnifiedLayout>
                          <SandboxTesting />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                <Route
                  path="/sandbox-deployment"
                  element={
                    <ProtectedRoute>
                      <RoleProtectedRoute allowedRoles={['admin', 'owner']}>
                        <UnifiedLayout>
                          <SandboxDeployment />
                        </UnifiedLayout>
                      </RoleProtectedRoute>
                    </ProtectedRoute>
                  }
                />
                
                {/* Architecture Documentation Route */}
                <Route
                  path="/architecture"
                  element={
                    <ProtectedRoute>
                      <ProductArchitecturePage />
                    </ProtectedRoute>
                  }
                />
                
                {/* 404 route - MUST BE LAST */}
                <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
                <GlobalResumeCTA />
              </div>
              </SandboxRouteGuard>
            </Router>
            <Toaster />
            <SonnerToaster />
          </DraftResumeProvider>
        </SandboxRoleSync>
        </SandboxProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
