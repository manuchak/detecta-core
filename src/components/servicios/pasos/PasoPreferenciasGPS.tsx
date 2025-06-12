
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Settings, Target, MapPin, DollarSign, AlertTriangle } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoPreferenciasGPSProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoPreferenciasGPS = ({ form }: PasoPreferenciasGPSProps) => {
  const objetivos = [
    { 
      value: 'seguridad', 
      label: 'Seguridad', 
      color: 'bg-red-100 text-red-800', 
      descripcion: 'Prevenir robos y proteger al conductor',
      icono: '🛡️'
    },
    { 
      value: 'monitoreo', 
      label: 'Monitoreo', 
      color: 'bg-blue-100 text-blue-800', 
      descripcion: 'Supervisar ubicación y rutas en tiempo real',
      icono: '📍'
    },
    { 
      value: 'eficiencia', 
      label: 'Eficiencia', 
      color: 'bg-green-100 text-green-800', 
      descripcion: 'Optimizar combustible y mantenimiento',
      icono: '⚡'
    },
    { 
      value: 'control_flota', 
      label: 'Control de Flota', 
      color: 'bg-purple-100 text-purple-800', 
      descripcion: 'Gestionar múltiples vehículos de manera centralizada',
      icono: '🚚'
    }
  ];

  const condicionesEspeciales = [
    { 
      id: 'zona_rural', 
      label: 'Operación en zonas rurales', 
      descripcion: 'Vehículo opera frecuentemente en áreas con poca cobertura celular' 
    },
    { 
      id: 'conductor_mayor', 
      label: 'Conductor de edad avanzada', 
      descripcion: 'Necesita interfaz simple y alertas claras' 
    },
    { 
      id: 'trabajo_nocturno', 
      label: 'Trabajo nocturno frecuente', 
      descripcion: 'Requiere monitoreo especial en horarios nocturnos' 
    },
    { 
      id: 'transporte_carga', 
      label: 'Transporte de carga valiosa', 
      descripcion: 'Necesita seguridad adicional para proteger mercancías' 
    },
    { 
      id: 'multiples_conductores', 
      label: 'Múltiples conductores', 
      descripcion: 'Diferentes personas usan el mismo vehículo' 
    },
    { 
      id: 'empresa_familiar', 
      label: 'Empresa familiar', 
      descripcion: 'Monitoreo discreto para familiares que usan el vehículo' 
    }
  ];

  const rangosPresupuesto = [
    { value: 'basico', label: 'Básico (Menos de $500/mes)', descripcion: 'Funcionalidades esenciales' },
    { value: 'intermedio', label: 'Intermedio ($500-$1000/mes)', descripcion: 'Balance funcionalidad-precio' },
    { value: 'premium', label: 'Premium ($1000+/mes)', descripcion: 'Todas las funcionalidades disponibles' },
    { value: 'por_definir', label: 'Por definir', descripcion: 'Prefiero ver opciones antes de decidir' }
  ];

  const selectedObjetivos = form.watch('objetivos_principales') || [];

  const handleObjetivoToggle = (objetivo: string) => {
    const current = selectedObjetivos;
    const updated = current.includes(objetivo)
      ? current.filter(o => o !== objetivo)
      : [...current, objetivo];
    form.setValue('objetivos_principales', updated);
  };

  return (
    <div className="space-y-6">
      {/* Objetivos Principales - Multiple Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            ¿Cuáles son sus objetivos principales? (Puede seleccionar varios)
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Esto nos ayudará a recomendar el equipamiento más adecuado para sus necesidades
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {objetivos.map((objetivo) => {
              const isSelected = selectedObjetivos.includes(objetivo.value);
              return (
                <div
                  key={objetivo.value}
                  className={`border rounded-lg p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                  onClick={() => handleObjetivoToggle(objetivo.value)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{objetivo.icono}</span>
                      <Badge className={objetivo.color}>{objetivo.label}</Badge>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onChange={() => handleObjetivoToggle(objetivo.value)}
                    />
                  </div>
                  <p className="text-sm text-gray-600">{objetivo.descripcion}</p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Condiciones Especiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Condiciones Especiales de Operación
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Seleccione las situaciones que aplican a su caso (puede seleccionar varias)
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {condicionesEspeciales.map((condicion) => (
            <FormField
              key={condicion.id}
              control={form.control}
              name={`funcionalidades_deseadas.${condicion.id}` as any}
              render={({ field }) => (
                <FormItem className="flex items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="flex-1">
                    <FormLabel className="font-medium">{condicion.label}</FormLabel>
                    <p className="text-sm text-gray-600">{condicion.descripcion}</p>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Rango de Presupuesto */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Rango de Presupuesto Mensual
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Esto nos ayuda a enfocar las recomendaciones en opciones que se ajusten a sus posibilidades
          </p>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="presupuesto_estimado"
            render={({ field }) => (
              <FormItem>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {rangosPresupuesto.map((rango) => (
                    <div
                      key={rango.value}
                      className={`border rounded-lg p-4 cursor-pointer transition-all ${
                        field.value === rango.value 
                          ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                          : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => field.onChange(rango.value)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{rango.label}</span>
                        <input
                          type="radio"
                          checked={field.value === rango.value}
                          onChange={() => field.onChange(rango.value)}
                          className="h-4 w-4"
                        />
                      </div>
                      <p className="text-xs text-gray-600">{rango.descripcion}</p>
                    </div>
                  ))}
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Comentarios Adicionales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Comentarios Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="condiciones_especiales_uso"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Describa cualquier necesidad específica o situación particular
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ej: Necesito alertas por WhatsApp porque no reviso emails frecuentemente, el vehículo se usa para delivery y necesito control de tiempos, tengo problemas de robo en la zona donde trabajo, etc."
                    rows={4}
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
        <h4 className="font-medium text-blue-900 mb-2">💡 Siguiente Paso</h4>
        <p className="text-sm text-blue-800">
          En el siguiente paso podrá seleccionar las funcionalidades técnicas específicas 
          basándose en las prioridades que ha definido aquí. Nuestro sistema le sugerirá 
          las opciones más relevantes según sus necesidades.
        </p>
      </div>
    </div>
  );
};
