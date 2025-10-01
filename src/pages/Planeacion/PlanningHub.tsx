import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { PlusCircle, Settings, BarChart3, Smartphone, Calendar, TrendingUp, Shield, AlertTriangle, ExternalLink } from 'lucide-react';
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

import type { EditableService } from '@/components/planeacion/EditServiceModal';

export default function PlanningHub() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateWorkflow, setShowCreateWorkflow] = useState(false);
  const navigate = useNavigate();
  const { isEditMode } = useEditWorkflow();
  const { logSecurityEvent } = useSecurityAudit();
  const { duplicates, checkingDuplicates } = useDuplicateCleanup();

  const totalDuplicates = duplicates?.reduce((sum, dup) => sum + dup.duplicate_count - 1, 0) || 0;

  // Check for draft on mount and auto-open dialog if exists
  useEffect(() => {
    try {
      const stored = localStorage.getItem('service_creation_workflow_dialog_state');
      if (stored === 'open') {
        // Check if there's actually a draft
        const draftKeys = Object.keys(localStorage).filter(key => 
          key.includes('service_creation_workflow')
        );
        if (draftKeys.length > 0) {
          console.log('📂 Draft detected - auto-opening creation dialog');
          setShowCreateWorkflow(true);
        }
        // Clean up the state
        localStorage.removeItem('service_creation_workflow_dialog_state');
      }
    } catch (error) {
      console.error('Error checking for draft:', error);
    }
  }, []);

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

  return (
    <div className="h-full">
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
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Crear Nuevo Servicio</DialogTitle>
          </DialogHeader>
          <RequestCreationWorkflow />
        </DialogContent>
      </Dialog>
    </div>
  );
}