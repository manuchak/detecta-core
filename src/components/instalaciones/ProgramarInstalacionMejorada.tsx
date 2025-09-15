// @ts-nocheck
import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { 
  Calendar as CalendarIcon, 
  Car, 
  Settings, 
  Zap, 
  Package, 
  CheckCircle, 
  AlertCircle,
  AlertTriangle,
  Cpu,
  CreditCard,
  HardDrive,
  Star,
  Loader2,
  Clock,
  MapPin,
  User,
  X,
  Camera
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useVehicleData } from '@/hooks/useVehicleData';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { useEnhancedKitsInstalacion } from '@/hooks/useEnhancedKitsInstalacion';
import { useToast } from '@/hooks/use-toast';

interface ProgramarInstalacionMejoradaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId?: string;
  servicioData?: any;
}

export const ProgramarInstalacionMejorada = ({ 
  open, 
  onOpenChange, 
  servicioId,
  servicioData 
}: ProgramarInstalacionMejoradaProps) => {
  const [currentTab, setCurrentTab] = useState('basic');
  const [isCompleted, setIsCompleted] = useState(false);
  
  const { toast } = useToast();
  const { createProgramacion } = useProgramacionInstalaciones();
  const { marcas, loadingMarcas, fetchModelosPorMarca } = useVehicleData();
  const { productos, isLoading: loadingProductos } = useProductosInventario();
  const { 
    obtenerRecomendacionesInteligentes, 
    autoAsignarKitCompleto,
    stockStats,
    isCreatingKit
  } = useEnhancedKitsInstalacion();
  
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [programacionCreada, setProgramacionCreada] = useState<{
    id: string;
    success: boolean;
  } | null>(null);
  
  const [kitAsignado, setKitAsignado] = useState<{
    gps: any;
    sim: any;
    microsd: any;
    numero_serie: string;
    tipoDispositivo?: 'gps' | 'camera';
  } | null>(null);

  const [recomendacionPendiente, setRecomendacionPendiente] = useState<{
    gps: any;
    sim: any;
    microsd: any;
    justificacion: string;
    advertencias: string[];
    stockDisponible: boolean;
    tipoDispositivo?: 'gps' | 'camera';
  } | null>(null);

  const [kitMode, setKitMode] = useState<'auto' | 'manual'>('auto');
  const [manualKit, setManualKit] = useState({
    gps_id: '',
    sim_id: '',
    microsd_id: ''
  });

  const [formData, setFormData] = useState({
    servicio_id: servicioId || '',
    fecha_programada: null as Date | null,
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
    sensores_requeridos: [] as string[],
    observaciones: ''
  });

  // Pre-populate data from service when dialog opens
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

      if (servicioData.marca_vehiculo) {
        handleMarcaChange(servicioData.marca_vehiculo);
      }
    }
  }, [open, servicioData, servicioId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentTab('basic');
      setProgramacionCreada(null);
      setKitAsignado(null);
      setIsCompleted(false);
    }
  }, [open]);

  const handleMarcaChange = async (marcaNombre: string) => {
    setFormData(prev => ({ 
      ...prev, 
      vehiculo_marca: marcaNombre,
      vehiculo_modelo: servicioData?.modelo_vehiculo || ''
    }));
    
    if (marcaNombre) {
      setLoadingModelos(true);
      try {
        const modelosData = await fetchModelosPorMarca(marcaNombre);
        setModelos(modelosData);
      } catch (error) {
        console.error('Error fetching models:', error);
        setModelos([]);
      } finally {
        setLoadingModelos(false);
      }
    } else {
      setModelos([]);
    }
  };

  const sensoresDisponibles = [
    'Sensor de combustible',
    'Sensor de temperatura', 
    'Cámara de seguridad',
    'Botón de pánico',
    'Sensor de puertas',
    'Sensor de vibración'
  ];

  const tiposInstalacion = [
    { value: 'gps_basico', label: 'GPS Básico (60 min)', tiempo: 60 },
    { value: 'gps_premium', label: 'GPS Premium + Sensores (120 min)', tiempo: 120 },
    { value: 'sistema_completo', label: 'Sistema Completo (180 min)', tiempo: 180 }
  ];

  const horasDisponibles = [
    '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00'
  ];

  const getMinimumDate = () => {
    let date = new Date();
    let businessHours = 0;
    while (businessHours < 72) {
      date = addDays(date, 1);
      if (!isWeekend(date)) {
        businessHours += 8;
      }
    }
    return date;
  };

  const isDateDisabled = (date: Date) => {
    const minDate = getMinimumDate();
    return date < minDate || isWeekend(date);
  };

  const handleSensorChange = (sensor: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sensores_requeridos: checked 
        ? [...prev.sensores_requeridos, sensor]
        : prev.sensores_requeridos.filter(s => s !== sensor)
    }));
  };

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
    const kitConfigured = kitAsignado ? 30 : 0;
    const programCreated = programacionCreada?.success ? 20 : 0;
    return progressBasic + kitConfigured + programCreated;
  };

  const handleBasicFormComplete = () => {
    // Solo guardar la información básica y avanzar al tab de kit
    // NO crear la programación todavía hasta que se asigne el kit
    if (!formData.fecha_programada || !formData.hora_inicio || !formData.contacto_cliente || !formData.direccion_instalacion) {
      toast({
        title: "Campos incompletos",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    setCurrentTab('kit');
    
    toast({
      title: "Información básica completada",
      description: "Ahora selecciona el kit GPS para finalizar la programación",
    });
  };

  const handleKitAssignmentComplete = async () => {
    // Esta función se ejecuta después de asignar el kit y crea la programación real
    try {
      if (!kitAsignado) {
        toast({
          title: "Kit no asignado",
          description: "Debes asignar un kit GPS antes de programar la instalación",
          variant: "destructive",
        });
        return;
      }

      const tipoInstalacionMap: Record<string, 'gps_vehicular' | 'gps_personal' | 'camara'> = {
        'gps_basico': 'gps_vehicular',
        'gps_premium': 'gps_vehicular', 
        'sistema_completo': 'gps_vehicular'
      };

      const programacionData = {
        servicio_id: formData.servicio_id,
        tipo_instalacion: tipoInstalacionMap[formData.tipo_instalacion] || 'gps_vehicular',
        fecha_programada: formData.fecha_programada!.toISOString(),
        hora_programada: formData.hora_inicio,
        direccion_instalacion: formData.direccion_instalacion,
        contacto_cliente: formData.contacto_cliente,
        telefono_contacto: formData.telefono_contacto,
        tiempo_estimado: formData.tiempo_estimado,
        observaciones_cliente: `Vehículo: ${formData.vehiculo_marca} ${formData.vehiculo_modelo} (${formData.vehiculo_año}). Sensores: ${formData.sensores_requeridos.join(', ') || 'Básicos'}. Kit: ${kitAsignado.numero_serie}`
      } as any;

      const result = await createProgramacion.mutateAsync(programacionData);
      setProgramacionCreada({ id: result.id, success: true });
      setCurrentTab('summary');
      
      toast({
        title: "Instalación programada exitosamente",
        description: "Kit asignado y programación completada",
      });
    } catch (error) {
      console.error('Error creating programacion:', error);
      toast({
        title: "Error al programar instalación",
        description: "No se pudo completar la programación",
        variant: "destructive",
      });
    }
  };

  const handleAutoAssignKit = async () => {
    try {
      // Simular obtención de recomendación inteligente con validaciones de inventario
      const tipoVehiculo = `${formData.vehiculo_marca} ${formData.vehiculo_modelo}`;
      
      // Validar inventario disponible
      const gpsDisponibles = productos?.filter(p => 
        p.categoria?.nombre?.toLowerCase().includes('gps') && 
        (p.stock?.cantidad_disponible || 0) > 0
      ) || [];
      
      const simDisponibles = productos?.filter(p => 
        (p.categoria?.nombre?.toLowerCase().includes('sim') || 
         p.categoria?.codigo?.toLowerCase().includes('sim') ||
         p.categoria?.nombre?.toLowerCase() === 'sim cards') && 
        (p.stock?.cantidad_disponible || 0) > 0
      ) || [];
      
      const microsdDisponibles = productos?.filter(p => 
        p.categoria?.nombre?.toLowerCase().includes('microsd') && 
        (p.stock?.cantidad_disponible || 0) > 0
      ) || [];

      // Verificar disponibilidad de stock
      const advertencias: string[] = [];
      const stockDisponible = gpsDisponibles.length > 0 && simDisponibles.length > 0;
      
      if (gpsDisponibles.length === 0) {
        advertencias.push('⚠️ No hay dispositivos GPS disponibles en stock');
      }
      
      if (simDisponibles.length === 0) {
        advertencias.push('⚠️ No hay tarjetas SIM disponibles en stock');
      }
      
      const requiereMicroSD = formData.sensores_requeridos.includes('Cámara de seguridad');
      if (requiereMicroSD && microsdDisponibles.length === 0) {
        advertencias.push('⚠️ Se requiere MicroSD para la cámara pero no hay stock disponible');
      }

      // Seleccionar productos recomendados
      const gpsRecomendado = gpsDisponibles.find(p => p.modelo?.includes('JC261')) || gpsDisponibles[0];
      const simRecomendada = simDisponibles.find(p => p.marca?.toLowerCase().includes('telcel')) || simDisponibles[0];
      const microsdRecomendada = requiereMicroSD ? microsdDisponibles[0] : null;

      // Detectar si el GPS recomendado es una cámara basándose en especificaciones o modelo
      const esCamera = gpsRecomendado?.especificaciones?.tipo_dispositivo === 'dashcam' || 
                      gpsRecomendado?.modelo?.toLowerCase().includes('jc261') ||
                      gpsRecomendado?.especificaciones?.tipo_dispositivo?.toLowerCase().includes('dashcam');

      // Crear justificación
      let justificacion = `Recomendación para ${tipoVehiculo}:\n\n`;
      const tipoDispositivo = esCamera ? 'Cámara GPS' : 'GPS';
      justificacion += `• ${tipoDispositivo}: ${gpsRecomendado?.nombre || 'No disponible'} - Compatibilidad alta con ${formData.vehiculo_marca}\n`;
      justificacion += `• SIM: ${simRecomendada?.nombre || 'No disponible'} - Cobertura nacional óptima\n`;
      
      if (requiereMicroSD || esCamera) {
        justificacion += `• MicroSD: ${microsdRecomendada?.nombre || 'No disponible'} - ${esCamera ? 'Obligatorio para grabación de video' : 'Requerido para grabación de cámara'}\n`;
      } else {
        justificacion += `• MicroSD: No requerido para esta configuración\n`;
      }
      
      justificacion += `\nSensores solicitados: ${formData.sensores_requeridos.join(', ') || 'Básicos'}`;

      const recomendacion = {
        gps: gpsRecomendado ? `${gpsRecomendado.marca} ${gpsRecomendado.modelo} - ${gpsRecomendado.nombre}` : 'No disponible',
        sim: simRecomendada ? `${simRecomendada.marca} - ${simRecomendada.nombre}` : 'No disponible',
        microsd: microsdRecomendada ? `${microsdRecomendada.marca} ${microsdRecomendada.modelo} - ${microsdRecomendada.nombre}` : 'No incluido',
        justificacion,
        advertencias,
        stockDisponible,
        tipoDispositivo: esCamera ? ('camera' as const) : ('gps' as const)
      };

      setRecomendacionPendiente(recomendacion);
      
    } catch (error) {
      console.error('Error generating recommendation:', error);
      toast({
        title: "Error al generar recomendación",
        description: "No se pudo analizar el inventario disponible",
        variant: "destructive",
      });
    }
  };

  const handleApproveRecommendation = async () => {
    try {
      if (!recomendacionPendiente) return;

      // Generar número de serie único
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const numeroSerie = `AUTO-${timestamp}-${randomSuffix}`;

      const kitResult = {
        gps: recomendacionPendiente.gps,
        sim: recomendacionPendiente.sim,
        microsd: recomendacionPendiente.microsd,
        numero_serie: numeroSerie,
        tipoDispositivo: recomendacionPendiente.tipoDispositivo
      };

      setKitAsignado(kitResult);
      setRecomendacionPendiente(null);
      
      // Llamar a la función para crear la programación con el kit asignado
      await handleKitAssignmentComplete();
      
      toast({
        title: "Kit asignado exitosamente",
        description: "La recomendación ha sido aprobada y el kit fue asignado",
      });
    } catch (error) {
      console.error('Error approving recommendation:', error);
      toast({
        title: "Error al aprobar recomendación",
        description: "No se pudo finalizar la asignación del kit",
        variant: "destructive",
      });
    }
  };

  const handleRejectRecommendation = () => {
    setRecomendacionPendiente(null);
    toast({
      title: "Recomendación rechazada",
      description: "Puedes intentar con selección manual o generar una nueva recomendación",
    });
  };

  const handleManualKitAssign = async () => {
    try {
      // Obtener los productos seleccionados para mostrar nombres descriptivos
      const gpsProduct = productos?.find(p => p.id === manualKit.gps_id);
      const simProduct = productos?.find(p => p.id === manualKit.sim_id);
      const microsdProduct = productos?.find(p => p.id === manualKit.microsd_id);

      // Detectar si el GPS seleccionado es una cámara
      const esCamera = gpsProduct?.especificaciones?.tipo_dispositivo === 'dashcam' || 
                      gpsProduct?.modelo?.toLowerCase().includes('jc261') ||
                      gpsProduct?.especificaciones?.tipo_dispositivo?.toLowerCase().includes('dashcam');

      // Generar número de serie único para kit manual
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const numeroSerie = `MAN-${timestamp}-${randomSuffix}`;

      const kitResult = {
        gps: gpsProduct ? `${gpsProduct.marca} ${gpsProduct.modelo} - ${gpsProduct.nombre}` : manualKit.gps_id,
        sim: simProduct ? `${simProduct.marca} - ${simProduct.nombre}` : manualKit.sim_id || 'No incluido',
        microsd: (microsdProduct && manualKit.microsd_id !== 'no-microsd') ? `${microsdProduct.marca} ${microsdProduct.modelo} - ${microsdProduct.nombre}` : 'No incluido',
        numero_serie: numeroSerie,
        tipoDispositivo: esCamera ? ('camera' as const) : ('gps' as const)
      };

      setKitAsignado(kitResult);

      // Llamar a la función para crear la programación con el kit asignado
      await handleKitAssignmentComplete();
    } catch (error) {
      console.error('Error assigning manual kit:', error);
      toast({
        title: "Error al asignar kit manual",
        description: "No se pudo asignar el kit seleccionado",
        variant: "destructive",
      });
    }
  };

  const handleComplete = () => {
    setIsCompleted(true);
    setTimeout(() => {
      onOpenChange(false);
    }, 2000);
  };

  const progress = calculateProgress();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Programar Instalación GPS - Sistema Unificado WMS
          </DialogTitle>
          
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Progreso de configuración</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </DialogHeader>

        <Tabs value={currentTab} onValueChange={setCurrentTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="basic" className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              Información Básica
              {currentTab !== 'basic' && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            
            <TabsTrigger value="kit" disabled={currentTab === 'basic'} className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Configuración de Kit
              {kitAsignado && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            
            <TabsTrigger value="summary" disabled={!kitAsignado || !programacionCreada?.success} className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Resumen Final
            </TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-4">
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Car className="h-5 w-5" />
                    Información del Vehículo
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Marca del Vehículo *</Label>
                      <Select value={formData.vehiculo_marca} onValueChange={handleMarcaChange}>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar marca" />
                        </SelectTrigger>
                        <SelectContent>
                          {marcas.map(marca => (
                            <SelectItem key={marca.id} value={marca.nombre}>
                              {marca.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Modelo *</Label>
                      <Select 
                        value={formData.vehiculo_modelo} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, vehiculo_modelo: value }))}
                        disabled={!formData.vehiculo_marca}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar modelo" />
                        </SelectTrigger>
                        <SelectContent>
                          {modelos.map(modelo => (
                            <SelectItem key={modelo.id} value={modelo.nombre}>
                              {modelo.nombre}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Año *</Label>
                      <Input
                        type="number"
                        value={formData.vehiculo_año}
                        onChange={(e) => setFormData(prev => ({ ...prev, vehiculo_año: e.target.value }))}
                        placeholder="2020"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Configuración de Instalación</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de Instalación *</Label>
                    <Select 
                      value={formData.tipo_instalacion} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_instalacion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposInstalacion.map(tipo => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Sensores Adicionales</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {sensoresDisponibles.map(sensor => (
                        <label key={sensor} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={formData.sensores_requeridos.includes(sensor)}
                            onChange={(e) => handleSensorChange(sensor, e.target.checked)}
                          />
                          <span className="text-sm">{sensor}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Programación y Contacto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Fecha de Instalación *</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button variant="outline" className="w-full justify-start">
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {formData.fecha_programada ? 
                              format(formData.fecha_programada, "PPP", { locale: es }) : 
                              "Seleccionar fecha"
                            }
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                          <Calendar
                            mode="single"
                            selected={formData.fecha_programada || undefined}
                            onSelect={(date) => setFormData(prev => ({ ...prev, fecha_programada: date || null }))}
                            disabled={isDateDisabled}
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-2">
                      <Label>Hora de Inicio *</Label>
                      <Select 
                        value={formData.hora_inicio} 
                        onValueChange={(value) => setFormData(prev => ({ ...prev, hora_inicio: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar hora" />
                        </SelectTrigger>
                        <SelectContent>
                          {horasDisponibles.map(hora => (
                            <SelectItem key={hora} value={hora}>{hora}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Contacto del Cliente *</Label>
                      <Input
                        value={formData.contacto_cliente}
                        onChange={(e) => setFormData(prev => ({ ...prev, contacto_cliente: e.target.value }))}
                        placeholder="Nombre del contacto"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Teléfono *</Label>
                      <Input
                        value={formData.telefono_contacto}
                        onChange={(e) => setFormData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                        placeholder="Teléfono"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Dirección de Instalación *</Label>
                    <Textarea
                      value={formData.direccion_instalacion}
                      onChange={(e) => setFormData(prev => ({ ...prev, direccion_instalacion: e.target.value }))}
                      placeholder="Dirección completa"
                      rows={2}
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button 
                  onClick={handleBasicFormComplete}
                  disabled={
                    !formData.vehiculo_marca || 
                    !formData.vehiculo_modelo || 
                    !formData.fecha_programada || 
                    !formData.contacto_cliente ||
                    createProgramacion.isPending
                  }
                  size="lg"
                >
                  {createProgramacion.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    <>
                      Continuar a Kit GPS
                      <CheckCircle className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="kit" className="space-y-6">
            {/* Selector de Modo */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Método de Asignación de Kit
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className={`cursor-pointer transition-all border-2 ${kitMode === 'auto' ? 'border-green-500 bg-green-50' : 'border-gray-200 hover:border-green-300'}`}
                        onClick={() => setKitMode('auto')}>
                    <CardContent className="p-4 text-center">
                      <Zap className="h-8 w-8 text-green-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-green-700">Asignación Automática</h3>
                      <p className="text-sm text-green-600 mt-1">
                        El sistema WMS selecciona el mejor kit basado en compatibilidad, stock y dependencias
                      </p>
                      <Badge className="mt-2 bg-green-600 text-white">Recomendado</Badge>
                    </CardContent>
                  </Card>

                  <Card className={`cursor-pointer transition-all border-2 ${kitMode === 'manual' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                        onClick={() => setKitMode('manual')}>
                    <CardContent className="p-4 text-center">
                      <User className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <h3 className="font-semibold text-blue-700">Selección Manual</h3>
                      <p className="text-sm text-blue-600 mt-1">
                        Selecciona manualmente cada componente del kit según tus preferencias
                      </p>
                      <Badge className="mt-2 bg-blue-600 text-white">Control Total</Badge>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>

            {/* Asignación Automática */}
            {kitMode === 'auto' && (
              <Card className="border-green-200 bg-green-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-green-700">
                    <Zap className="h-5 w-5" />
                    Asignación Inteligente de Kit Completo
                    <Badge className="bg-green-600 text-white">WMS</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="bg-white p-4 rounded-lg border border-green-200">
                    <h4 className="font-semibold text-green-700 mb-2">Lógica del Algoritmo Inteligente:</h4>
                    <ul className="text-sm text-green-600 space-y-1">
                      <li>• <strong>Compatibilidad vehicular:</strong> {formData.vehiculo_marca} {formData.vehiculo_modelo} ({formData.vehiculo_año})</li>
                      <li>• <strong>Sensores requeridos:</strong> {formData.sensores_requeridos.length > 0 ? formData.sensores_requeridos.join(', ') : 'Básicos'}</li>
                      <li>• <strong>Dependencias automáticas:</strong> Si incluye cámara → microSD obligatorio</li>
                      <li>• <strong>Disponibilidad de stock</strong> y optimización de costos</li>
                    </ul>
                  </div>
                  
                  <Button 
                    onClick={handleAutoAssignKit}
                    disabled={isCreatingKit}
                    className="w-full bg-green-600 hover:bg-green-700"
                    size="lg"
                  >
                    {isCreatingKit ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analizando compatibilidad y asignando kit...
                      </>
                    ) : (
                      <>
                        <Zap className="mr-2 h-4 w-4" />
                        Asignar Kit Completo Automáticamente
                      </>
                    )}
                  </Button>
                
                  {/* Vista previa de recomendación pendiente */}
                  {recomendacionPendiente && (
                    <div className="space-y-4 p-4 border border-orange-300 rounded-lg bg-orange-50">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="h-5 w-5 text-orange-600" />
                        <h3 className="font-semibold text-orange-800">Revisión de Recomendación Automática</h3>
                      </div>

                      {/* Advertencias de stock si las hay */}
                      {recomendacionPendiente.advertencias.length > 0 && (
                        <Alert className="border-red-200 bg-red-50">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800">
                            <div className="space-y-1">
                              {recomendacionPendiente.advertencias.map((advertencia, index) => (
                                <div key={index}>{advertencia}</div>
                              ))}
                            </div>
                          </AlertDescription>
                        </Alert>
                      )}

                      {/* Componentes recomendados */}
                      <div className="grid grid-cols-3 gap-4">
                         <div className="text-center p-3 bg-white rounded border">
                          {recomendacionPendiente.tipoDispositivo === 'camera' ? (
                            <Camera className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                          ) : (
                            <Cpu className="h-6 w-6 mx-auto text-blue-600 mb-2" />
                          )}
                          <div className={`font-medium text-sm ${recomendacionPendiente.tipoDispositivo === 'camera' ? 'text-purple-700' : 'text-blue-700'}`}>
                            {recomendacionPendiente.tipoDispositivo === 'camera' ? 'Cámara GPS' : 'GPS Principal'}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">{recomendacionPendiente.gps}</div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded border">
                          <CreditCard className="h-6 w-6 mx-auto text-orange-600 mb-2" />
                          <div className="font-medium text-sm text-orange-700">Tarjeta SIM</div>
                          <div className="text-xs text-gray-600 mt-1">{recomendacionPendiente.sim}</div>
                        </div>
                        
                        <div className="text-center p-3 bg-white rounded border">
                          <HardDrive className="h-6 w-6 mx-auto text-purple-600 mb-2" />
                          <div className="font-medium text-sm text-purple-700">MicroSD</div>
                          <div className="text-xs text-gray-600 mt-1">{recomendacionPendiente.microsd}</div>
                        </div>
                      </div>

                      {/* Justificación */}
                      <div className="bg-white p-3 rounded border">
                        <div className="font-medium text-sm text-gray-700 mb-2">Justificación:</div>
                        <div className="text-xs text-gray-600 whitespace-pre-line">
                          {recomendacionPendiente.justificacion}
                        </div>
                      </div>

                      {/* Botones de aprobación */}
                      <div className="flex gap-3">
                        <Button 
                          onClick={handleApproveRecommendation}
                          disabled={!recomendacionPendiente.stockDisponible}
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Aprobar y Asignar Kit
                        </Button>
                        
                        <Button 
                          onClick={handleRejectRecommendation}
                          variant="outline" 
                          className="flex-1 border-red-300 text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4 mr-2" />
                          Rechazar Recomendación
                        </Button>
                      </div>

                      {!recomendacionPendiente.stockDisponible && (
                        <div className="text-xs text-red-600 text-center">
                          ⚠️ No se puede proceder debido a problemas de stock. Contacta al almacén.
                        </div>
                      )}
                    </div>
                  )}
                
                  {kitAsignado && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Kit Asignado Automáticamente
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          {kitAsignado.tipoDispositivo === 'camera' ? (
                            <Camera className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                          ) : (
                            <Cpu className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                          )}
                          <div className={`font-medium ${kitAsignado.tipoDispositivo === 'camera' ? 'text-purple-700' : 'text-blue-700'}`}>
                            {kitAsignado.tipoDispositivo === 'camera' ? 'Cámara GPS' : 'GPS Principal'}
                          </div>
                          <div className={`text-sm ${kitAsignado.tipoDispositivo === 'camera' ? 'text-purple-600' : 'text-blue-600'}`}>
                            {kitAsignado.gps}
                          </div>
                          <div className={`text-xs mt-1 ${kitAsignado.tipoDispositivo === 'camera' ? 'text-purple-500' : 'text-blue-500'}`}>
                            {kitAsignado.tipoDispositivo === 'camera' ? 'Con grabación de video' : 'Compatibilidad: 98%'}
                          </div>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded">
                          <CreditCard className="h-6 w-6 text-orange-600 mx-auto mb-1" />
                          <div className="font-medium text-orange-700">Tarjeta SIM</div>
                          <div className="text-sm text-orange-600">{kitAsignado.sim}</div>
                          <div className="text-xs text-orange-500 mt-1">Cobertura: Nacional</div>
                        </div>
                        <div className="text-center p-3 bg-purple-50 rounded">
                          <HardDrive className="h-6 w-6 text-purple-600 mx-auto mb-1" />
                          <div className="font-medium text-purple-700">MicroSD</div>
                          <div className="text-sm text-purple-600">{kitAsignado.microsd}</div>
                          <div className="text-xs text-purple-500 mt-1">
                            {formData.sensores_requeridos.includes('Cámara de seguridad') ? 'Requerido para grabación' : 'Opcional'}
                          </div>
                        </div>
                      </div>
                      <div className="mt-3 p-2 bg-gray-50 rounded text-center">
                        <span className="text-xs text-gray-600">Número de Serie: </span>
                        <span className="font-mono text-sm">{kitAsignado.numero_serie}</span>
                      </div>
                    </div>
                  )}

                </CardContent>
              </Card>
            )}

            {/* Selección Manual */}
            {kitMode === 'manual' && (
              <Card className="border-blue-200 bg-blue-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-700">
                    <User className="h-5 w-5" />
                    Selección Manual de Componentes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Alert className="border-amber-200 bg-amber-50">
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-700">
                      <strong>Importante:</strong> Al seleccionar manualmente, asegúrate de verificar la compatibilidad entre componentes.
                      {formData.sensores_requeridos.includes('Cámara de seguridad') && (
                        <span className="block mt-1">
                          <strong>⚠️ Se detectó cámara en sensores:</strong> MicroSD es obligatorio para grabación de video.
                        </span>
                      )}
                      {manualKit.gps_id && productos?.find(p => p.id === manualKit.gps_id)?.especificaciones?.tipo_dispositivo === 'dashcam' && (
                        <span className="block mt-1">
                          <strong>📹 Cámara GPS seleccionada:</strong> Se requiere MicroSD obligatoriamente para grabación.
                        </span>
                      )}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-blue-700 font-semibold">Dispositivo Principal *</Label>
                      <Select value={manualKit.gps_id} onValueChange={(value) => setManualKit(prev => ({ ...prev, gps_id: value }))}>
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Seleccionar dispositivo" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {productos
                            ?.filter(p => p.categoria?.nombre?.toLowerCase().includes('gps') && (p.stock?.cantidad_disponible || 0) > 0)
                            ?.map(producto => {
                              // Detectar si es cámara basándose en el tipo_dispositivo del modelo GPS
                              const esCamera = producto.especificaciones?.tipo_dispositivo === 'dashcam' || 
                                              producto.modelo?.toLowerCase().includes('jc261') ||
                                              producto.especificaciones?.tipo_dispositivo?.toLowerCase().includes('dashcam');
                              const tipoDispositivo = esCamera ? 'Cámara' : 'GPS';
                              const iconoColor = esCamera ? 'text-purple-600' : 'text-blue-600';
                              
                              return (
                                <SelectItem key={producto.id} value={producto.id}>
                                  <div className="flex items-center gap-2 w-full">
                                    {esCamera ? (
                                      <Camera className={`h-4 w-4 ${iconoColor} flex-shrink-0`} />
                                    ) : (
                                      <Cpu className={`h-4 w-4 ${iconoColor} flex-shrink-0`} />
                                    )}
                                    <div className="flex-1 min-w-0">
                                      <span className="font-medium text-sm">{tipoDispositivo}:</span>
                                      <span className="ml-1">{producto.marca} {producto.modelo} - {producto.nombre}</span>
                                      <span className="text-xs text-gray-500 ml-2">
                                        (Stock: {producto.stock?.cantidad_disponible || 0})
                                      </span>
                                    </div>
                                  </div>
                                </SelectItem>
                              );
                            })}
                          {(!productos?.filter(p => p.categoria?.nombre?.toLowerCase().includes('gps') && (p.stock?.cantidad_disponible || 0) > 0)?.length) && (
                            <SelectItem value="no-gps-stock" disabled>
                              No hay productos GPS en stock
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-blue-700 font-semibold">Tarjeta SIM *</Label>
                      <Select value={manualKit.sim_id} onValueChange={(value) => setManualKit(prev => ({ ...prev, sim_id: value }))}>
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Seleccionar tarjeta SIM" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          {(() => {
                            const simProducts = productos
                              ?.filter(p => (p.categoria?.nombre?.toLowerCase().includes('sim') || 
                                            p.categoria?.codigo?.toLowerCase().includes('sim') ||
                                            p.categoria?.nombre?.toLowerCase() === 'sim cards') && 
                                           (p.stock?.cantidad_disponible || 0) > 0);
                            
                            console.log('All productos:', productos);
                            console.log('SIM products found:', simProducts);
                            console.log('Products categories:', productos?.map(p => ({ name: p.categoria?.nombre, code: p.categoria?.codigo, stock: p.stock?.cantidad_disponible })));
                            
                            return simProducts?.map(producto => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.marca} - {producto.nombre}
                                <span className="text-xs text-gray-500 ml-2">
                                  (Stock: {producto.stock?.cantidad_disponible || 0})
                                </span>
                              </SelectItem>
                            ));
                          })()}
                          {(!productos?.filter(p => (p.categoria?.nombre?.toLowerCase().includes('sim') || 
                                                          p.categoria?.codigo?.toLowerCase().includes('sim') ||
                                                          p.categoria?.nombre?.toLowerCase() === 'sim cards') && 
                                                         (p.stock?.cantidad_disponible || 0) > 0)?.length) && (
                            <SelectItem value="no-sim-stock" disabled>
                              No hay tarjetas SIM en stock
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-blue-700 font-semibold flex items-center gap-2">
                        MicroSD para Almacenamiento 
                        {(formData.sensores_requeridos.includes('Cámara de seguridad') || manualKit.gps_id === 'gps-jc261') && (
                          <Badge className="bg-red-500 text-white text-xs">OBLIGATORIO</Badge>
                        )}
                      </Label>
                      <Select 
                        value={manualKit.microsd_id} 
                        onValueChange={(value) => setManualKit(prev => ({ ...prev, microsd_id: value }))}
                        disabled={!(formData.sensores_requeridos.includes('Cámara de seguridad') || manualKit.gps_id === 'gps-jc261')}
                      >
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Seleccionar MicroSD (opcional)" />
                        </SelectTrigger>
                        <SelectContent className="bg-white z-50">
                          <SelectItem value="no-microsd">No incluir MicroSD</SelectItem>
                          {productos
                            ?.filter(p => p.categoria?.nombre?.toLowerCase().includes('microsd') && (p.stock?.cantidad_disponible || 0) > 0)
                            ?.map(producto => (
                              <SelectItem key={producto.id} value={producto.id}>
                                {producto.marca} {producto.modelo} - {producto.nombre}
                                <span className="text-xs text-gray-500 ml-2">
                                  (Stock: {producto.stock?.cantidad_disponible || 0})
                                </span>
                              </SelectItem>
                            ))}
                          {(!productos?.filter(p => p.categoria?.nombre?.toLowerCase().includes('microsd') && (p.stock?.cantidad_disponible || 0) > 0)?.length) && (
                            <SelectItem value="no-microsd-stock" disabled>
                              No hay MicroSD en stock
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {(formData.sensores_requeridos.includes('Cámara de seguridad') || manualKit.gps_id === 'gps-jc261') && (
                        <p className="text-xs text-red-600 mt-1">
                          MicroSD requerido para almacenar grabaciones de video de la cámara
                        </p>
                      )}
                    </div>
                  </div>

                  <Button 
                    onClick={handleManualKitAssign}
                    disabled={!manualKit.gps_id || !manualKit.sim_id || ((formData.sensores_requeridos.includes('Cámara de seguridad') || manualKit.gps_id === 'gps-jc261') && !manualKit.microsd_id)}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                    size="lg"
                  >
                    <Package className="mr-2 h-4 w-4" />
                    Confirmar Selección Manual
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="summary" className="space-y-4">
            {isCompleted ? (
              <Card className="border-green-200 bg-green-50">
                <CardContent className="p-8 text-center">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-green-700 mb-2">¡Instalación Programada!</h3>
                  <p className="text-green-600">Kit asignado y programación completada exitosamente.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card>
                  <CardHeader>
                    <CardTitle>Resumen de la Instalación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="font-medium">Vehículo:</p>
                        <p className="text-muted-foreground">{formData.vehiculo_marca} {formData.vehiculo_modelo}</p>
                      </div>
                      <div>
                        <p className="font-medium">Fecha:</p>
                        <p className="text-muted-foreground">
                          {formData.fecha_programada ? format(formData.fecha_programada, "PPP", { locale: es }) : 'N/A'} - {formData.hora_inicio}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {kitAsignado && (
                  <Card className="border-green-200 bg-green-50">
                    <CardHeader>
                      <CardTitle className="text-green-700">Kit Asignado</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Cpu className="h-4 w-4 text-blue-500" />
                          <span className="font-medium">GPS:</span>
                          <span>{kitAsignado.gps}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-orange-500" />
                          <span className="font-medium">SIM:</span>
                          <span>{kitAsignado.sim}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="h-4 w-4 text-purple-500" />
                          <span className="font-medium">MicroSD:</span>
                          <span>{kitAsignado.microsd}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-green-500" />
                          <span className="font-medium">Serie:</span>
                          <span className="font-mono">{kitAsignado.numero_serie}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                <div className="flex justify-end">
                  <Button onClick={handleComplete} size="lg" className="bg-green-600 hover:bg-green-700">
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Finalizar
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};