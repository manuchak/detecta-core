import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
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
  X
} from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { format, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useVehicleData } from '@/hooks/useVehicleData';
import { useEnhancedKitsInstalacion } from '@/hooks/useEnhancedKitsInstalacion';

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
  
  const { createProgramacion } = useProgramacionInstalaciones();
  const { marcas, loadingMarcas, fetchModelosPorMarca } = useVehicleData();
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

  const handleBasicFormComplete = async () => {
    try {
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
        observaciones_cliente: formData.observaciones
      } as any;

      const result = await createProgramacion.mutateAsync(programacionData);
      setProgramacionCreada({ id: result.id, success: true });
      setCurrentTab('kit');
    } catch (error) {
      console.error('Error creating programacion:', error);
    }
  };

  const handleAutoAssignKit = async () => {
    if (!programacionCreada?.id) return;

    try {
      const result = await autoAsignarKitCompleto.mutateAsync({
        programacionId: programacionCreada.id,
        tipoVehiculo: `${formData.vehiculo_marca} ${formData.vehiculo_modelo}`,
        sensoresRequeridos: formData.sensores_requeridos
      });

      if (result.success) {
        setKitAsignado({
          gps: result.componentes.gps,
          sim: result.componentes.sim,
          microsd: result.componentes.microsd,
          numero_serie: result.numero_serie
        });
        setCurrentTab('summary');
      }
    } catch (error) {
      console.error('Error auto-assigning kit:', error);
    }
  };

  const handleManualKitAssign = async () => {
    if (!programacionCreada?.id) return;

    try {
      // Mapear los IDs seleccionados a nombres descriptivos
      const gpsMap: Record<string, string> = {
        'gps-jc200': 'JC200 - GPS Básico',
        'gps-jc261': 'JC261 - GPS + Cámara',
        'gps-jc400': 'JC400 - GPS Avanzado'
      };

      const simMap: Record<string, string> = {
        'sim-telcel': 'SIM Telcel - Nacional',
        'sim-att': 'SIM AT&T - Internacional', 
        'sim-movistar': 'SIM Movistar - Ilimitado'
      };

      const microsdMap: Record<string, string> = {
        'microsd-32gb': 'MicroSD 32GB',
        'microsd-64gb': 'MicroSD 64GB',
        'microsd-128gb': 'MicroSD 128GB'
      };

      // Generar número de serie único para kit manual
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8).toUpperCase();
      const numeroSerie = `MAN-${timestamp}-${randomSuffix}`;

      setKitAsignado({
        gps: gpsMap[manualKit.gps_id] || manualKit.gps_id,
        sim: simMap[manualKit.sim_id] || manualKit.sim_id,
        microsd: manualKit.microsd_id ? (microsdMap[manualKit.microsd_id] || manualKit.microsd_id) : 'No incluido',
        numero_serie: numeroSerie
      });

      setCurrentTab('summary');
    } catch (error) {
      console.error('Error assigning manual kit:', error);
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
              {programacionCreada?.success && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            
            <TabsTrigger value="kit" disabled={!programacionCreada?.success} className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              Configuración de Kit
              {kitAsignado && <CheckCircle className="h-3 w-3 text-green-500" />}
            </TabsTrigger>
            
            <TabsTrigger value="summary" disabled={!programacionCreada?.success} className="flex items-center gap-2">
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

                  {kitAsignado && (
                    <div className="bg-white p-4 rounded-lg border border-green-200">
                      <h4 className="font-semibold text-green-700 mb-3 flex items-center gap-2">
                        <CheckCircle className="h-5 w-5" />
                        Kit Asignado Automáticamente
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded">
                          <Cpu className="h-6 w-6 text-blue-600 mx-auto mb-1" />
                          <div className="font-medium text-blue-700">GPS Principal</div>
                          <div className="text-sm text-blue-600">{kitAsignado.gps}</div>
                          <div className="text-xs text-blue-500 mt-1">Compatibilidad: 98%</div>
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

                  {stockStats && (
                    <div className="grid grid-cols-4 gap-4 text-center">
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-orange-600">{stockStats.instalaciones_pendientes}</div>
                        <div className="text-xs text-orange-700">Instalaciones Pendientes</div>
                        <div className="text-xs text-gray-500 mt-1">En espera de kit</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-green-600">{stockStats.kits_asignados}</div>
                        <div className="text-xs text-green-700">Kits Asignados</div>
                        <div className="text-xs text-gray-500 mt-1">Listos para instalar</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-red-600">{stockStats.stock_critico}</div>
                        <div className="text-xs text-red-700">Stock Crítico</div>
                        <div className="text-xs text-gray-500 mt-1">Requieren reabastecimiento</div>
                      </div>
                      <div className="bg-white p-3 rounded-lg border border-green-200">
                        <div className="text-2xl font-bold text-purple-600">{stockStats.score_promedio.toFixed(1)}</div>
                        <div className="text-xs text-purple-700">Score de Optimización</div>
                        <div className="text-xs text-gray-500 mt-1">Eficiencia del algoritmo</div>
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
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-4">
                    <div>
                      <Label className="text-blue-700 font-semibold">Dispositivo GPS Principal *</Label>
                      <Select value={manualKit.gps_id} onValueChange={(value) => setManualKit(prev => ({ ...prev, gps_id: value }))}>
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Seleccionar dispositivo GPS" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="gps-jc200">JC200 - GPS Básico (Vehículos estándar)</SelectItem>
                          <SelectItem value="gps-jc261">JC261 - GPS + Cámara (Requiere MicroSD)</SelectItem>
                          <SelectItem value="gps-jc400">JC400 - GPS Avanzado (Para flotillas)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-blue-700 font-semibold">Tarjeta SIM *</Label>
                      <Select value={manualKit.sim_id} onValueChange={(value) => setManualKit(prev => ({ ...prev, sim_id: value }))}>
                        <SelectTrigger className="border-blue-200">
                          <SelectValue placeholder="Seleccionar tarjeta SIM" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sim-telcel">SIM Telcel - Cobertura Nacional</SelectItem>
                          <SelectItem value="sim-att">SIM AT&T - Roaming Internacional</SelectItem>
                          <SelectItem value="sim-movistar">SIM Movistar - Datos Ilimitados</SelectItem>
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
                        <SelectContent>
                          <SelectItem value="microsd-32gb">MicroSD 32GB - Básico</SelectItem>
                          <SelectItem value="microsd-64gb">MicroSD 64GB - Estándar</SelectItem>
                          <SelectItem value="microsd-128gb">MicroSD 128GB - Extendido</SelectItem>
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