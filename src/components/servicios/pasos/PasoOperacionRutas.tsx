import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Clock } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoOperacionRutasProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoOperacionRutas = ({ form }: PasoOperacionRutasProps) => {
  const { fields: rutasFields, append: appendRuta, remove: removeRuta } = useFieldArray({
    control: form.control,
    name: "rutas_habituales"
  });

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  return (
    <div className="space-y-6">
      {/* Horarios de Operación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios de Operación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="horarios_operacion.es_24_horas"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>¿Opera las 24 horas?</FormLabel>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {!form.watch('horarios_operacion.es_24_horas') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diasSemana.map((dia) => (
                <div key={dia.key} className="border rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{dia.label}</span>
                    <FormField
                      control={form.control}
                      name={`horarios_operacion.${dia.key}.activo` as any}
                      render={({ field }) => (
                        <Switch 
                          checked={field.value} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  
                  {form.watch(`horarios_operacion.${dia.key}.activo` as any) && (
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`horarios_operacion.${dia.key}.inicio` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Inicio</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`horarios_operacion.${dia.key}.fin` as any}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Fin</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Rutas Habituales */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas Habituales</CardTitle>
          <p className="text-sm text-gray-600">
            Describe las rutas que el vehículo recorre frecuentemente
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {rutasFields.map((field, index) => (
            <div key={field.id} className="flex gap-2">
              <FormField
                control={form.control}
                name={`rutas_habituales.${index}` as const}
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={`Ruta ${index + 1}: Ej. Casa - Oficina - Cliente ABC`}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => removeRuta(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={() => appendRuta("")}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ruta
          </Button>
        </CardContent>
      </Card>

      {/* Zonas de Riesgo */}
      <Card>
        <CardHeader>
          <CardTitle>Zonas de Riesgo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="zonas_riesgo_identificadas"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>¿Ha identificado zonas de riesgo en sus rutas?</FormLabel>
                <FormControl>
                  <Switch 
                    checked={field.value} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {form.watch('zonas_riesgo_identificadas') && (
            <FormField
              control={form.control}
              name="detalles_zonas_riesgo"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Detalles de las Zonas de Riesgo</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      placeholder="Describe las zonas de riesgo identificadas, horarios problemáticos, tipos de incidentes, etc."
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
    </div>
  );
};
