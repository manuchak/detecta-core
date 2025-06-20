import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Car, Settings, Zap, Wrench, MapPin, Clock, User, Plus, X } from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useVehicleData } from '@/hooks/useVehicleData';

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
  const [currentStep, setCurrentStep] = useState(1);
  const { createProgramacion } = useProgramacionInstalaciones();
  const { marcas, loadingMarcas, fetchModelosPorMarca } = useVehicleData();
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);
  
  const [formData, setFormData] = useState({
    // Información del servicio y vehículo
    servicio_id: servicioId || '',
    vehiculo_seleccionado: '',
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

  // Pre-populate data from service when dialog opens
  useEffect(() => {
    if (open && servicioData) {
      console.log('Pre-populating form with service data:', servicioData);
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
    }
  }, [open, servicioData, servicioId]);

  // Fetch models when brand changes
  const handleMarcaChange = async (marcaNombre: string) => {
    setFormData(prev => ({ 
      ...prev, 
      marca_vehiculo: marcaNombre,
      modelo_vehiculo: '' // Reset model when brand changes
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
    'Cámara de respaldo',
    'Botón de pánico',
    'Sensor de puertas',
    'Sensor de vibración',
    'Micrófono ambiente',
    'Sensor de velocidad'
  ];

  const tiposInstalacion = [
    { value: 'gps_basico', label: 'GPS Básico', tiempo: 60 },
    { value: 'gps_premium', label: 'GPS Premium + Sensores', tiempo: 120 },
    { value: 'sistema_completo', label: 'Sistema Completo de Seguridad', tiempo: 180 },
    { value: 'flotilla_comercial', label: 'Flotilla Comercial', tiempo: 90 }
  ];

  const horasDisponibles = [
    '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
    '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
    '15:00', '15:30', '16:00', '16:30', '17:00'
  ];

  // Calculate minimum date (72 business hours from now)
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

  // Check if date is valid for installation (no weekends)
  const isDateDisabled = (date: Date) => {
    const minDate = getMinimumDate();
    return date < minDate || isWeekend(date);
  };

  const handleSensorChange = (sensor: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sensores_adicionales: checked 
        ? [...prev.sensores_adicionales, sensor]
        : prev.sensores_adicionales.filter(s => s !== sensor)
    }));
  };

  const addCustomSensor = () => {
    const sensorName = prompt('Ingrese el nombre del sensor personalizado:');
    if (sensorName && sensorName.trim()) {
      setFormData(prev => ({
        ...prev,
        sensores_adicionales: [...prev.sensores_adicionales, sensorName.trim()]
      }));
    }
  };

  const removeSensor = (sensor: string) => {
    setFormData(prev => ({
      ...prev,
      sensores_adicionales: prev.sensores_adicionales.filter(s => s !== sensor)
    }));
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
      default:
        return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    console.log('Starting installation confirmation...');
    console.log('Form data before validation:', formData);
    
    if (!validateCurrentStep()) {
      console.error('Validation failed for current step:', currentStep);
      alert('Por favor complete todos los campos requeridos');
      return;
    }

    // Additional validation
    if (!formData.servicio_id) {
      console.error('Service ID is missing');
      alert('Error: ID del servicio no encontrado');
      return;
    }

    if (!formData.fecha_programada) {
      console.error('Scheduled date is missing');
      alert('Error: Fecha programada no seleccionada');
      return;
    }

    try {
      console.log('Preparing installation data...');
      
      // Map installation types to expected values
      const tipoInstalacionMap: Record<string, 'gps_vehicular' | 'gps_personal' | 'camara'> = {
        'gps_basico': 'gps_vehicular',
        'gps_premium': 'gps_vehicular',
        'sistema_completo': 'gps_vehicular',
        'flotilla_comercial': 'gps_vehicular'
      };

      const programacionData = {
        servicio_id: formData.servicio_id,
        tipo_instalacion: tipoInstalacionMap[formData.tipo_instalacion] || 'gps_vehicular',
        fecha_programada: formData.fecha_programada.toISOString(),
        hora_programada: formData.hora_inicio,
        direccion_instalacion: formData.direccion_instalacion,
        contacto_cliente: formData.contacto_cliente,
        telefono_contacto: formData.telefono_contacto,
        instalador_id: formData.instalador_asignado || undefined,
        tiempo_estimado: formData.tiempo_estimado,
        prioridad: 'normal' as const,
        estado: 'programada' as const,
        observaciones_cliente: [
          formData.observaciones_vehiculo,
          formData.observaciones_instalacion,
          `Sensores: ${formData.sensores_adicionales.join(', ')}`
        ].filter(Boolean).join('\n'),
        requiere_vehiculo_elevado: formData.requiere_elevador,
        acceso_restringido: formData.requiere_herramientas_especiales
      };

      console.log('Final installation data to send:', programacionData);

      await createProgramacion.mutateAsync(programacionData);
      
      console.log('Installation scheduled successfully');
      onOpenChange(false);
      
      // Reset form
      setCurrentStep(1);
      setFormData(prev => ({
        ...prev,
        fecha_programada: null,
        hora_inicio: '',
        instalador_asignado: '',
        observaciones_instalacion: ''
      }));
      
    } catch (error) {
      console.error('Error scheduling installation:', error);
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData: formData
      });
      alert('Error al programar la instalación. Por favor intente nuevamente.');
    }
  };

  const nextStep = () => {
    if (!validateCurrentStep()) {
      alert('Por favor complete todos los campos requeridos antes de continuar');
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, 4));
  };
  
  const prevStep = () => setCurrentStep(prev => Math.max(prev - 1, 1));

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
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
                    placeholder="Modificaciones, características especiales, daños visibles, etc."
                    rows={3}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Configuración de Instalación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Tipo de Instalación *</Label>
                  <Select value={formData.tipo_instalacion} onValueChange={(value) => {
                    const tipo = tiposInstalacion.find(t => t.value === value);
                    setFormData(prev => ({ 
                      ...prev, 
                      tipo_instalacion: value,
                      tiempo_estimado: tipo?.tiempo || 60
                    }));
                  }}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {tiposInstalacion.map(tipo => (
                        <SelectItem key={tipo.value} value={tipo.value}>
                          {tipo.label} ({tipo.tiempo} min)
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sensores/Gadgets Adicionales</Label>
                    <Button type="button" onClick={addCustomSensor} variant="outline" size="sm">
                      <Plus className="h-4 w-4 mr-1" />
                      Agregar Personalizado
                    </Button>
                  </div>
                  
                  {/* Current selected sensors */}
                  {formData.sensores_adicionales.length > 0 && (
                    <div className="space-y-2">
                      <Label className="text-sm text-gray-600">Sensores Seleccionados:</Label>
                      <div className="flex flex-wrap gap-2">
                        {formData.sensores_adicionales.map(sensor => (
                          <Badge key={sensor} variant="secondary" className="flex items-center gap-1">
                            {sensor}
                            <X 
                              className="h-3 w-3 cursor-pointer hover:text-red-500" 
                              onClick={() => removeSensor(sensor)}
                            />
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Available sensors to add */}
                  <div className="space-y-2">
                    <Label className="text-sm text-gray-600">Sensores Disponibles:</Label>
                    <div className="grid grid-cols-2 gap-3">
                      {sensoresDisponibles.map(sensor => (
                        <div key={sensor} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            id={sensor}
                            checked={formData.sensores_adicionales.includes(sensor)}
                            onChange={(e) => handleSensorChange(sensor, e.target.checked)}
                            className="h-4 w-4"
                          />
                          <Label htmlFor={sensor} className="text-sm">{sensor}</Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Ubicación Preferida de Instalación *</Label>
                  <Select value={formData.ubicacion_instalacion} onValueChange={(value) => setFormData(prev => ({ ...prev, ubicacion_instalacion: value }))}>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar ubicación" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="oculta_tablero">Oculta bajo tablero</SelectItem>
                      <SelectItem value="compartimento_motor">Compartimento del motor</SelectItem>
                      <SelectItem value="consola_central">Consola central</SelectItem>
                      <SelectItem value="maletero">Maletero</SelectItem>
                      <SelectItem value="sugerencia_tecnico">Sugerencia del técnico</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CalendarIcon className="h-5 w-5" />
                  Programación de Cita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Date Selection Section */}
                <div className="space-y-4">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Fecha de Instalación *</Label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal h-12 text-base",
                            !formData.fecha_programada && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-3 h-5 w-5" />
                          {formData.fecha_programada ? (
                            format(formData.fecha_programada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })
                          ) : (
                            <span>Seleccionar fecha de instalación</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={formData.fecha_programada}
                          onSelect={(date) => setFormData(prev => ({ ...prev, fecha_programada: date }))}
                          disabled={isDateDisabled}
                          initialFocus
                          className="rounded-md border"
                        />
                      </PopoverContent>
                    </Popover>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Políticas de programación:</strong>
                      </p>
                      <ul className="text-xs text-blue-600 mt-1 space-y-1">
                        <li>• Mínimo 72 horas hábiles de anticipación</li>
                        <li>• No se realizan instalaciones en fines de semana</li>
                        <li>• Horario de servicio: 9:00 AM - 5:00 PM</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Time and Installer Selection */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="text-base font-medium">Hora de Inicio *</Label>
                    <Select value={formData.hora_inicio} onValueChange={(value) => setFormData(prev => ({ ...prev, hora_inicio: value }))}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Seleccionar hora de inicio" />
                      </SelectTrigger>
                      <SelectContent>
                        {horasDisponibles.map(hora => (
                          <SelectItem key={hora} value={hora} className="text-base">
                            {hora}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-3">
                    <Label className="text-base font-medium">Instalador Asignado *</Label>
                    <Select value={formData.instalador_asignado} onValueChange={(value) => setFormData(prev => ({ ...prev, instalador_asignado: value }))}>
                      <SelectTrigger className="h-12 text-base">
                        <SelectValue placeholder="Asignar instalador" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="instalador_1">Juan Pérez - Zona Norte</SelectItem>
                        <SelectItem value="instalador_2">María García - Zona Sur</SelectItem>
                        <SelectItem value="instalador_3">Carlos López - Zona Centro</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Installation Details Summary */}
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <Clock className="h-5 w-5 text-green-600" />
                    <Label className="text-green-800 font-medium text-base">Detalles de la Cita</Label>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="font-medium text-green-700">Tipo de Instalación:</span>
                      <p className="text-green-600">
                        {tiposInstalacion.find(t => t.value === formData.tipo_instalacion)?.label}
                      </p>
                    </div>
                    <div>
                      <span className="font-medium text-green-700">Tiempo Estimado:</span>
                      <p className="text-green-600">{formData.tiempo_estimado} minutos</p>
                    </div>
                    {formData.fecha_programada && formData.hora_inicio && (
                      <div className="md:col-span-2">
                        <span className="font-medium text-green-700">Cita Programada:</span>
                        <p className="text-green-600">
                          {format(formData.fecha_programada, "EEEE, dd 'de' MMMM 'de' yyyy", { locale: es })} a las {formData.hora_inicio}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Información de Contacto y Logística
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <p className="text-sm text-yellow-800">
                    <strong>Nota:</strong> Esta información proviene de la captura del servicio. 
                    Verifique que sea correcta o actualícela si es necesario.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contacto del Cliente *</Label>
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
                      placeholder="555-123-4567"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Dirección de Instalación *</Label>
                  <Textarea
                    value={formData.direccion_instalacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, direccion_instalacion: e.target.value }))}
                    placeholder="Dirección completa donde se realizará la instalación"
                    rows={2}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Instrucciones de Acceso</Label>
                  <Textarea
                    value={formData.instrucciones_acceso}
                    onChange={(e) => setFormData(prev => ({ ...prev, instrucciones_acceso: e.target.value }))}
                    placeholder="Códigos de acceso, ubicación del estacionamiento, contacto de seguridad, etc."
                    rows={3}
                  />
                </div>

                <div className="space-y-3">
                  <Label>Requerimientos Especiales</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requiere_elevador"
                        checked={formData.requiere_elevador}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiere_elevador: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="requiere_elevador">Requiere elevador o rampa</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="requiere_herramientas_especiales"
                        checked={formData.requiere_herramientas_especiales}
                        onChange={(e) => setFormData(prev => ({ ...prev, requiere_herramientas_especiales: e.target.checked }))}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="requiere_herramientas_especiales">Requiere herramientas especiales</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Observaciones Adicionales</Label>
                  <Textarea
                    value={formData.observaciones_instalacion}
                    onChange={(e) => setFormData(prev => ({ ...prev, observaciones_instalacion: e.target.value }))}
                    placeholder="Cualquier detalle adicional importante para la instalación"
                    rows={3}
                  />
                </div>

                {/* Summary Card */}
                <Card className="bg-blue-50 border-blue-200">
                  <CardHeader>
                    <CardTitle className="text-blue-800 text-lg">Resumen de la Instalación</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2 text-sm">
                    <p><strong>Vehículo:</strong> {formData.marca_vehiculo} {formData.modelo_vehiculo} {formData.año_vehiculo}</p>
                    <p><strong>Tipo:</strong> {tiposInstalacion.find(t => t.value === formData.tipo_instalacion)?.label}</p>
                    <p><strong>Fecha:</strong> {formData.fecha_programada ? format(formData.fecha_programada, "PPP", { locale: es }) : 'No seleccionada'} a las {formData.hora_inicio || 'No seleccionada'}</p>
                    <p><strong>Duración:</strong> {formData.tiempo_estimado} minutos</p>
                    <p><strong>Sensores:</strong> {formData.sensores_adicionales.length > 0 ? formData.sensores_adicionales.join(', ') : 'Ninguno adicional'}</p>
                    <p><strong>Instalador:</strong> {formData.instalador_asignado ? formData.instalador_asignado.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) : 'No asignado'}</p>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wrench className="h-5 w-5" />
            Programar Instalación GPS - Paso {currentStep} de 4
          </DialogTitle>
        </DialogHeader>

        {/* Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 h-2 rounded ${
                step <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
              }`}
            />
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          {/* Navigation buttons */}
          <div className="flex justify-between mt-8 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Anterior
            </Button>
            
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              
              {currentStep < 4 ? (
                <Button 
                  type="button" 
                  onClick={nextStep}
                  disabled={!validateCurrentStep()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Siguiente
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700"
                  disabled={!validateCurrentStep() || createProgramacion.isPending}
                >
                  {createProgramacion.isPending ? 'Programando...' : 'Confirmar Instalación'}
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
