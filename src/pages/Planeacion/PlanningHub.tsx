import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Settings, BarChart3, Smartphone, Calendar, TrendingUp, Shield, AlertTriangle, ExternalLink, Save, Clock } from 'lucide-react';
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

import type { EditableService } from '@/components/planeacion/EditServiceModal';

export default function PlanningHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
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
      
      // Check if there's actually a meaningful draft with exact key match
      const exactKey = user ? `service_creation_workflow_${user.id}` : 'service_creation_workflow';
      const draftData = localStorage.getItem(exactKey);
      
      if (draftData && suppressionFlag !== '1') {
        try {
          const parsed = JSON.parse(draftData);
          
          // Auto-open if there's meaningful data (no time threshold)
          const hasMeaningfulData = parsed.data && (parsed.data.routeData || parsed.data.serviceData || parsed.data.assignmentData);
          
          if (hasMeaningfulData && (stored === 'open' || !stored)) {
            console.log('📂 [PlanningHub] Meaningful draft detected - auto-opening creation dialog');
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

  // Check if there's a draft to show banner
  const hasDraftBanner = (() => {
    try {
      const exactKey = user ? `service_creation_workflow_${user.id}` : 'service_creation_workflow';
      const draftData = localStorage.getItem(exactKey);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        return parsed.data && (parsed.data.routeData || parsed.data.serviceData || parsed.data.assignmentData);
      }
    } catch (e) {
      return false;
    }
    return false;
  })();

  return (
    <div className="h-full">
      {/* Draft Banner - Persistent reminder */}
      {hasDraftBanner && !showCreateWorkflow && (
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
                console.log('📂 User clicked banner to continue draft');
                setShowCreateWorkflow(true);
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
            onClick={() => setShowCreateWorkflow(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-3 h-auto rounded-lg font-medium"
            size="lg"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            Crear Nuevo Servicio
          </Button>
        </div>
      </div>
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
      
      <Tabs defaultValue="dashboard" className="h-full">
        <TabsList className="apple-tabs-minimal">
          <TabsTrigger value="dashboard" className="apple-tab">Dashboard</TabsTrigger>
          <TabsTrigger value="services" className="apple-tab">Servicios</TabsTrigger>
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
      
      {/* Create Service Modal */}
      <Dialog open={showCreateWorkflow} onOpenChange={setShowCreateWorkflow}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto" aria-describedby="create-service-description">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio</DialogTitle>
          </DialogHeader>
          <p id="create-service-description" className="sr-only">
            Flujo de creación de servicio paso a paso con validación automatizada
          </p>
          <RequestCreationWorkflow />
        </DialogContent>
      </Dialog>
    </div>
  );
}