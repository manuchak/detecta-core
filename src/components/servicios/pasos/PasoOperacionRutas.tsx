
import { UseFormReturn } from 'react-hook-form';
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

/**
 * Componente para gestionar horarios de operación y rutas habituales
 * Este paso del formulario maneja:
 * 1. Horarios de operación (24h o por días específicos)
 * 2. Rutas habituales (array de strings)
 * 3. Zonas de riesgo identificadas
 */
export const PasoOperacionRutas = ({ form }: PasoOperacionRutasProps) => {
  // Definición de días de la semana para los horarios
  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  // Manejo manual de rutas habituales (sin useFieldArray para arrays de strings)
  const rutasHabituales = form.watch('rutas_habituales') || [''];

  /**
   * Agrega una nueva ruta vacía al array de rutas habituales
   */
  const handleAgregarRuta = () => {
    const currentRutas = form.getValues('rutas_habituales') || [];
    form.setValue('rutas_habituales', [...currentRutas, '']);
  };

  /**
   * Elimina una ruta específica del array
   * @param index - Índice de la ruta a eliminar
   */
  const handleEliminarRuta = (index: number) => {
    const currentRutas = form.getValues('rutas_habituales') || [];
    const newRutas = currentRutas.filter((_, i) => i !== index);
    form.setValue('rutas_habituales', newRutas);
  };

  /**
   * Actualiza una ruta específica en el array
   * @param index - Índice de la ruta a actualizar
   * @param value - Nuevo valor de la ruta
   */
  const handleUpdateRuta = (index: number, value: string) => {
    const currentRutas = form.getValues('rutas_habituales') || [];
    const newRutas = [...currentRutas];
    newRutas[index] = value;
    form.setValue('rutas_habituales', newRutas);
  };

  return (
    <div className="space-y-6">
      {/* Sección: Horarios de Operación */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Horarios de Operación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Switch para operación 24 horas */}
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

          {/* Horarios específicos por día (solo si no es 24 horas) */}
          {!form.watch('horarios_operacion.es_24_horas') && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {diasSemana.map((dia) => (
                <div key={dia.key} className="border rounded-lg p-3">
                  {/* Header del día con switch de activación */}
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{dia.label}</span>
                    <FormField
                      control={form.control}
                      name={`horarios_operacion.${dia.key}.activo` as keyof CreateServicioMonitoreoCompleto}
                      render={({ field }) => (
                        <Switch 
                          checked={field.value as boolean} 
                          onCheckedChange={field.onChange}
                        />
                      )}
                    />
                  </div>
                  
                  {/* Inputs de hora de inicio y fin (solo si el día está activo) */}
                  {form.watch(`horarios_operacion.${dia.key}.activo` as keyof CreateServicioMonitoreoCompleto) && (
                    <div className="grid grid-cols-2 gap-2">
                      <FormField
                        control={form.control}
                        name={`horarios_operacion.${dia.key}.inicio` as keyof CreateServicioMonitoreoCompleto}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Inicio</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" value={field.value as string} />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name={`horarios_operacion.${dia.key}.fin` as keyof CreateServicioMonitoreoCompleto}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-xs">Fin</FormLabel>
                            <FormControl>
                              <Input {...field} type="time" value={field.value as string} />
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

      {/* Sección: Rutas Habituales */}
      <Card>
        <CardHeader>
          <CardTitle>Rutas Habituales</CardTitle>
          <p className="text-sm text-muted-foreground">
            Describe las rutas que el vehículo recorre frecuentemente
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Lista de rutas existentes */}
          {rutasHabituales.map((ruta, index) => (
            <div key={index} className="flex gap-2">
              <div className="flex-1">
                <Input
                  value={ruta}
                  onChange={(e) => handleUpdateRuta(index, e.target.value)}
                  placeholder={`Ruta ${index + 1}: Ej. Casa - Oficina - Cliente ABC`}
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => handleEliminarRuta(index)}
                disabled={rutasHabituales.length <= 1}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          
          {/* Botón para agregar nueva ruta */}
          <Button
            type="button"
            variant="outline"
            onClick={handleAgregarRuta}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Ruta
          </Button>
        </CardContent>
      </Card>

      {/* Sección: Zonas de Riesgo */}
      <Card>
        <CardHeader>
          <CardTitle>Zonas de Riesgo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Switch para identificación de zonas de riesgo */}
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

          {/* Textarea para detalles de zonas de riesgo (solo si están identificadas) */}
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
                      value={field.value || ''}
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
