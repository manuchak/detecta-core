import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  Calendar as CalendarIcon,
  Car,
  Settings,
  Zap,
  Wrench,
  MapPin,
  Clock,
  User,
  Plus,
  X,
  CheckCircle,
  AlertCircle,
  Cpu,
  CreditCard,
  HardDrive,
  Star,
  ArrowLeft,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useVehicleData } from '@/hooks/useVehicleData';
import { useKitsInstalacion, GpsRecomendacion, SimDisponible, MicroSDDisponible } from '@/hooks/useKitsInstalacion';

interface FormularioInstalacionCompletoProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId?: string;
  servicioData?: any;
}

export const FormularioInstalacionCompleto = ({
  open,
  onOpenChange,
  servicioId,
  servicioData
}: FormularioInstalacionCompletoProps) => {
  const [currentStep, setCurrentStep] = useState(1);
  const { createProgramacion } = useProgramacionInstalaciones();
  const { marcas, loadingMarcas, fetchModelosPorMarca } = useVehicleData();
  const {
    recomendarGPS,
    obtenerSimDisponibles,
    obtenerMicroSDDisponibles,
    createKit,
    isCreatingKit
  } = useKitsInstalacion();
  
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  const [programacionId, setProgramacionId] = useState<string>('');
  
  // Estados para GPS
  const [gpsRecomendados, setGpsRecomendados] = useState<GpsRecomendacion[]>([]);
  const [simsDisponibles, setSimsDisponibles] = useState<SimDisponible[]>([]);
  const [microsdsDisponibles, setMicrosdsDisponibles] = useState<MicroSDDisponible[]>([]);
  const [isLoadingRecomendaciones, setIsLoadingRecomendaciones] = useState(false);
  const [gpsSeleccionado, setGpsSeleccionado] = useState<string>('');
  const [simSeleccionada, setSimSeleccionada] = useState<string>('');
  const [microsdSeleccionada, setMicrosdSeleccionada] = useState<string>('');
  const [tipoSimRecomendado, setTipoSimRecomendado] = useState<string>('');
  const [requiereMicrosd, setRequiereMicrosd] = useState<boolean>(false);
  
  const [formData, setFormData] = useState({
    // Información del servicio y vehículo
    servicio_id: servicioId || '',
    marca_vehiculo: '',
    modelo_vehiculo: '',
    año_vehiculo: '',
    tipo_combustible: 'gasolina',
    es_electrico: false,
    
    // Detalles de instalación
    tipo_instalacion: 'gps_basico',
    sensores_adicionales: [] as string[],
    ubicacion_instalacion: '',
    observaciones_vehiculo: '',
    
    // Programación
    fecha_programada: null as Date | null,
    hora_inicio: '',
    tiempo_estimado: 60,
    instalador_asignado: '',
    
    // Contacto y logística
    contacto_cliente: '',
    telefono_contacto: '',
    direccion_instalacion: '',
    instrucciones_acceso: '',
    
    // Preparativos especiales
    requiere_elevador: false,
    requiere_herramientas_especiales: false,
    observaciones_instalacion: ''
  });

  const steps = [
    { id: 1, title: 'Vehículo', description: 'Información del vehículo', icon: Car },
    { id: 2, title: 'Instalación', description: 'Tipo y configuración', icon: Settings },
    { id: 3, title: 'Programación', description: 'Fecha y hora', icon: Clock },
    { id: 4, title: 'Contacto', description: 'Datos del cliente', icon: User },
    { id: 5, title: 'Kit GPS', description: 'Asignación de componentes', icon: Cpu }
  ];

  // Pre-populate data from service when dialog opens
  useEffect(() => {
    if (open && servicioData) {
      setFormData(prev => ({
        ...prev,
        servicio_id: servicioId || '',
        marca_vehiculo: servicioData.marca_vehiculo || '',
        modelo_vehiculo: servicioData.modelo_vehiculo || '',
        año_vehiculo: servicioData.año_vehiculo?.toString() || '',
        tipo_combustible: servicioData.tipo_combustible || 'gasolina',
        es_electrico: servicioData.es_electrico || false,
        contacto_cliente: servicioData.nombre_cliente || '',
        telefono_contacto: servicioData.telefono_contacto || '',
        direccion_instalacion: servicioData.direccion_cliente || '',
        sensores_adicionales: servicioData.sensores_solicitados || []
      }));

      if (servicioData.marca_vehiculo) {
        handleMarcaChange(servicioData.marca_vehiculo);
      }
    }
  }, [open, servicioData, servicioId]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
      setProgramacionId('');
      setGpsSeleccionado('');
      setSimSeleccionada('');
      setMicrosdSeleccionada('');
      setGpsRecomendados([]);
      setSimsDisponibles([]);
      setMicrosdsDisponibles([]);
    }
  }, [open]);

  // Cargar recomendaciones GPS cuando llegamos al paso 5
  useEffect(() => {
    if (currentStep === 5 && programacionId) {
      cargarRecomendacionesGPS();
    }
  }, [currentStep, programacionId]);

  const cargarRecomendacionesGPS = async () => {
    setIsLoadingRecomendaciones(true);
    try {
      const recomendaciones = await recomendarGPS(formData.tipo_instalacion, formData.sensores_adicionales);
      setGpsRecomendados(recomendaciones);
      
      // Seleccionar automáticamente el GPS con mejor score
      if (recomendaciones.length > 0) {
        const mejorGps = recomendaciones[0];
        setGpsSeleccionado(mejorGps.gps_id);
        setTipoSimRecomendado(mejorGps.tipo_sim_recomendado);
        setRequiereMicrosd(mejorGps.requiere_microsd);
        
        // Cargar SIMs y microSDs
        if (mejorGps.tipo_sim_recomendado) {
          cargarSimsDisponibles(mejorGps.tipo_sim_recomendado);
        }
        if (mejorGps.requiere_microsd) {
          cargarMicrosdsDisponibles();
        }
      }
    } catch (error) {
      console.error('Error al cargar recomendaciones:', error);
    } finally {
      setIsLoadingRecomendaciones(false);
    }
  };

  const cargarSimsDisponibles = async (tipoPlan?: string) => {
    try {
      const sims = await obtenerSimDisponibles(tipoPlan);
      setSimsDisponibles(sims);
      
      if (sims.length > 0) {
        setSimSeleccionada(sims[0].sim_id);
      }
    } catch (error) {
      console.error('Error al cargar SIMs:', error);
    }
  };

  const cargarMicrosdsDisponibles = async () => {
    try {
      const microsds = await obtenerMicroSDDisponibles(32);
      setMicrosdsDisponibles(microsds);
      
      if (microsds.length > 0) {
        setMicrosdSeleccionada(microsds[0].microsd_id);
      }
    } catch (error) {
      console.error('Error al cargar microSDs:', error);
    }
  };

  const handleMarcaChange = async (marcaNombre: string) => {
    setFormData(prev => ({
      ...prev,
      marca_vehiculo: marcaNombre,
      modelo_vehiculo: servicioData?.modelo_vehiculo || ''
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

  const handleGpsChange = (gpsId: string) => {
    setGpsSeleccionado(gpsId);
    const gpsSeleccionadoData = gpsRecomendados.find(g => g.gps_id === gpsId);
    if (gpsSeleccionadoData) {
      setTipoSimRecomendado(gpsSeleccionadoData.tipo_sim_recomendado);
      setRequiereMicrosd(gpsSeleccionadoData.requiere_microsd);
      
      // Limpiar y recargar componentes
      setSimSeleccionada('');
      setMicrosdSeleccionada('');
      
      if (gpsSeleccionadoData.tipo_sim_recomendado) {
        cargarSimsDisponibles(gpsSeleccionadoData.tipo_sim_recomendado);
      }
      if (gpsSeleccionadoData.requiere_microsd) {
        cargarMicrosdsDisponibles();
      }
    }
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return formData.marca_vehiculo && formData.modelo_vehiculo && formData.año_vehiculo;
      case 2:
        return formData.tipo_instalacion && formData.ubicacion_instalacion;
      case 3:
        return formData.fecha_programada && formData.hora_inicio && formData.instalador_asignado;
      case 4:
        return formData.contacto_cliente && formData.telefono_contacto && formData.direccion_instalacion;
      case 5:
        return gpsSeleccionado && (!requiereMicrosd || microsdSeleccionada);
      default:
        return false;
    }
  };

  const nextStep = async () => {
    if (!validateCurrentStep()) {
      alert('Por favor complete todos los campos requeridos antes de continuar');
      return;
    }

    if (currentStep === 4) {
      // Crear programación antes de ir al paso 5
      await handleCreateProgramacion();
    } else {
      setCurrentStep(prev => Math.min(prev + 1, 5));
    }
  };

  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const handleCreateProgramacion = async () => {
    try {
      const tipoInstalacionMap: Record<string, 'gps_vehicular' | 'gps_personal' | 'camara'> = {
        'gps_basico': 'gps_vehicular',
        'gps_premium': 'gps_vehicular',
        'sistema_completo': 'gps_vehicular',
        'flotilla_comercial': 'gps_vehicular'
      };

      const fechaISO = formData.fecha_programada!.toISOString();

      const programacionData = {
        servicio_id: formData.servicio_id,
        tipo_instalacion: tipoInstalacionMap[formData.tipo_instalacion] || 'gps_vehicular',
        fecha_programada: fechaISO,
        hora_programada: formData.hora_inicio,  
        direccion_instalacion: formData.direccion_instalacion.trim(),
        contacto_cliente: formData.contacto_cliente.trim(),
        telefono_contacto: formData.telefono_contacto.trim(),
        tiempo_estimado: formData.tiempo_estimado,
        prioridad: 'normal' as const,
        estado: 'programada' as const,
        observaciones_cliente: [
          formData.observaciones_vehiculo,
          formData.observaciones_instalacion,
          formData.sensores_adicionales.length > 0 ? `Sensores: ${formData.sensores_adicionales.join(', ')}` : '',
          formData.instalador_asignado ? `Instalador preferido: ${
            formData.instalador_asignado === 'instalador_1' ? 'Juan Pérez' :
            formData.instalador_asignado === 'instalador_2' ? 'María García' :
            formData.instalador_asignado === 'instalador_3' ? 'Carlos López' : formData.instalador_asignado
          }` : ''
        ].filter(Boolean).join('\n'),
        requiere_vehiculo_elevado: formData.requiere_elevador,
        acceso_restringido: formData.requiere_herramientas_especiales
      };

      const result = await createProgramacion.mutateAsync(programacionData);
      setProgramacionId(result.id);
      setCurrentStep(5);
      
    } catch (error) {
      console.error('Error creating programacion:', error);
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al programar la instalación:\n${errorMessage}`);
    }
  };

  const handleFinish = async () => {
    if (!programacionId || !gpsSeleccionado) return;

    try {
      await createKit({
        programacionId,
        gpsId: gpsSeleccionado,
        simId: simSeleccionada || undefined,
        microsdId: microsdSeleccionada || undefined,
      });

      onOpenChange(false);
      // Aquí podrías llamar un callback para actualizar la lista
    } catch (error) {
      console.error('Error creating kit:', error);
      alert('Error al crear el kit de instalación');
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return renderVehiculoStep();
      case 2:
        return renderInstalacionStep();
      case 3:
        return renderProgramacionStep();
      case 4:
        return renderContactoStep();
      case 5:
        return renderKitGPSStep();
      default:
        return null;
    }
  };

  const renderVehiculoStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Información del Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Marca del Vehículo *</Label>
              <Select 
                value={formData.marca_vehiculo} 
                onValueChange={handleMarcaChange}
                disabled={loadingMarcas}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingMarcas ? "Cargando..." : "Seleccionar marca"} />
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
                value={formData.modelo_vehiculo} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, modelo_vehiculo: value }))}
                disabled={!formData.marca_vehiculo || loadingModelos}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingModelos ? "Cargando..." : "Seleccionar modelo"} />
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
                value={formData.año_vehiculo}
                onChange={(e) => setFormData(prev => ({ ...prev, año_vehiculo: e.target.value }))}
                placeholder="2020"
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Tipo de Combustible *</Label>
              <Select value={formData.tipo_combustible} onValueChange={(value) => {
                const isElectric = value === 'electrico' || value === 'hibrido';
                setFormData(prev => ({ 
                  ...prev, 
                  tipo_combustible: value,
                  es_electrico: isElectric
                }));
              }}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diesel</SelectItem>
                  <SelectItem value="electrico">Eléctrico</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="gas_lp">Gas LP</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {formData.es_electrico && (
              <div className="flex items-center space-x-2 mt-6">
                <Zap className="h-4 w-4 text-green-600" />
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Vehículo Eco-Amigable
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Observaciones del Vehículo</Label>
            <Textarea
              value={formData.observaciones_vehiculo}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones_vehiculo: e.target.value }))}
              placeholder="Condiciones especiales, modificaciones, etc."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderInstalacionStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Detalles de Instalación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  <SelectItem value="gps_basico">GPS Básico</SelectItem>
                  <SelectItem value="gps_premium">GPS Premium</SelectItem>
                  <SelectItem value="sistema_completo">Sistema Completo</SelectItem>
                  <SelectItem value="flotilla_comercial">Flotilla Comercial</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Ubicación de Instalación *</Label>
              <Input
                value={formData.ubicacion_instalacion}
                onChange={(e) => setFormData(prev => ({ ...prev, ubicacion_instalacion: e.target.value }))}
                placeholder="Ejemplo: Tablero, motor, etc."
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sensores Adicionales</Label>
            <div className="space-y-2">
              {['sensor_temperatura', 'sensor_combustible', 'sensor_puerta', 'sensor_movimiento', 'sensor_presencia', 'sensor_carga'].map((sensor) => (
                <div key={sensor} className="flex items-center space-x-2">
                  <Checkbox
                    id={sensor}
                    checked={formData.sensores_adicionales.includes(sensor)}
                    onCheckedChange={(checked) => {
                      setFormData(prev => ({
                        ...prev,
                        sensores_adicionales: checked
                          ? [...prev.sensores_adicionales, sensor]
                          : prev.sensores_adicionales.filter(s => s !== sensor)
                      }));
                    }}
                  />
                  <Label htmlFor={sensor} className="text-sm">
                    {sensor === 'sensor_temperatura' && 'Sensor de Temperatura'}
                    {sensor === 'sensor_combustible' && 'Sensor de Combustible'}
                    {sensor === 'sensor_puerta' && 'Sensor de Puerta'}
                    {sensor === 'sensor_movimiento' && 'Sensor de Movimiento'}
                    {sensor === 'sensor_presencia' && 'Sensor de Presencia'}
                    {sensor === 'sensor_carga' && 'Sensor de Carga'}
                  </Label>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label>Observaciones de Instalación</Label>
            <Textarea
              value={formData.observaciones_instalacion}
              onChange={(e) => setFormData(prev => ({ ...prev, observaciones_instalacion: e.target.value }))}
              placeholder="Notas especiales para la instalación"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <Input
                id="requiere_elevador"
                type="checkbox"
                checked={formData.requiere_elevador}
                onChange={(e) => setFormData(prev => ({ ...prev, requiere_elevador: e.target.checked }))}
              />
              <Label htmlFor="requiere_elevador">Requiere elevador</Label>
            </div>
            <div className="flex items-center space-x-2">
              <Input
                id="requiere_herramientas_especiales"
                type="checkbox"
                checked={formData.requiere_herramientas_especiales}
                onChange={(e) => setFormData(prev => ({ ...prev, requiere_herramientas_especiales: e.target.checked }))}
              />
              <Label htmlFor="requiere_herramientas_especiales">Requiere herramientas especiales</Label>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderProgramacionStep = () => {
    // For date selection, we use Calendar component with disabled weekends
    const disabledDays = (date: Date) => isWeekend(date);

    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon className="h-5 w-5" />
              Programación de Instalación
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Fecha Programada *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left"
                    >
                      {formData.fecha_programada
                        ? format(formData.fecha_programada, 'PPP', { locale: es })
                        : 'Selecciona una fecha'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={formData.fecha_programada}
                      onSelect={(date) => setFormData(prev => ({ ...prev, fecha_programada: date }))}
                      disabled={disabledDays}
                      locale={es}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label>Hora de Inicio *</Label>
                <Input
                  type="time"
                  value={formData.hora_inicio}
                  onChange={(e) => setFormData(prev => ({ ...prev, hora_inicio: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Tiempo Estimado (minutos)</Label>
              <Input
                type="number"
                min={15}
                max={480}
                value={formData.tiempo_estimado}
                onChange={(e) => setFormData(prev => ({ ...prev, tiempo_estimado: Number(e.target.value) }))}
              />
            </div>

            <div className="space-y-2">
              <Label>Instalador Asignado *</Label>
              <Select
                value={formData.instalador_asignado}
                onValueChange={(value) => setFormData(prev => ({ ...prev, instalador_asignado: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un instalador" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="instalador_1">Juan Pérez</SelectItem>
                  <SelectItem value="instalador_2">María García</SelectItem>
                  <SelectItem value="instalador_3">Carlos López</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  };

  const renderContactoStep = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Nombre del Contacto *</Label>
              <Input
                value={formData.contacto_cliente}
                onChange={(e) => setFormData(prev => ({ ...prev, contacto_cliente: e.target.value }))}
                placeholder="Nombre completo"
              />
            </div>
            <div className="space-y-2">
              <Label>Teléfono de Contacto *</Label>
              <Input
                type="tel"
                value={formData.telefono_contacto}
                onChange={(e) => setFormData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                placeholder="Ejemplo: +52 55 1234 5678"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Dirección de Instalación *</Label>
            <Textarea
              value={formData.direccion_instalacion}
              onChange={(e) => setFormData(prev => ({ ...prev, direccion_instalacion: e.target.value }))}
              placeholder="Calle, número, colonia, ciudad, etc."
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Instrucciones de Acceso</Label>
            <Textarea
              value={formData.instrucciones_acceso}
              onChange={(e) => setFormData(prev => ({ ...prev, instrucciones_acceso: e.target.value }))}
              placeholder="Indicaciones especiales para el instalador"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderKitGPSStep = () => (
    <div className="space-y-6">
      {isLoadingRecomendaciones ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando recomendaciones GPS...</span>
        </div>
      ) : (
        <>
          {/* GPS Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Cpu className="h-4 w-4" />
                Dispositivo GPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select value={gpsSeleccionado} onValueChange={handleGpsChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un dispositivo GPS" />
                </SelectTrigger>
                <SelectContent>
                  {gpsRecomendados.map((gps) => (
                    <SelectItem key={gps.gps_id} value={gps.gps_id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span>{gps.marca} {gps.modelo}</span>
                          <Badge variant="outline">{gps.numero_serie}</Badge>
                          {gps.score_compatibilidad >= 90 && (
                            <Badge variant="default" className="bg-green-600">
                              <Star className="h-3 w-3 mr-1" />
                              Recomendado
                            </Badge>
                          )}
                        </div>
                        <Badge variant="secondary">
                          Score: {gps.score_compatibilidad}%
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* SIM Selection */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                Tarjeta SIM
                {tipoSimRecomendado && (
                  <Badge variant="outline">Recomendado: {tipoSimRecomendado}</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Select value={simSeleccionada} onValueChange={setSimSeleccionada}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona una tarjeta SIM" />
                </SelectTrigger>
                <SelectContent>
                  {simsDisponibles.map((sim) => (
                    <SelectItem key={sim.sim_id} value={sim.sim_id}>
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-2">
                          <span>{sim.numero_sim}</span>
                          <Badge variant="outline">{sim.operador}</Badge>
                          <Badge variant="secondary">{sim.tipo_plan}</Badge>
                        </div>
                        <span className="text-sm text-muted-foreground">
                          ${sim.costo_mensual}/mes
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              {simsDisponibles.length === 0 && (
                <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mt-4">
                  <AlertCircle className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm text-yellow-700">
                    No hay tarjetas SIM disponibles del tipo recomendado
                  </span>
                </div>
              )}
            </CardContent>
          </Card>

          {/* MicroSD Selection */}
          {requiereMicrosd && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <HardDrive className="h-4 w-4" />
                  Tarjeta MicroSD
                  <Badge variant="outline">Requerida</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select value={microsdSeleccionada} onValueChange={setMicrosdSeleccionada}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una tarjeta microSD" />
                  </SelectTrigger>
                  <SelectContent>
                    {microsdsDisponibles.map((microsd) => (
                      <SelectItem key={microsd.microsd_id} value={microsd.microsd_id}>
                        <div className="flex items-center justify-between w-full">
                          <div className="flex items-center gap-2">
                            <span>{microsd.marca} {microsd.modelo}</span>
                            <Badge variant="outline">{microsd.numero_serie}</Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary">{microsd.capacidad_gb}GB</Badge>
                            {microsd.clase_velocidad && (
                              <Badge variant="outline">{microsd.clase_velocidad}</Badge>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                {microsdsDisponibles.length === 0 && (
                  <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mt-4">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <span className="text-sm text-red-700">
                      No hay tarjetas microSD disponibles. El kit no se puede completar.
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Kit Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Resumen del Kit</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span>GPS:</span>
                  <span className="font-medium">
                    {gpsRecomendados.find(g => g.gps_id === gpsSeleccionado)?.marca} {gpsRecomendados.find(g => g.gps_id === gpsSeleccionado)?.modelo || 'No seleccionado'}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span>SIM:</span>
                  <span className="font-medium">
                    {simsDisponibles.find(s => s.sim_id === simSeleccionada)?.numero_sim || 'No seleccionada'}
                  </span>
                </div>
                {requiereMicrosd && (
                  <div className="flex justify-between items-center">
                    <span>MicroSD:</span>
                    <span className="font-medium">
                      {microsdsDisponibles.find(m => m.microsd_id === microsdSeleccionada) ? 
                        `${microsdsDisponibles.find(m => m.microsd_id === microsdSeleccionada)?.marca} ${microsdsDisponibles.find(m => m.microsd_id === microsdSeleccionada)?.capacidad_gb}GB` : 
                        'No seleccionada'
                      }
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const currentStepData = steps.find(s => s.id === currentStep);
  const progress = (currentStep / steps.length) * 100;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[95vh] overflow-y-auto">
        <DialogHeader className="space-y-4">
          <DialogTitle className="text-xl">
            Programación de Instalación Completa
          </DialogTitle>
          
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Paso {currentStep} de {steps.length}</span>
              <span>{Math.round(progress)}% completado</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          {/* Steps Navigation */}
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const StepIcon = step.icon;
              const isActive = step.id === currentStep;
              const isCompleted = step.id < currentStep;
              
              return (
                <div key={step.id} className="flex items-center">
                  <div className={cn(
                    "flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors",
                    isActive ? "border-primary bg-primary text-primary-foreground" :
                    isCompleted ? "border-green-500 bg-green-500 text-white" :
                    "border-muted-foreground/30 bg-background"
                  )}>
                    {isCompleted ? (
                      <CheckCircle className="h-5 w-5" />
                    ) : (
                      <StepIcon className="h-5 w-5" />
                    )}
                  </div>
                  {index < steps.length - 1 && (
                    <Separator className="w-12 mx-2" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Current Step Title */}
          {currentStepData && (
            <div className="text-center">
              <h3 className="text-lg font-semibold">{currentStepData.title}</h3>
              <p className="text-sm text-muted-foreground">{currentStepData.description}</p>
            </div>
          )}
        </DialogHeader>

        {/* Step Content */}
        <div className="py-6">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between pt-6 border-t">
          <Button 
            variant="outline" 
            onClick={currentStep === 1 ? () => onOpenChange(false) : prevStep}
            className="flex items-center gap-2"
          >
            {currentStep === 1 ? (
              <>
                <X className="h-4 w-4" />
                Cancelar
              </>
            ) : (
              <>
                <ArrowLeft className="h-4 w-4" />
                Anterior
              </>
            )}
          </Button>

          <Button 
            onClick={currentStep === 5 ? handleFinish : nextStep}
            disabled={!validateCurrentStep() || isCreatingKit}
            className="flex items-center gap-2"
          >
            {isCreatingKit ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creando Kit...
              </>
            ) : currentStep === 5 ? (
              <>
                <CheckCircle className="h-4 w-4" />
                Finalizar
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
