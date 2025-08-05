import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon, Car, MapPin, User, Clock } from 'lucide-react';
import { format, addDays, isWeekend } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useVehicleData } from '@/hooks/useVehicleData';

interface BasicInstallationFormProps {
  formData: {
    servicio_id: string;
    fecha_programada: Date | null;
    hora_inicio: string;
    tiempo_estimado: number;
    direccion_instalacion: string;
    contacto_cliente: string;
    telefono_contacto: string;
    vehiculo_marca: string;
    vehiculo_modelo: string;
    vehiculo_año: string;
    tipo_combustible: string;
    es_electrico: boolean;
    tipo_instalacion: string;
    sensores_requeridos: string[];
    observaciones: string;
  };
  onFormComplete: (data: any) => void;
  isLoading: boolean;
}

export const BasicInstallationForm = ({ 
  formData, 
  onFormComplete, 
  isLoading 
}: BasicInstallationFormProps) => {
  const [localFormData, setLocalFormData] = useState(formData);
  const { marcas, loadingMarcas, fetchModelosPorMarca } = useVehicleData();
  const [modelos, setModelos] = useState<any[]>([]);
  const [loadingModelos, setLoadingModelos] = useState(false);

  // Update local form when props change
  useEffect(() => {
    setLocalFormData(formData);
  }, [formData]);

  // Fetch models when brand changes
  useEffect(() => {
    if (localFormData.vehiculo_marca) {
      loadModels();
    }
  }, [localFormData.vehiculo_marca]);

  const loadModels = async () => {
    if (!localFormData.vehiculo_marca) return;
    
    setLoadingModelos(true);
    try {
      const modelosData = await fetchModelosPorMarca(localFormData.vehiculo_marca);
      setModelos(modelosData || []);
    } catch (error) {
      console.error('Error loading models:', error);
    } finally {
      setLoadingModelos(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setLocalFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSensorToggle = (sensor: string) => {
    setLocalFormData(prev => ({
      ...prev,
      sensores_requeridos: prev.sensores_requeridos.includes(sensor)
        ? prev.sensores_requeridos.filter(s => s !== sensor)
        : [...prev.sensores_requeridos, sensor]
    }));
  };

  const isFormValid = () => {
    return (
      localFormData.fecha_programada &&
      localFormData.direccion_instalacion &&
      localFormData.contacto_cliente &&
      localFormData.vehiculo_marca &&
      localFormData.vehiculo_modelo
    );
  };

  const availableSensors = [
    'sensor_puerta',
    'sensor_ignicion', 
    'sensor_combustible',
    'sensor_temperatura',
    'boton_panico',
    'sensor_presencia',
    'geocercas'
  ];

  return (
    <div className="space-y-6">
      {/* Vehicle Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Información del Vehículo
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="vehiculo_marca">Marca del Vehículo *</Label>
              <Select
                value={localFormData.vehiculo_marca}
                onValueChange={(value) => handleInputChange('vehiculo_marca', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar marca" />
                </SelectTrigger>
                <SelectContent>
                  {marcas.map((marca) => (
                    <SelectItem key={marca.id} value={marca.nombre}>
                      {marca.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="vehiculo_modelo">Modelo del Vehículo *</Label>
              <Select
                value={localFormData.vehiculo_modelo}
                onValueChange={(value) => handleInputChange('vehiculo_modelo', value)}
                disabled={!localFormData.vehiculo_marca || loadingModelos}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar modelo" />
                </SelectTrigger>
                <SelectContent>
                  {modelos.map((modelo) => (
                    <SelectItem key={modelo.id} value={modelo.nombre}>
                      {modelo.nombre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="vehiculo_año">Año del Vehículo</Label>
              <Input
                id="vehiculo_año"
                type="number"
                placeholder="2020"
                value={localFormData.vehiculo_año}
                onChange={(e) => handleInputChange('vehiculo_año', e.target.value)}
                min="1990"
                max={new Date().getFullYear() + 1}
              />
            </div>

            <div>
              <Label htmlFor="tipo_combustible">Tipo de Combustible</Label>
              <Select
                value={localFormData.tipo_combustible}
                onValueChange={(value) => handleInputChange('tipo_combustible', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gasolina">Gasolina</SelectItem>
                  <SelectItem value="diesel">Diésel</SelectItem>
                  <SelectItem value="electrico">Eléctrico</SelectItem>
                  <SelectItem value="hibrido">Híbrido</SelectItem>
                  <SelectItem value="gas">Gas LP/Natural</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipo_instalacion">Tipo de Instalación</Label>
              <Select
                value={localFormData.tipo_instalacion}
                onValueChange={(value) => handleInputChange('tipo_instalacion', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gps_basico">GPS Básico</SelectItem>
                  <SelectItem value="gps_avanzado">GPS Avanzado</SelectItem>
                  <SelectItem value="monitoreo_completo">Monitoreo Completo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Programación de Instalación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Fecha de Instalación *</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !localFormData.fecha_programada && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {localFormData.fecha_programada ? (
                      format(localFormData.fecha_programada, "PPP", { locale: es })
                    ) : (
                      "Seleccionar fecha"
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={localFormData.fecha_programada || undefined}
                    onSelect={(date) => handleInputChange('fecha_programada', date)}
                    disabled={(date) => 
                      date < new Date() || isWeekend(date)
                    }
                    initialFocus
                    locale={es}
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div>
              <Label htmlFor="hora_inicio">Hora de Inicio</Label>
              <Input
                id="hora_inicio"
                type="time"
                value={localFormData.hora_inicio}
                onChange={(e) => handleInputChange('hora_inicio', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="tiempo_estimado">Tiempo Estimado (minutos)</Label>
            <Select
              value={localFormData.tiempo_estimado.toString()}
              onValueChange={(value) => handleInputChange('tiempo_estimado', parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contact and Location */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Contacto y Ubicación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contacto_cliente">Contacto Cliente *</Label>
              <Input
                id="contacto_cliente"
                placeholder="Nombre del contacto"
                value={localFormData.contacto_cliente}
                onChange={(e) => handleInputChange('contacto_cliente', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="telefono_contacto">Teléfono de Contacto</Label>
              <Input
                id="telefono_contacto"
                placeholder="+52 55 1234 5678"
                value={localFormData.telefono_contacto}
                onChange={(e) => handleInputChange('telefono_contacto', e.target.value)}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="direccion_instalacion">Dirección de Instalación *</Label>
            <Textarea
              id="direccion_instalacion"
              placeholder="Dirección completa donde se realizará la instalación"
              value={localFormData.direccion_instalacion}
              onChange={(e) => handleInputChange('direccion_instalacion', e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Sensors Configuration */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Sensores Requeridos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-2">
            {availableSensors.map((sensor) => (
              <label key={sensor} className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={localFormData.sensores_requeridos.includes(sensor)}
                  onChange={() => handleSensorToggle(sensor)}
                  className="rounded"
                />
                <span className="text-sm capitalize">
                  {sensor.replace('_', ' ')}
                </span>
              </label>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Additional Notes */}
      <Card>
        <CardHeader>
          <CardTitle>Observaciones Adicionales</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="Instrucciones especiales, requisitos adicionales, etc."
            value={localFormData.observaciones}
            onChange={(e) => handleInputChange('observaciones', e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end">
        <Button 
          onClick={() => onFormComplete(localFormData)}
          disabled={!isFormValid() || isLoading}
          size="lg"
        >
          {isLoading ? 'Creando...' : 'Continuar a Configuración de Kit'}
        </Button>
      </div>
    </div>
  );
};