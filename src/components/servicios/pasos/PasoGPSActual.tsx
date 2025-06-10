
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Satellite, Shield } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoGPSActualProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoGPSActual = ({ form }: PasoGPSActualProps) => {
  return (
    <div className="space-y-6">
      {/* GPS Instalado */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Satellite className="h-5 w-5" />
            Equipamiento GPS Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="cuenta_gps_instalado"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>¿Cuenta actualmente con GPS instalado?</FormLabel>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('cuenta_gps_instalado') && (
            <FormField
              control={form.control}
              name="detalles_gps_actual"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles del GPS Actual</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe la marca, modelo, funcionalidades del GPS actual y nivel de satisfacción con el servicio"
                      rows={4}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
        </CardContent>
      </Card>

      {/* Botón de Pánico */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Sistemas de Seguridad Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <FormField
            control={form.control}
            name="cuenta_boton_panico"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <div>
                  <FormLabel>¿Cuenta con botón de pánico?</FormLabel>
                  <p className="text-sm text-gray-600 mt-1">
                    Sistema de alerta de emergencia manual
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
        </CardContent>
      </Card>

      <div className="bg-amber-50 p-4 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">Nota Importante</h4>
        <p className="text-sm text-amber-800">
          Si actualmente cuenta con equipamiento GPS, nuestro equipo técnico realizará una evaluación 
          para determinar la compatibilidad con nuestros sistemas de monitoreo. En algunos casos, 
          podremos integrar el equipo existente, mientras que en otros será necesario un reemplazo 
          para garantizar el mejor servicio.
        </p>
      </div>
    </div>
  );
};
