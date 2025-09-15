// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  Calendar, 
  Car, 
  Settings, 
  CheckCircle, 
  AlertCircle, 
  Cpu, 
  CreditCard, 
  HardDrive,
  Zap,
  Star,
  Package
} from 'lucide-react';
import { BasicInstallationForm } from './BasicInstallationForm';
import { IntelligentKitConfiguration } from './IntelligentKitConfiguration';
import { InstallationSummary } from './InstallationSummary';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useEnhancedKitsInstalacion } from '@/hooks/useEnhancedKitsInstalacion';

interface UnifiedInstallationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId?: string;
  servicioData?: any;
}

export const UnifiedInstallationDialog = ({ 
  open, 
  onOpenChange, 
  servicioId,
  servicioData 
}: UnifiedInstallationDialogProps) => {
  const [currentTab, setCurrentTab] = useState('basic');
  const [formData, setFormData] = useState({
    // Información básica
    servicio_id: servicioId || '',
    fecha_programada: null as Date | null,
    hora_inicio: '',
    tiempo_estimado: 60,
    direccion_instalacion: '',
    contacto_cliente: '',
    telefono_contacto: '',
    
    // Información del vehículo
    vehiculo_marca: '',
    vehiculo_modelo: '',
    vehiculo_año: '',
    tipo_combustible: 'gasolina',
    es_electrico: false,
    
    // Configuración de instalación
    tipo_instalacion: 'gps_basico',
    sensores_requeridos: [] as string[],
    observaciones: ''
  });

  const [kitConfiguration, setKitConfiguration] = useState({
    gps_seleccionado: '',
    sim_seleccionada: '',
    microsd_seleccionada: '',
    asignacion_automatica: true,
    justificacion: {} as Record<string, any>
  });

  const [programacionCreada, setProgramacionCreada] = useState<{
    id: string;
    success: boolean;
  } | null>(null);

  const { createProgramacion } = useProgramacionInstalaciones();
  const { 
    autoAsignarKitCompleto, 
    isCreatingKit, 
    stockStats 
  } = useEnhancedKitsInstalacion();

  // Pre-populate form data
  useEffect(() => {
    if (open && servicioData) {
      setFormData(prev => ({
        ...prev,
        servicio_id: servicioId || '',
        vehiculo_marca: servicioData.marca_vehiculo || '',
        vehiculo_modelo: servicioData.modelo_vehiculo || '',
        vehiculo_año: servicioData.año_vehiculo?.toString() || '',
        contacto_cliente: servicioData.nombre_cliente || '',
        telefono_contacto: servicioData.telefono_contacto || '',
        direccion_instalacion: servicioData.direccion_cliente || '',
        sensores_requeridos: servicioData.sensores_solicitados || []
      }));
    }
  }, [open, servicioData, servicioId]);

  // Calcular progreso del formulario
  const calculateProgress = () => {
    const basicFields = [
      formData.fecha_programada,
      formData.direccion_instalacion,
      formData.contacto_cliente,
      formData.vehiculo_marca,
      formData.vehiculo_modelo
    ];
    const completedBasic = basicFields.filter(Boolean).length;
    const progressBasic = (completedBasic / basicFields.length) * 50;

    const kitConfigured = kitConfiguration.gps_seleccionado ? 30 : 0;
    const autoAssigned = programacionCreada?.success ? 20 : 0;

    return progressBasic + kitConfigured + autoAssigned;
  };

  const handleBasicFormComplete = async (data: typeof formData) => {
    setFormData(data);
    
    try {
      // Crear la programación básica
      const result = await createProgramacion.mutateAsync({
        servicio_id: data.servicio_id,
        tipo_instalacion: data.tipo_instalacion as any,
        fecha_programada: data.fecha_programada!.toISOString(),
        direccion_instalacion: data.direccion_instalacion,
        contacto_cliente: data.contacto_cliente,
        telefono_contacto: data.telefono_contacto,
        observaciones: data.observaciones
      } as any);

      setProgramacionCreada({ 
        id: result.id, 
        success: true 
      });

      // Auto avanzar a configuración de kit
      setCurrentTab('kit');
      
    } catch (error) {
      console.error('Error creating programacion:', error);
      setProgramacionCreada({ 
        id: '', 
        success: false 
      });
    }
  };

  const handleAutoAssignKit = async () => {
    if (!programacionCreada?.id) return;

    try {
      await autoAsignarKitCompleto.mutateAsync({
        programacionId: programacionCreada.id,
        tipoVehiculo: `${formData.vehiculo_marca} ${formData.vehiculo_modelo}`,
        sensoresRequeridos: formData.sensores_requeridos
      });

      // Auto avanzar a resumen
      setCurrentTab('summary');
      
    } catch (error) {
      console.error('Error auto-assigning kit:', error);
    }
  };

  const handleManualKitConfiguration = (config: typeof kitConfiguration) => {
    setKitConfiguration(config);
    setCurrentTab('summary');
  };

  const handleComplete = () => {
    onOpenChange(false);
    // Reset form
    setCurrentTab('basic');
    setProgramacionCreada(null);
    setFormData({
      servicio_id: '',
      fecha_programada: null,
      hora_inicio: '',
      tiempo_estimado: 60,
      direccion_instalacion: '',
      contacto_cliente: '',
      telefono_contacto: '',
      vehiculo_marca: '',
      vehiculo_modelo: '',
      vehiculo_año: '',
      tipo_combustible: 'gasolina',
      es_electrico: false,
      tipo_instalacion: 'gps_basico',
      sensores_requeridos: [],
      observaciones: ''
    });
    setKitConfiguration({
      gps_seleccionado: '',
      sim_seleccionada: '',
      microsd_seleccionada: '',
      asignacion_automatica: true,
      justificacion: {}
    });
  };

  const progress = calculateProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Programar Instalación GPS - Sistema Unificado
          </DialogTitle>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progreso de configuración</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Stats dashboard */}
          {stockStats && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Pendientes</p>
                    <p className="text-lg font-semibold">{stockStats.instalaciones_pendientes}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Kits Asignados</p>
                    <p className="text-lg font-semibold">{stockStats.kits_asignados}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-red-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Stock Crítico</p>
                    <p className="text-lg font-semibold">{stockStats.stock_critico}</p>
                  </div>
                </div>
              </Card>
              
              <Card className="p-3">
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-xs text-muted-foreground">Score Promedio</p>
                    <p className="text-lg font-semibold">{Math.round(stockStats.score_promedio)}</p>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Información Básica
              {formData.fecha_programada && formData.direccion_instalacion && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            
            <TabsTrigger value="kit" disabled={!programacionCreada?.success} className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuración de Kit
              {kitConfiguration.gps_seleccionado && (
                <CheckCircle className="h-3 w-3 text-green-500" />
              )}
            </TabsTrigger>
            
            <TabsTrigger value="summary" disabled={!programacionCreada?.success} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumen
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <BasicInstallationForm 
              formData={formData}
              onFormComplete={handleBasicFormComplete}
              isLoading={createProgramacion.isPending}
            />
          </TabsContent>

          <TabsContent value="kit" className="space-y-4">
            {programacionCreada?.success && (
              <IntelligentKitConfiguration 
                programacionId={programacionCreada.id}
                formData={formData}
                onAutoAssign={handleAutoAssignKit}
                onManualConfig={handleManualKitConfiguration}
                isAutoAssigning={isCreatingKit}
              />
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {programacionCreada?.success && (
              <InstallationSummary 
                programacionId={programacionCreada.id}
                formData={formData}
                kitConfiguration={kitConfiguration}
                onComplete={handleComplete}
              />
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};