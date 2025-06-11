
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Shield, MapPin, Clock, AlertTriangle, Car } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoPreferenciasGPSProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoPreferenciasGPS = ({ form }: PasoPreferenciasGPSProps) => {
  const funcionalidadesBasicas = [
    { id: 'ubicacion_tiempo_real', label: 'Ubicación en tiempo real', descripcion: 'Ver dónde está el vehículo en cualquier momento' },
    { id: 'historial_rutas', label: 'Historial de rutas', descripcion: 'Revisar recorridos anteriores' },
    { id: 'alertas_velocidad', label: 'Alertas de velocidad', descripcion: 'Notificaciones cuando se excede el límite' },
    { id: 'geocercas', label: 'Geocercas (zonas virtuales)', descripcion: 'Alertas al entrar/salir de áreas definidas' }
  ];

  const funcionalidadesSeguridad = [
    { id: 'boton_panico', label: 'Botón de pánico', descripcion: 'Botón de emergencia para situaciones de riesgo' },
    { id: 'paro_motor', label: 'Paro de motor remoto', descripcion: 'Detener el vehículo a distancia en caso de robo' },
    { id: 'alerta_jamming', label: 'Detección de inhibidores', descripcion: 'Detectar intentos de bloquear la señal GPS' },
    { id: 'sensor_vibracion', label: 'Sensor de movimiento/vibración', descripcion: 'Alertas cuando el vehículo se mueve sin autorización' }
  ];

  const funcionalidadesAvanzadas = [
    { id: 'sensor_combustible', label: 'Monitor de combustible', descripcion: 'Controlar nivel y consumo de gasolina' },
    { id: 'diagnosticos_vehiculo', label: 'Diagnósticos del vehículo', descripcion: 'Estado del motor, batería y otros sistemas' },
    { id: 'sensor_puertas', label: 'Sensores de puertas', descripcion: 'Saber cuándo se abren/cierran las puertas' },
    { id: 'camara_foto', label: 'Cámara para fotos', descripcion: 'Tomar fotos del conductor o entorno' }
  ];

  const prioridades = [
    { value: 'seguridad', label: 'Seguridad', color: 'bg-red-100 text-red-800', descripcion: 'Prevenir robos y proteger al conductor' },
    { value: 'monitoreo', label: 'Monitoreo', color: 'bg-blue-100 text-blue-800', descripcion: 'Supervisar ubicación y rutas' },
    { value: 'eficiencia', label: 'Eficiencia', color: 'bg-green-100 text-green-800', descripcion: 'Optimizar combustible y mantenimiento' },
    { value: 'control_flota', label: 'Control de Flota', color: 'bg-purple-100 text-purple-800', descripcion: 'Gestionar múltiples vehículos' }
  ];

  return (
    <div className="space-y-6">
      {/* Prioridad Principal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            ¿Cuál es su prioridad principal?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Esto nos ayudará a recomendar el equipamiento más adecuado
          </p>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="prioridad_funcional"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {prioridades.map((prioridad) => (
                    <div
                      key={prioridad.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        field.value === prioridad.value 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => field.onChange(prioridad.value)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge className={prioridad.color}>{prioridad.label}</Badge>
                        <input
                          type="radio"
                          checked={field.value === prioridad.value}
                          onChange={() => field.onChange(prioridad.value)}
                          className="h-4 w-4"
                        />
                      </div>
                      <p className="text-sm text-gray-600">{prioridad.descripcion}</p>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Funcionalidades Básicas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5" />
            Funcionalidades Básicas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Seleccione las funciones que considera esenciales
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {funcionalidadesBasicas.map((func) => (
            <FormField
              key={func.id}
              control={form.control}
              name={`funcionalidades_deseadas.${func.id}` as any}
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="font-medium">{func.label}</FormLabel>
                    <p className="text-sm text-gray-600">{func.descripcion}</p>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Funcionalidades de Seguridad */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Funcionalidades de Seguridad
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Funciones especializadas para protección del vehículo y conductor
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {funcionalidadesSeguridad.map((func) => (
            <FormField
              key={func.id}
              control={form.control}
              name={`funcionalidades_deseadas.${func.id}` as any}
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="font-medium">{func.label}</FormLabel>
                    <p className="text-sm text-gray-600">{func.descripcion}</p>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Funcionalidades Avanzadas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Car className="h-5 w-5" />
            Funcionalidades Avanzadas
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Funciones adicionales para un control más detallado
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {funcionalidadesAvanzadas.map((func) => (
            <FormField
              key={func.id}
              control={form.control}
              name={`funcionalidades_deseadas.${func.id}` as any}
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="font-medium">{func.label}</FormLabel>
                    <p className="text-sm text-gray-600">{func.descripcion}</p>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Condiciones Especiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Condiciones Especiales de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="condiciones_especiales_uso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Describa cualquier condición especial de uso o necesidad específica
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ej: El vehículo opera en zonas rurales sin buena cobertura celular, necesito alertas por WhatsApp, el conductor es de edad avanzada y necesita interfaz simple, etc."
                    rows={4}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="presupuesto_estimado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Presupuesto estimado (opcional)</FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ej: Tengo un presupuesto de $X pesos mensuales, busco la opción más económica, calidad-precio balanceado, etc."
                    rows={2}
                    value={field.value || ''}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">💡 Recomendación Personalizada</h4>
        <p className="text-sm text-blue-800">
          Basándonos en sus selecciones, nuestro equipo técnico le recomendará el equipamiento 
          GPS más adecuado para sus necesidades. No se preocupe por las especificaciones técnicas 
          - nosotros nos encargamos de encontrar la solución perfecta para usted.
        </p>
      </div>
    </div>
  );
};
