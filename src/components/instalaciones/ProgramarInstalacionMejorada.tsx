
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
import { Calendar as CalendarIcon, Car, Settings, Zap, Wrench, MapPin, Clock, User, Plus, X, CheckCircle, AlertCircle } from 'lucide-react';
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

      // Auto-fetch models if brand is available
      if (servicioData.marca_vehiculo) {
        handleMarcaChange(servicioData.marca_vehiculo);
      }
    }
  }, [open, servicioData, servicioId]);

  // Fetch models when brand changes
  const handleMarcaChange = async (marcaNombre: string) => {
    console.log('Fetching models for brand:', marcaNombre);
    setFormData(prev => ({ 
      ...prev, 
      marca_vehiculo: marcaNombre,
      modelo_vehiculo: servicioData?.modelo_vehiculo || '' // Keep existing model if pre-populated
    }));
    
    if (marcaNombre) {
      setLoadingModelos(true);
      try {
        const modelosData = await fetchModelosPorMarca(marcaNombre);
        console.log('Models fetched:', modelosData);
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
    
    console.log('🔥 Starting installation confirmation...');
    console.log('📋 Form data before validation:', formData);
    
    // Comprehensive validation
    const requiredFields = [
      { field: 'servicio_id', value: formData.servicio_id, name: 'ID del servicio' },
      { field: 'fecha_programada', value: formData.fecha_programada, name: 'Fecha programada' },
      { field: 'contacto_cliente', value: formData.contacto_cliente, name: 'Contacto del cliente' },
      { field: 'telefono_contacto', value: formData.telefono_contacto, name: 'Teléfono de contacto' },
      { field: 'direccion_instalacion', value: formData.direccion_instalacion, name: 'Dirección de instalación' },
      { field: 'hora_inicio', value: formData.hora_inicio, name: 'Hora de inicio' },
      { field: 'instalador_asignado', value: formData.instalador_asignado, name: 'Instalador asignado' }
    ];

    const missingFields = requiredFields.filter(({ value }) => !value);
    
    if (missingFields.length > 0) {
      console.error('❌ Missing required fields:', missingFields.map(f => f.name));
      alert(`Por favor complete los siguientes campos:\n${missingFields.map(f => `• ${f.name}`).join('\n')}`);
      return;
    }

    console.log('✅ All required fields validated');

    try {
      console.log('🚀 Preparing installation data...');
      
      // Map installation types to expected values
      const tipoInstalacionMap: Record<string, 'gps_vehicular' | 'gps_personal' | 'camara'> = {
        'gps_basico': 'gps_vehicular',
        'gps_premium': 'gps_vehicular',
        'sistema_completo': 'gps_vehicular',
        'flotilla_comercial': 'gps_vehicular'
      };

      // Create ISO date string properly
      const fechaISO = formData.fecha_programada!.toISOString();
      console.log('📅 Date converted to ISO:', fechaISO);

      const programacionData = {
        servicio_id: formData.servicio_id,
        tipo_instalacion: tipoInstalacionMap[formData.tipo_instalacion] || 'gps_vehicular',
        fecha_programada: fechaISO,
        hora_programada: formData.hora_inicio,
        direccion_instalacion: formData.direccion_instalacion.trim(),
        contacto_cliente: formData.contacto_cliente.trim(),
        telefono_contacto: formData.telefono_contacto.trim(),
        instalador_id: formData.instalador_asignado === 'instalador_1' ? '1' : 
                      formData.instalador_asignado === 'instalador_2' ? '2' : 
                      formData.instalador_asignado === 'instalador_3' ? '3' : undefined,
        tiempo_estimado: formData.tiempo_estimado,
        prioridad: 'normal' as const,
        estado: 'programada' as const,
        observaciones_cliente: [
          formData.observaciones_vehiculo,
          formData.observaciones_instalacion,
          formData.sensores_adicionales.length > 0 ? `Sensores: ${formData.sensores_adicionales.join(', ')}` : ''
        ].filter(Boolean).join('\n'),
        requiere_vehiculo_elevado: formData.requiere_elevador,
        acceso_restringido: formData.requiere_herramientas_especiales
      };

      console.log('📤 Final installation data to send:', programacionData);
      console.log('🔍 Data validation check:');
      console.log('  - servicio_id:', programacionData.servicio_id);
      console.log('  - fecha_programada:', programacionData.fecha_programada);
      console.log('  - contacto_cliente:', programacionData.contacto_cliente);
      console.log('  - telefono_contacto:', programacionData.telefono_contacto);
      console.log('  - direccion_instalacion:', programacionData.direccion_instalacion);

      await createProgramacion.mutateAsync(programacionData);
      
      console.log('✅ Installation scheduled successfully');
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
      console.error('💥 Error scheduling installation:', error);
      console.error('📊 Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        formData: formData,
        timestamp: new Date().toISOString()
      });
      
      // More specific error message
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      alert(`Error al programar la instalación:\n${errorMessage}\n\nPor favor revise los datos e intente nuevamente.`);
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
              <CardContent className="space-y-8">
                {/* Business Rules Info */}
                <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
                  <h4 className="font-medium text-blue-900 flex items-center gap-2 mb-2">
                    <AlertCircle className="h-4 w-4" />
                    Políticas de Programación
                  </h4>
                  <ul className="text-sm text-blue-700 space-y-1">
                    <li>• Mínimo 72 horas hábiles de anticipación</li>
                    <li>• No se realizan instalaciones en fines de semana</li>
                    <li>• Horario de servicio: 9:00 AM - 5:00 PM</li>
                  </ul>
                </div>

                {/* Date Selection */}
                <div className="space-y-4">
                  <Label className="text-lg font-semibold">Selecciona la Fecha de Instalación *</Label>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Calendar */}
                    <div className="space-y-3">
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start text-left font-normal h-14 text-base",
                              !formData.fecha_programada && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className="mr-3 h-5 w-5" />
                            {formData.fecha_programada ? (
                              <div>
                                <div className="font-medium">
                                  {format(formData.fecha_programada, "EEEE", { locale: es })}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {format(formData.fecha_programada, "dd 'de' MMMM 'de' yyyy", { locale: es })}
                                </div>
                              </div>
                            ) : (
                              <span>Seleccionar fecha</span>
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
                    </div>

                    {/* Time and Installer Selection */}
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="font-medium">Hora de Inicio *</Label>
                        <Select value={formData.hora_inicio} onValueChange={(value) => setFormData(prev => ({ ...prev, hora_inicio: value }))}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Seleccionar hora" />
                          </SelectTrigger>
                          <SelectContent>
                            {horasDisponibles.map(hora => (
                              <SelectItem key={hora} value={hora} className="text-base">
                                <div className="flex items-center gap-2">
                                  <Clock className="h-4 w-4" />
                                  {hora}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-3">
                        <Label className="font-medium">Instalador Asignado *</Label>
                        <Select value={formData.instalador_asignado} onValueChange={(value) => setFormData(prev => ({ ...prev, instalador_asignado: value }))}>
                          <SelectTrigger className="h-12 text-base">
                            <SelectValue placeholder="Asignar instalador" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instalador_1">
                              <div className="flex flex-col">
                                <span className="font-medium">Juan Pérez</span>
                                <span className="text-sm text-gray-500">Zona Norte</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="instalador_2">
                              <div className="flex flex-col">
                                <span className="font-medium">María García</span>
                                <span className="text-sm text-gray-500">Zona Sur</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="instalador_3">
                              <div className="flex flex-col">
                                <span className="font-medium">Carlos López</span>
                                <span className="text-sm text-gray-500">Zona Centro</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Installation Summary */}
                {formData.fecha_programada && formData.hora_inicio && (
                  <div className="bg-green-50 border border-green-200 p-6 rounded-lg">
                    <div className="flex items-center gap-2 mb-4">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <h4 className="font-semibold text-green-800">Cita Programada</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-green-700">Fecha:</span>
                        <p className="text-green-600">
                          {format(formData.fecha_programada, "EEEE, dd 'de' MMMM", { locale: es })}
                        </p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Hora:</span>
                        <p className="text-green-600">{formData.hora_inicio}</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Duración estimada:</span>
                        <p className="text-green-600">{formData.tiempo_estimado} minutos</p>
                      </div>
                      <div>
                        <span className="font-medium text-green-700">Instalador:</span>
                        <p className="text-green-600">
                          {formData.instalador_asignado === 'instalador_1' && 'Juan Pérez'}
                          {formData.instalador_asignado === 'instalador_2' && 'María García'}
                          {formData.instalador_asignado === 'instalador_3' && 'Carlos López'}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
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
                <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                  <p className="text-sm text-amber-800">
                    <strong>Información del Servicio:</strong> Los siguientes datos provienen de la captura del servicio. 
                    Verifique que sean correctos antes de confirmar.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Contacto del Cliente *</Label>
                    <Input
                      value={formData.contacto_cliente}
                      onChange={(e) => setFormData(prev => ({ ...prev, contacto_cliente: e.target.value }))}
                      placeholder="Nombre completo"
                      className="bg-gray-50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Teléfono de Contacto *</Label>
                    <Input
                      type="tel"
                      value={formData.telefono_contacto}
                      onChange={(e) => setFormData(prev => ({ ...prev, telefono_contacto: e.target.value }))}
                      placeholder="555-123-4567"
                      className="bg-gray-50"
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
                    className="bg-gray-50"
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

                {/* Enhanced Summary Card */}
                <Card className="border-2 border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
                  <CardHeader className="pb-4">
                    <CardTitle className="text-blue-900 text-xl flex items-center gap-2">
                      <CheckCircle className="h-6 w-6" />
                      Resumen de la Instalación
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700">Vehículo</span>
                          <span className="text-blue-900 font-semibold">
                            {formData.marca_vehiculo} {formData.modelo_vehiculo} {formData.año_vehiculo}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700">Tipo de Instalación</span>
                          <span className="text-blue-900">
                            {tiposInstalacion.find(t => t.value === formData.tipo_instalacion)?.label}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700">Fecha y Hora</span>
                          <span className="text-blue-900">
                            {formData.fecha_programada ? format(formData.fecha_programada, "PPP", { locale: es }) : 'No seleccionada'} 
                            {formData.hora_inicio && ` a las ${formData.hora_inicio}`}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700">Duración Estimada</span>
                          <span className="text-blue-900">{formData.tiempo_estimado} minutos</span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700">Instalador</span>
                          <span className="text-blue-900">
                            {formData.instalador_asignado === 'instalador_1' && 'Juan Pérez - Zona Norte'}
                            {formData.instalador_asignado === 'instalador_2' && 'María García - Zona Sur'}
                            {formData.instalador_asignado === 'instalador_3' && 'Carlos López - Zona Centro'}
                            {!formData.instalador_asignado && 'No asignado'}
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-blue-700">Sensores Adicionales</span>
                          <span className="text-blue-900">
                            {formData.sensores_adicionales.length > 0 
                              ? formData.sensores_adicionales.join(', ') 
                              : 'Ninguno adicional'
                            }
                          </span>
                        </div>
                      </div>
                    </div>
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
      <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Wrench className="h-6 w-6" />
            Programar Instalación GPS - Paso {currentStep} de 4
          </DialogTitle>
        </DialogHeader>

        {/* Enhanced Progress indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`flex-1 h-3 rounded-full ${
                  step <= currentStep ? 'bg-gradient-to-r from-blue-500 to-blue-600' : 'bg-gray-200'
                }`}
              />
              {step < 4 && <div className="w-2" />}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit}>
          {renderStepContent()}

          {/* Enhanced Navigation buttons */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t bg-gray-50 -mx-6 px-6 -mb-6 pb-6">
            <Button
              type="button"
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
              className="flex items-center gap-2"
            >
              ← Anterior
            </Button>
            
            <div className="flex gap-3">
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
                  className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
                >
                  Siguiente →
                </Button>
              ) : (
                <Button 
                  type="submit" 
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold px-8 flex items-center gap-2"
                  disabled={!validateCurrentStep() || createProgramacion.isPending}
                >
                  <CheckCircle className="h-4 w-4" />
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
