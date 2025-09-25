import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Settings, BarChart3, Smartphone, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RequestCreationWorkflow } from './components/RequestCreationWorkflow';
import { OperationalDashboard } from './components/OperationalDashboard';
import { ComodatosGPSTab } from './components/ComodatosGPSTab';
import { PlanningConfigurationTab } from './components/PlanningConfigurationTab';
import { ScheduledServicesTab } from './components/ScheduledServicesTab';
import { AdminPerformanceTab } from './components/AdminPerformanceTab';
import { ContextualEditModal } from '@/components/planeacion/ContextualEditModal';
import { useEditWorkflow } from '@/contexts/EditWorkflowContext';
import { useSecurityAudit } from '@/hooks/useSecurityAudit';
import { useDuplicateCleanup } from '@/hooks/useDuplicateCleanup';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertTriangle, ExternalLink } from 'lucide-react';
import type { EditableService } from '@/components/planeacion/EditServiceModal';

export default function PlanningHub() {
  const [activeTab, setActiveTab] = useState('create-request');
  const [showEditModal, setShowEditModal] = useState(false);
  const navigate = useNavigate();
  const { isEditMode } = useEditWorkflow();
  const { logSecurityEvent } = useSecurityAudit();
  const { duplicates, checkingDuplicates } = useDuplicateCleanup();

  const totalDuplicates = duplicates?.reduce((sum, dup) => sum + dup.duplicate_count - 1, 0) || 0;

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
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Hub de Planeación</h1>
        <p className="text-muted-foreground">
          Gestiona solicitudes de servicios desde clientes hasta asignación de custodios
        </p>
      </div>

      {/* Duplicate Services Alert */}
      {!checkingDuplicates && totalDuplicates > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <div>
              <strong className="text-amber-800">¡Atención!</strong> Se detectaron{' '}
              <strong className="text-amber-900">{totalDuplicates} servicios duplicados</strong>{' '}
              en el sistema. Esto puede causar conflictos en la asignación.
            </div>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => navigate('/maintenance/duplicate-cleanup')}
              className="ml-4 border-amber-300 text-amber-800 hover:bg-amber-100"
            >
              <ExternalLink className="h-4 w-4 mr-1" />
              Ver Limpieza
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Main Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-7 lg:w-[1400px]">
          <TabsTrigger value="create-request" className={`flex items-center gap-2 ${isEditMode ? 'bg-blue-100 text-blue-700' : ''}`}>
            <PlusCircle className="h-4 w-4" />
            {isEditMode ? 'Editando' : 'Crear Solicitud'}
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="scheduled-services" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Servicios
          </TabsTrigger>
          <TabsTrigger value="gps-comodatos" className="flex items-center gap-2">
            <Smartphone className="h-4 w-4" />
            GPS
          </TabsTrigger>
          <TabsTrigger value="admin-performance" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Performance
          </TabsTrigger>
          <TabsTrigger value="configuration" className="flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Config
          </TabsTrigger>
          <TabsTrigger value="demo-ux" className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white">
            🚀 Demo UX
          </TabsTrigger>
        </TabsList>

        {/* Crear Solicitud - Core Workflow */}
        <TabsContent value="create-request" className="space-y-6 mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Flujo de Creación de Solicitudes</CardTitle>
            </CardHeader>
            <CardContent>
              <RequestCreationWorkflow />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Dashboard Operativo */}
        <TabsContent value="dashboard" className="space-y-6 mt-6">
          <OperationalDashboard />
        </TabsContent>

        {/* Servicios Programados */}
        <TabsContent value="scheduled-services" className="space-y-6 mt-6">
          <ScheduledServicesTab />
        </TabsContent>

        {/* GPS Comodatos - Workflow Independiente */}
        <TabsContent value="gps-comodatos" className="space-y-6 mt-6">
          <ComodatosGPSTab />
        </TabsContent>

        {/* Admin Performance Dashboard */}
        <TabsContent value="admin-performance" className="space-y-6 mt-6">
          <AdminPerformanceTab />
        </TabsContent>

        {/* Configuración - Maestros Simplificados */}
        <TabsContent value="configuration" className="space-y-6 mt-6">
          <PlanningConfigurationTab />
        </TabsContent>

        {/* Demo UX Mejorado */}
        <TabsContent value="demo-ux" className="space-y-6 mt-6">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-bold">🚀 Workflow UX Mejorado</h2>
            <p className="text-muted-foreground">Sistema contextual e inteligente implementado</p>
            <Button onClick={() => setShowEditModal(true)} size="lg" className="bg-blue-600 hover:bg-blue-700">
              Probar Modal Contextual
            </Button>
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal Contextual */}
      <ContextualEditModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        service={mockService}
        onSave={handleEditModalSave}
      />
    </div>
  );
}