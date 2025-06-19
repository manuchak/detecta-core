
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
      color: 'bg-red-100 text-red-800 border-red-200', 
      descripcion: 'Prevenir robos y proteger al conductor',
      icono: '🛡️'
    },
    { 
      value: 'monitoreo', 
      label: 'Monitoreo', 
      color: 'bg-blue-100 text-blue-800 border-blue-200', 
      descripcion: 'Supervisar ubicación y rutas en tiempo real',
      icono: '📍'
    },
    { 
      value: 'eficiencia', 
      label: 'Eficiencia', 
      color: 'bg-green-100 text-green-800 border-green-200', 
      descripcion: 'Optimizar combustible y mantenimiento',
      icono: '⚡'
    },
    { 
      value: 'control_flota', 
      label: 'Control de Flota', 
      color: 'bg-purple-100 text-purple-800 border-purple-200', 
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

  // Arreglar el manejo de objetivos seleccionados
  const selectedObjetivos = form.watch('objetivos_principales') || [];

  const handleObjetivoToggle = (objetivo: string) => {
    const current = [...selectedObjetivos];
    const index = current.indexOf(objetivo);
    
    if (index > -1) {
      current.splice(index, 1);
    } else {
      current.push(objetivo);
    }
    
    form.setValue('objetivos_principales', current);
  };

  return (
    <div className="space-y-8">
      {/* Objetivos Principales - Corregido el bug de selección */}
      <Card className="border-l-4 border-l-blue-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-blue-600" />
            ¿Cuáles son sus objetivos principales?
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Puede seleccionar varios objetivos. Esto nos ayudará a recomendar el equipamiento más adecuado.
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {objetivos.map((objetivo) => {
              const isSelected = selectedObjetivos.includes(objetivo.value);
              return (
                <div
                  key={objetivo.value}
                  className={`relative border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                    isSelected 
                      ? 'border-blue-500 bg-blue-50 shadow-sm' 
                      : 'border-gray-200 hover:border-gray-300 bg-white'
                  }`}
                  onClick={() => handleObjetivoToggle(objetivo.value)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{objetivo.icono}</span>
                      <Badge className={`${objetivo.color} border`}>
                        {objetivo.label}
                      </Badge>
                    </div>
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={() => handleObjetivoToggle(objetivo.value)}
                      className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    />
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {objetivo.descripcion}
                  </p>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Condiciones Especiales - Mejorado el UI y corregido alineación */}
      <Card className="border-l-4 border-l-orange-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <AlertTriangle className="h-5 w-5 text-orange-600" />
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
                <FormItem className="flex items-start space-x-3 space-y-0 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <FormControl>
                    <Checkbox
                      checked={field.value || false}
                      onCheckedChange={field.onChange}
                      className="mt-1 data-[state=checked]:bg-orange-600 data-[state=checked]:border-orange-600"
                    />
                  </FormControl>
                  <div className="flex-1 space-y-1">
                    <FormLabel className="text-sm font-medium text-gray-900 cursor-pointer">
                      {condicion.label}
                    </FormLabel>
                    <p className="text-sm text-gray-600 leading-relaxed">
                      {condicion.descripcion}
                    </p>
                  </div>
                </FormItem>
              )}
            />
          ))}
        </CardContent>
      </Card>

      {/* Rango de Presupuesto - Mejorado el UI */}
      <Card className="border-l-4 border-l-green-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5 text-green-600" />
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {rangosPresupuesto.map((rango) => (
                    <div
                      key={rango.value}
                      className={`border-2 rounded-lg p-4 cursor-pointer transition-all duration-200 hover:shadow-md ${
                        field.value === rango.value 
                          ? 'border-green-500 bg-green-50 shadow-sm' 
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      }`}
                      onClick={() => field.onChange(rango.value)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-sm">{rango.label}</span>
                        <input
                          type="radio"
                          checked={field.value === rango.value}
                          onChange={() => field.onChange(rango.value)}
                          className="h-4 w-4 text-green-600 border-gray-300 focus:ring-green-500"
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
      <Card className="border-l-4 border-l-gray-500">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Settings className="h-5 w-5 text-gray-600" />
            Comentarios Adicionales
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="condiciones_especiales_uso"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-semibold text-gray-700">
                  Describa cualquier necesidad específica o situación particular
                </FormLabel>
                <FormControl>
                  <Textarea 
                    {...field} 
                    placeholder="Ejemplo: Necesito alertas por WhatsApp porque no reviso emails frecuentemente, el vehículo se usa para delivery y necesito control de tiempos, tengo problemas de robo en la zona donde trabajo, etc."
                    rows={4}
                    value={field.value || ''}
                    className="resize-none"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Información sobre el siguiente paso */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
              <Target className="h-4 w-4 text-blue-600" />
            </div>
          </div>
          <div>
            <h4 className="font-medium text-blue-900 mb-1">💡 Siguiente Paso</h4>
            <p className="text-sm text-blue-800">
              En el siguiente paso podrá seleccionar las funcionalidades técnicas específicas 
              basándose en las prioridades que ha definido aquí. Nuestro sistema le sugerirá 
              las opciones más relevantes según sus necesidades.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
