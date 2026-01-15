import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Settings, BarChart3, Smartphone, Calendar, TrendingUp, Shield, AlertTriangle, ExternalLink, Save, Clock, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestCreationWorkflow } from './components/RequestCreationWorkflow';
import { OperationalDashboard } from './components/OperationalDashboard';
import { ComodatosGPSTab } from './components/ComodatosGPSTab';
import { PlanningConfigurationTab } from './components/PlanningConfigurationTab';
import { ScheduledServicesTab } from './components/ScheduledServicesTabSimple';
import { ServiceQueryTab } from './components/ServiceQueryTab';
import { AdminPerformanceTab } from './components/AdminPerformanceTab';
import { SmartEditModal } from '@/components/planeacion/SmartEditModal';
import { ArmedGuardComplianceDashboard } from '@/components/planeacion/ArmedGuardComplianceDashboard';
import { useEditWorkflow } from '@/contexts/EditWorkflowContext';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { useDuplicateCleanup } from '@/hooks/useDuplicateCleanup';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useAuth } from '@/contexts/AuthContext';
import { FEATURE_FLAGS } from '@/constants/featureFlags';

import type { EditableService } from '@/components/planeacion/EditServiceModal';

export default function PlanningHub() {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Persist active tab in URL params with sessionStorage backup
  const [activeTab, setActiveTab] = useState(() => {
    // Priority: URL params > sessionStorage > default 'services'
    const urlTab = searchParams.get('tab');
    if (urlTab) return urlTab;
    
    const sessionTab = sessionStorage.getItem('planeacion_active_tab');
    return sessionTab || 'services';
  });
  
  // Sync tab with URL and sessionStorage
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    sessionStorage.setItem('planeacion_active_tab', value);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('tab', value);
    setSearchParams(newParams, { replace: true });
  };
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isEditMode } = useEditWorkflow();
  const { logSecurityEvent } = useSecurityAudit();
  const { duplicates, checkingDuplicates } = useDuplicateCleanup();

  const totalDuplicates = duplicates?.reduce((sum, dup) => sum + dup.duplicate_count - 1, 0) || 0;

  // ROBUST: Listen for resume=1 query param for idempotent deep-link resumption
  useEffect(() => {
    const resumeFlag = searchParams.get('resume');
    
    if (resumeFlag === '1') {
      console.log('🔄 [PlanningHub] Deep-link resume detected - opening dialog unconditionally');
      
      // Set flags for idempotent restoration
      localStorage.setItem('service_creation_workflow_dialog_state', 'open');
      sessionStorage.removeItem('scw_suppress_restore');
      
      // Open dialog
      setShowCreateWorkflow(true);
      
      // Clean up query param
      searchParams.delete('resume');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Check for draft on mount and auto-open dialog if exists (proactive detection)
  useEffect(() => {
    try {
      const stored = localStorage.getItem('service_creation_workflow_dialog_state');
      const suppressionFlag = sessionStorage.getItem('scw_suppress_restore');
      
      // ✅ FASE 3: No auto-abrir si hay suppression flag
      if (suppressionFlag === '1') {
        console.log('🚫 [PlanningHub] Suppression flag active - not auto-opening');
        return;
      }
      
      // Check if there's actually a meaningful draft with exact key match
      const exactKey = user ? `service_creation_workflow_${user.id}` : 'service_creation_workflow';
      const draftData = localStorage.getItem(exactKey);
      
      if (draftData) {
        try {
          const parsed = JSON.parse(draftData);
          
          // ✅ MEJORADO: Detectar tanto datos completos como drafts parciales
          const hasCompletedData = parsed.data && (parsed.data.routeData || parsed.data.serviceData || parsed.data.assignmentData);
          const hasRouteDraft = parsed.data?.drafts?.routeDraft && 
            Object.values(parsed.data.drafts.routeDraft).some(v => v !== '' && v !== null && v !== undefined);
          const hasServiceDraft = parsed.data?.drafts?.serviceDraft && 
            Object.values(parsed.data.drafts.serviceDraft).some(v => v !== '' && v !== null && v !== undefined);
          
          const hasMeaningfulData = hasCompletedData || hasRouteDraft || hasServiceDraft;
          
          if (hasMeaningfulData && (stored === 'open' || !stored)) {
            console.log('📂 [PlanningHub] Meaningful draft detected - auto-opening creation dialog', {
              hasCompletedData,
              hasRouteDraft,
              hasServiceDraft
            });
            setShowCreateWorkflow(true);
          }
        } catch (parseError) {
          console.error('Error parsing draft data:', parseError);
        }
      }
      
      // Clean up the state if it was set
      if (stored === 'open') {
        localStorage.removeItem('service_creation_workflow_dialog_state');
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  }, [user]);

  // Persist dialog state
  useEffect(() => {
    try {
      if (showCreateWorkflow) {
        localStorage.setItem('service_creation_workflow_dialog_state', 'open');
      } else {
        localStorage.removeItem('service_creation_workflow_dialog_state');
      }
    } catch (error) {
      console.error('Error persisting dialog state:', error);
    }
  }, [showCreateWorkflow]);

  // Demo service para probar el modal contextual
  const mockService: EditableService = {
    id: 'demo-1',
    id_servicio: 'DEMO-001',
    nombre_cliente: 'Cliente Demo SA',
    origen: 'Polanco, CDMX',
    destino: 'Santa Fe, CDMX',
    fecha_hora_cita: '2024-01-15T10:00:00.000Z',
    tipo_servicio: 'custodia',
    requiere_armado: true,
    custodio_asignado: 'Miguel Ángel Hernández',
    estado_planeacion: 'pendiente_asignacion'
  };

  const handleEditModalSave = async (id: string, data: Partial<EditableService>) => {
    console.log('🔧 Demo: Guardando cambios', { id, data });
    await new Promise(resolve => setTimeout(resolve, 1000));
    return Promise.resolve();
  };

  // Check if there's a draft to show banner - MEJORADO: incluye drafts parciales
  // Also check for NEW system drafts
  const hasMeaningfulDraft = useMemo(() => {
    try {
      const exactKey = user ? `service_creation_workflow_${user.id}` : 'service_creation_workflow';
      const draftData = localStorage.getItem(exactKey);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        if (!parsed.data) return false;
        
        // Pasos completados
        const hasCompletedData = parsed.data.routeData || parsed.data.serviceData || parsed.data.assignmentData;
        
        // Borradores parciales con datos significativos
        const hasRouteDraft = parsed.data.drafts?.routeDraft && 
          Object.values(parsed.data.drafts.routeDraft).some(v => v !== '' && v !== null && v !== undefined);
        const hasServiceDraft = parsed.data.drafts?.serviceDraft && 
          Object.values(parsed.data.drafts.serviceDraft).some(v => v !== '' && v !== null && v !== undefined);
        
        return hasCompletedData || hasRouteDraft || hasServiceDraft;
      }
    } catch (e) {
      return false;
    }
    return false;
  }, [user]);

  // Check for NEW system drafts (service-draft-*)
  const hasNewSystemDraft = useMemo(() => {
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key?.startsWith('service-draft-')) {
          const data = localStorage.getItem(key);
          if (data) {
            const parsed = JSON.parse(data);
            // Check if has meaningful data
            if (parsed.cliente || parsed.origen || parsed.destino) {
              return true;
            }
          }
        }
      }
    } catch (e) {
      return false;
    }
    return false;
  }, []);

  // Combined draft check for banner display
  const hasAnyDraft = hasMeaningfulDraft || hasNewSystemDraft;

  // ✅ MEJORADO: Handler para cerrar dialog con guardado forzado
  const handleDialogClose = (open: boolean) => {
    if (!open && hasMeaningfulDraft) {
      // Mostrar confirmación si hay cambios sin guardar
      setShowDiscardConfirm(true);
    } else {
      if (!open) {
        // Forzar guardado SÍNCRONO antes de cerrar
        console.log('💾 [PlanningHub] Dialog closing - forcing save');
        window.dispatchEvent(new CustomEvent('force-workflow-save'));
        
        // 🆕 Limpiar suppression flag si no hay draft (usuario cerró limpio)
        setTimeout(() => {
          const exactKey = user ? `service_creation_workflow_${user.id}` : 'service_creation_workflow';
          const hasDraft = localStorage.getItem(exactKey);
          if (!hasDraft) {
            sessionStorage.removeItem('scw_suppress_restore');
            console.log('🧹 Cleared suppression flag - no draft exists');
          }
        }, 100);
      }
      setShowCreateWorkflow(open);
    }
  };

  // ✅ NUEVO: Prevenir cierre accidental por eventos externos (focusOutside, interactOutside)
  const handlePreventAccidentalClose = (e: Event) => {
    if (hasMeaningfulDraft) {
      console.log('🛡️ [PlanningHub] Preventing accidental dialog close - meaningful draft exists');
      e.preventDefault();
    }
  };

  return (
    <div className="h-full">
      {/* Draft Banner - Persistent reminder for BOTH systems */}
      {hasAnyDraft && !showCreateWorkflow && (
        <Alert className="mb-4 border-primary bg-primary/5">
          <Save className="h-4 w-4 text-primary" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-sm">
              <strong className="text-primary">Tienes un borrador guardado.</strong> Continúa donde lo dejaste.
            </span>
            <Button 
              variant="default" 
              size="sm"
              onClick={() => {
                // Route to appropriate system based on draft type
                if (hasNewSystemDraft && FEATURE_FLAGS.USE_NEW_SERVICE_CREATION) {
                  console.log('📂 Continuing draft in NEW system');
                  navigate('/planeacion/nuevo-servicio');
                } else if (hasMeaningfulDraft) {
                  console.log('📂 Continuing draft in legacy system');
                  sessionStorage.removeItem('scw_suppress_restore');
                  sessionStorage.setItem('scw_force_restore', '1');
                  setShowCreateWorkflow(true);
                }
              }}
              className="ml-4"
            >
              <Clock className="h-4 w-4 mr-1" />
              Continuar borrador
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      {/* Primary CTA - Top Positioned */}
      <div className="mb-6 bg-gradient-to-r from-primary/5 to-primary/10 rounded-lg p-6 border border-primary/20">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground mb-1">¿Listo para crear un nuevo servicio?</h2>
            <p className="text-sm text-muted-foreground">Flujo completo paso a paso con validación automatizada</p>
          </div>
          <Button 
            onClick={() => {
              if (FEATURE_FLAGS.USE_NEW_SERVICE_CREATION) {
                navigate('/planeacion/nuevo-servicio');
              } else {
                setShowCreateWorkflow(true);
              }
            }}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 h-auto rounded-lg font-medium"
            size="lg"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Crear Nuevo Servicio
          </Button>
        </div>
      </div>

      {/* Reportes Quick Access Widget - Admin/Owner Only */}
      {(user?.role === 'admin' || user?.role === 'owner') && (
        <Card className="mb-6 bg-gradient-to-r from-chart-1/10 to-chart-2/10 border-chart-1/30 hover:shadow-md transition-all duration-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2 text-foreground">
                  <BarChart3 className="h-5 w-5 text-chart-1" />
                  Reportes y Análisis de Performance
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualiza métricas del área y planificadores individuales
                </p>
              </div>
              <Link to="/planeacion/reportes">
                <Button variant="default" size="lg" className="gap-2">
                  Ver Reportes Completos
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      {/* Alert for duplicate services */}
      {!checkingDuplicates && totalDuplicates > 0 && (
        <Alert className="mb-6 border-warning bg-warning/5">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-warning">¡Atención!</strong> Se detectaron{' '}
              <strong className="text-warning">{totalDuplicates} servicios duplicados</strong>{' '}
              en el sistema.
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/maintenance/duplicate-cleanup')}
              className="ml-4 border-warning/20 text-warning hover:bg-warning/5"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver Limpieza
            </Button>
          </AlertDescription>
        </Alert>
      )}
      
      <Tabs value={activeTab} onValueChange={handleTabChange} className="h-full">
        <TabsList className="apple-tabs-minimal">
          <TabsTrigger value="dashboard" className="apple-tab">Dashboard</TabsTrigger>
          <TabsTrigger value="services" className="apple-tab relative">
            Servicios
            {hasMeaningfulDraft && (
              <Badge className="absolute -top-1 -right-1 h-2 w-2 p-0 bg-primary border-0" />
            )}
          </TabsTrigger>
          <TabsTrigger value="query" className="apple-tab">Consultas</TabsTrigger>
          <TabsTrigger value="gps" className="apple-tab">GPS</TabsTrigger>
          <TabsTrigger value="config" className="apple-tab">Configuración</TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="apple-content-spacing">
          <OperationalDashboard 
            showCreateWorkflow={showCreateWorkflow}
            setShowCreateWorkflow={setShowCreateWorkflow}
          />
        </TabsContent>

        <TabsContent value="services" className="apple-content-spacing">
          <ScheduledServicesTab />
        </TabsContent>

        <TabsContent value="query" className="apple-content-spacing">
          <ServiceQueryTab />
        </TabsContent>

        <TabsContent value="gps" className="apple-content-spacing">
          <ComodatosGPSTab />
        </TabsContent>

        <TabsContent value="config" className="apple-content-spacing">
          <PlanningConfigurationTab />
        </TabsContent>
      </Tabs>

      {/* Demo Modal */}
      <SmartEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        service={mockService}
        onSave={handleEditModalSave}
      />
      
      {/* Create Service Modal - LEGACY SYSTEM (only shown if feature flag is false) */}
      {!FEATURE_FLAGS.USE_NEW_SERVICE_CREATION && (
        <Dialog open={showCreateWorkflow} onOpenChange={handleDialogClose}>
          <DialogContent 
            className="max-w-6xl max-h-[90vh] overflow-y-auto" 
            aria-describedby="create-service-description"
            onInteractOutside={handlePreventAccidentalClose}
            onPointerDownOutside={handlePreventAccidentalClose}
            onFocusOutside={handlePreventAccidentalClose}
            onEscapeKeyDown={(e) => {
              if (hasMeaningfulDraft) {
                e.preventDefault();
                setShowDiscardConfirm(true);
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Crear Nuevo Servicio (Legacy)</DialogTitle>
            </DialogHeader>
            <p id="create-service-description" className="sr-only">
              Flujo de creación de servicio paso a paso con validación automatizada
            </p>
            <RequestCreationWorkflow />
          </DialogContent>
        </Dialog>
      )}

      {/* ✅ NUEVO: Confirmación de descarte */}
      <AlertDialog open={showDiscardConfirm} onOpenChange={setShowDiscardConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Cerrar sin completar?</AlertDialogTitle>
            <AlertDialogDescription>
              Tienes cambios en progreso. Tu borrador se guardará automáticamente y podrás continuar más tarde.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowDiscardConfirm(false)}>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction onClick={() => {
              console.log('💾 [PlanningHub] User confirmed close - forcing save');
              window.dispatchEvent(new CustomEvent('force-workflow-save'));
              setShowCreateWorkflow(false);
              setShowDiscardConfirm(false);
            }}>
              Cerrar (guardar borrador)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}