
import { useState } from 'react';
import { UseFormReturn } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Clock, MapPin, Route } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoOperacionRutasProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

interface RutaEstructurada {
  nombre: string;
  origen: string;
  destino: string;
  puntos_intermedios: string;
  frecuencia: string;
}

export const PasoOperacionRutas = ({ form }: PasoOperacionRutasProps) => {
  const [rutasEstructuradas, setRutasEstructuradas] = useState<RutaEstructurada[]>([
    { nombre: '', origen: '', destino: '', puntos_intermedios: '', frecuencia: 'diaria' }
  ]);

  const diasSemana = [
    { key: 'lunes', label: 'Lunes' },
    { key: 'martes', label: 'Martes' },
    { key: 'miercoles', label: 'Miércoles' },
    { key: 'jueves', label: 'Jueves' },
    { key: 'viernes', label: 'Viernes' },
    { key: 'sabado', label: 'Sábado' },
    { key: 'domingo', label: 'Domingo' }
  ];

  const handleAgregarRuta = () => {
    setRutasEstructuradas([...rutasEstructuradas, 
      { nombre: '', origen: '', destino: '', puntos_intermedios: '', frecuencia: 'diaria' }
    ]);
  };

  const handleEliminarRuta = (index: number) => {
    if (rutasEstructuradas.length > 1) {
      setRutasEstructuradas(rutasEstructuradas.filter((_, i) => i !== index));
    }
  };

  const handleRutaChange = (index: number, field: keyof RutaEstructurada, value: string) => {
    const nuevasRutas = [...rutasEstructuradas];
    nuevasRutas[index] = { ...nuevasRutas[index], [field]: value };
    setRutasEstructuradas(nuevasRutas);
    
    // Actualizar form con las rutas estructuradas convertidas a strings
    const rutasParaForm = nuevasRutas.map(ruta => 
      `${ruta.nombre}: ${ruta.origen} → ${ruta.destino}${ruta.puntos_intermedios ? ` (vía ${ruta.puntos_intermedios})` : ''} - ${ruta.frecuencia}`
    );
    form.setValue('rutas_habituales', rutasParaForm);
  };

  const esOperacion24Horas = form.watch('horarios_operacion.es_24_horas');

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
          <FormField
            control={form.control}
            name="horarios_operacion.es_24_horas"
            render={({ field }) => (
              <FormItem className="flex items-center justify-between">
                <FormLabel>¿Opera las 24 horas?</FormLabel>
                <FormControl>
                  <Switch 
                    checked={field.value || false} 
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />

          {!esOperacion24Horas && (
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
                          checked={field.value || false} 
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
                              <Input {...field} type="time" value={field.value || ''} />
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
                              <Input {...field} type="time" value={field.value || ''} />
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

      {/* Sección: Rutas Habituales Estructuradas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Route className="h-5 w-5" />
            Rutas Habituales
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Define las rutas con puntos específicos de origen y destino para mayor precisión
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {rutasEstructuradas.map((ruta, index) => (
            <div key={index} className="border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">Ruta {index + 1}</h4>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleEliminarRuta(index)}
                  disabled={rutasEstructuradas.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel>Nombre de la Ruta</FormLabel>
                  <Input
                    value={ruta.nombre}
                    onChange={(e) => handleRutaChange(index, 'nombre', e.target.value)}
                    placeholder="Ej: Ruta Casa-Oficina"
                  />
                </div>

                <div>
                  <FormLabel>Frecuencia</FormLabel>
                  <select
                    value={ruta.frecuencia}
                    onChange={(e) => handleRutaChange(index, 'frecuencia', e.target.value)}
                    className="flex h-9 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="diaria">Diaria</option>
                    <option value="semanal">Semanal</option>
                    <option value="ocasional">Ocasional</option>
                    <option value="urgente">Solo emergencias</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-green-600" />
                    Punto de Origen *
                  </FormLabel>
                  <Input
                    value={ruta.origen}
                    onChange={(e) => handleRutaChange(index, 'origen', e.target.value)}
                    placeholder="Dirección completa de origen"
                  />
                </div>

                <div>
                  <FormLabel className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-red-600" />
                    Punto de Destino *
                  </FormLabel>
                  <Input
                    value={ruta.destino}
                    onChange={(e) => handleRutaChange(index, 'destino', e.target.value)}
                    placeholder="Dirección completa de destino"
                  />
                </div>
              </div>

              <div>
                <FormLabel>Puntos Intermedios (Opcional)</FormLabel>
                <Input
                  value={ruta.puntos_intermedios}
                  onChange={(e) => handleRutaChange(index, 'puntos_intermedios', e.target.value)}
                  placeholder="Ej: Centro Comercial Plaza Norte, Gasolinera Shell"
                />
              </div>
            </div>
          ))}
          
          <Button
            type="button"
            variant="outline"
            onClick={handleAgregarRuta}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Nueva Ruta
          </Button>
        </CardContent>
      </Card>

      {/* Sección: Zonas de Riesgo */}
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
                    checked={field.value || false} 
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

      <div className="bg-amber-50 p-4 rounded-lg">
        <h4 className="font-medium text-amber-900 mb-2">💡 Consejos para definir rutas</h4>
        <ul className="text-sm text-amber-800 space-y-1">
          <li>• Usa direcciones específicas y completas para mejor precisión del GPS</li>
          <li>• Incluye referencias conocidas en los puntos intermedios</li>
          <li>• Especifica la frecuencia para priorizar el monitoreo</li>
          <li>• Las rutas urgentes tendrán mayor prioridad en alertas</li>
        </ul>
      </div>
    </div>
  );
};
