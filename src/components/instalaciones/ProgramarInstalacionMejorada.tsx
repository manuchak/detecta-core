
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Car, Settings, Zap, Wrench, MapPin, Clock, User } from 'lucide-react';

interface ProgramarInstalacionMejoradaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId?: string;
}

export const ProgramarInstalacionMejorada = ({ 
  open, 
  onOpenChange, 
  servicioId 
}: ProgramarInstalacionMejoradaProps) => {
  const [currentStep, setCurrentStep] = useState(1);
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
    fecha_programada: '',
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

  const handleSensorChange = (sensor: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      sensores_adicionales: checked 
        ? [...prev.sensores_adicionales, sensor]
        : prev.sensores_adicionales.filter(s => s !== sensor)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Programar instalación:', formData);
    onOpenChange(false);
  };

  const nextStep = () => setCurrentStep(prev => Math.min(prev + 1, 4));
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
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Vehículo a Instalar *</Label>
                    <Select value={formData.vehiculo_seleccionado} onValueChange={(value) => setFormData(prev => ({ ...prev, vehiculo_seleccionado: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar vehículo del servicio" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="vehiculo_1">Vehículo 1 - Chevrolet Aveo 2020</SelectItem>
                        <SelectItem value="vehiculo_2">Vehículo 2 - Nissan Sentra 2021</SelectItem>
                        <SelectItem value="vehiculo_3">Vehículo 3 - Toyota Corolla 2019</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marca del Vehículo *</Label>
                    <Input
                      value={formData.marca_vehiculo}
                      onChange={(e) => setFormData(prev => ({ ...prev, marca_vehiculo: e.target.value }))}
                      placeholder="Ej: Toyota, Chevrolet, Nissan"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Modelo *</Label>
                    <Input
                      value={formData.modelo_vehiculo}
                      onChange={(e) => setFormData(prev => ({ ...prev, modelo_vehiculo: e.target.value }))}
                      placeholder="Ej: Corolla, Aveo, Sentra"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Año *</Label>
                    <Input
                      type="number"
                      value={formData.año_vehiculo}
                      onChange={(e) => setFormData(prev => ({ ...prev, año_vehiculo: e.target.value }))}
                      placeholder="2020"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tipo de Combustible *</Label>
                    <Select value={formData.tipo_combustible} onValueChange={(value) => setFormData(prev => ({ ...prev, tipo_combustible: value }))}>
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
                  <div className="flex items-center space-x-2 mt-6">
                    <input
                      type="checkbox"
                      id="es_electrico"
                      checked={formData.es_electrico}
                      onChange={(e) => setFormData(prev => ({ ...prev, es_electrico: e.target.checked }))}
                      className="h-4 w-4"
                    />
                    <Label htmlFor="es_electrico" className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-green-600" />
                      Vehículo Eléctrico/Híbrido
                    </Label>
                  </div>
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
              <CardContent className="space-y-4">
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

                <div className="space-y-3">
                  <Label>Sensores Adicionales Solicitados</Label>
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

                <div className="space-y-2">
                  <Label>Ubicación Preferida de Instalación</Label>
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
                  <Calendar className="h-5 w-5" />
                  Programación de Cita
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Fecha de Instalación *</Label>
                    <Input
                      type="date"
                      value={formData.fecha_programada}
                      onChange={(e) => setFormData(prev => ({ ...prev, fecha_programada: e.target.value }))}
                    />
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Tiempo Estimado (minutos)</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <Badge variant="outline">{formData.tiempo_estimado} minutos</Badge>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Instalador Asignado</Label>
                    <Select value={formData.instalador_asignado} onValueChange={(value) => setFormData(prev => ({ ...prev, instalador_asignado: value }))}>
                      <SelectTrigger>
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
              <CardContent className="space-y-4">
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
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <div className="flex justify-between mt-6">
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
                <Button type="button" onClick={nextStep}>
                  Siguiente
                </Button>
              ) : (
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  Programar Instalación
                </Button>
              )}
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
