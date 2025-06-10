
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl } from '@/components/ui/form';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, Navigation, Car, Battery, Wifi } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoConfiguracionSensoresProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoConfiguracionSensores = ({ form }: PasoConfiguracionSensoresProps) => {
  const sensorCategories = [
    {
      title: "Sensores de Seguridad y Antimanipulación",
      icon: Shield,
      color: "bg-red-50 border-red-200",
      sensors: [
        { key: 'sensor_puerta', label: 'Sensor de Puerta', description: 'Detecta apertura/cierre de puertas' },
        { key: 'sensor_ignicion', label: 'Sensor de Ignición', description: 'Monitorea encendido/apagado del motor' },
        { key: 'boton_panico', label: 'Botón de Pánico', description: 'Alerta de emergencia manual' },
        { key: 'corte_ignicion_paro_motor', label: 'Corte de Ignición/Paro Motor', description: 'Control remoto del motor' },
        { key: 'deteccion_jamming', label: 'Detección de Jamming', description: 'Alerta por bloqueo de señal' },
        { key: 'sensor_presencia_vibracion', label: 'Sensor de Presencia/Vibración', description: 'Detecta movimiento del vehículo' }
      ]
    },
    {
      title: "Sensores de Ubicación y Movimiento",
      icon: Navigation,
      color: "bg-blue-50 border-blue-200",
      sensors: [
        { key: 'geocercas_dinamicas', label: 'Geocercas Dinámicas', description: 'Zonas de alerta personalizables' }
      ]
    },
    {
      title: "Sensores de Operación del Vehículo",
      icon: Car,
      color: "bg-green-50 border-green-200",
      sensors: [
        { key: 'lectura_obdii_can_bus', label: 'Lectura OBDII/CAN Bus', description: 'Datos del sistema del vehículo' },
        { key: 'sensor_combustible', label: 'Sensor de Combustible', description: 'Monitoreo de nivel de combustible' },
        { key: 'sensor_temperatura', label: 'Sensor de Temperatura', description: 'Control de temperatura del motor' },
        { key: 'sensor_carga_peso', label: 'Sensor de Carga/Peso', description: 'Monitoreo de carga en vehículos comerciales' }
      ]
    },
    {
      title: "Funciones de Energía y Autonomía",
      icon: Battery,
      color: "bg-yellow-50 border-yellow-200",
      sensors: [
        { key: 'bateria_interna_respaldo', label: 'Batería Interna de Respaldo', description: 'Operación sin energía del vehículo' },
        { key: 'alerta_desconexion_electrica', label: 'Alerta Desconexión Eléctrica', description: 'Notifica desconexión de batería' },
        { key: 'monitoreo_voltaje', label: 'Monitoreo de Voltaje', description: 'Control del estado de la batería' }
      ]
    },
    {
      title: "Conectividad y Comunicación",
      icon: Wifi,
      color: "bg-purple-50 border-purple-200",
      sensors: [
        { key: 'bluetooth_wifi', label: 'Bluetooth/WiFi', description: 'Conectividad adicional' },
        { key: 'compatibilidad_sensores_rs232', label: 'Compatibilidad con Sensores RS232', description: 'Conexión a sensores especializados' }
      ]
    }
  ];

  const countSelectedSensors = () => {
    const sensores = form.watch('configuracion_sensores');
    return Object.values(sensores).filter(Boolean).length;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuración de Sensores y Funcionalidades</h3>
          <p className="text-sm text-gray-600">
            Seleccione las funcionalidades que requiere para su sistema de monitoreo
          </p>
        </div>
        <Badge variant="outline">
          {countSelectedSensors()} sensores seleccionados
        </Badge>
      </div>

      {sensorCategories.map((category) => {
        const IconComponent = category.icon;
        return (
          <Card key={category.title} className={category.color}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <IconComponent className="h-5 w-5" />
                {category.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {category.sensors.map((sensor) => (
                <FormField
                  key={sensor.key}
                  control={form.control}
                  name={`configuracion_sensores.${sensor.key}` as any}
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between space-y-0">
                      <div className="flex-1">
                        <FormLabel className="font-medium">
                          {sensor.label}
                        </FormLabel>
                        <p className="text-sm text-gray-600 mt-1">
                          {sensor.description}
                        </p>
                      </div>
                      <FormControl>
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              ))}
            </CardContent>
          </Card>
        );
      })}

      <div className="bg-gray-50 p-4 rounded-lg">
        <h4 className="font-medium text-gray-900 mb-2">Nota sobre Sensores</h4>
        <ul className="text-sm text-gray-700 space-y-1">
          <li>• Algunos sensores pueden requerir instalación adicional o hardware específico</li>
          <li>• El costo del servicio variará según la cantidad y tipo de sensores seleccionados</li>
          <li>• Nuestro equipo técnico validará la compatibilidad con su vehículo</li>
          <li>• Puede modificar esta configuración durante la evaluación técnica</li>
        </ul>
      </div>
    </div>
  );
};
