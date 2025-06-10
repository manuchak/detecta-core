
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useServiciosMonitoreoCompleto } from '@/hooks/useServiciosMonitoreoCompleto';
import { Settings, AlertTriangle } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoPreferenciasGPSProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoPreferenciasGPS = ({ form }: PasoPreferenciasGPSProps) => {
  const { marcasGPS, getModelosPorMarca } = useServiciosMonitoreoCompleto();
  const marcaSeleccionada = form.watch('marca_gps_preferida');
  
  const { data: modelosGPS } = marcaSeleccionada 
    ? getModelosPorMarca(marcaSeleccionada) 
    : { data: [] };

  return (
    <div className="space-y-6">
      {/* Preferencias de Equipo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Preferencias de Equipamiento GPS
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="tipo_gps_preferido"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tipo de GPS Preferido</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Seleccionar tipo de GPS" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="basico">Básico - Ubicación y reportes</SelectItem>
                    <SelectItem value="intermedio">Intermedio - Sensores adicionales</SelectItem>
                    <SelectItem value="avanzado">Avanzado - Funcionalidades completas</SelectItem>
                    <SelectItem value="personalizado">Personalizado - Según necesidades</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="marca_gps_preferida"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Marca GPS Preferida</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar marca" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {marcasGPS?.map((marca) => (
                        <SelectItem key={marca.id} value={marca.id}>
                          {marca.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="modelo_gps_preferido"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Modelo GPS Preferido</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value}
                    disabled={!marcaSeleccionada}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder={
                          marcaSeleccionada ? "Seleccionar modelo" : "Primero selecciona una marca"
                        } />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {modelosGPS?.map((modelo) => (
                        <SelectItem key={modelo.id} value={modelo.id}>
                          {modelo.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Funcionalidades Especiales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Funcionalidades de Seguridad
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="requiere_paro_motor"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>¿Requiere función de paro de motor remoto?</FormLabel>
                  <p className="text-sm text-gray-600 mt-1">
                    Capacidad de detener el vehículo remotamente en caso de robo
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

          {form.watch('requiere_paro_motor') && (
            <FormField
              control={form.control}
              name="condiciones_paro_motor"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condiciones para Paro de Motor</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe en qué situaciones específicas se debería activar el paro de motor (ej: solo en horario nocturno, solo fuera de rutas conocidas, etc.)"
                      rows={3}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Recomendación Técnica</h4>
        <p className="text-sm text-blue-800">
          Nuestro equipo técnico evaluará sus necesidades específicas y recomendará el equipo 
          más adecuado considerando factores como el tipo de vehículo, rutas de operación, 
          presupuesto y funcionalidades requeridas. No se preocupe si no está seguro de las 
          especificaciones técnicas - lo asesoraremos durante el proceso.
        </p>
      </div>
    </div>
  );
};
