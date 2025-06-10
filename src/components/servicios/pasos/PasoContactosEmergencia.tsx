
import { UseFormReturn, useFieldArray } from 'react-hook-form';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Phone, Users } from 'lucide-react';
import type { CreateServicioMonitoreoCompleto } from '@/types/serviciosMonitoreoCompleto';

interface PasoContactosEmergenciaProps {
  form: UseFormReturn<CreateServicioMonitoreoCompleto>;
}

export const PasoContactosEmergencia = ({ form }: PasoContactosEmergenciaProps) => {
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "contactos_emergencia"
  });

  const agregarContacto = () => {
    append({
      nombre: '',
      telefono: '',
      email: '',
      tipo_contacto: 'secundario',
      orden_prioridad: fields.length + 1
    });
  };

  const getTipoContactoBadge = (tipo: string) => {
    const variants = {
      principal: { variant: 'default' as const, label: 'Principal' },
      secundario: { variant: 'secondary' as const, label: 'Secundario' },
      emergencia: { variant: 'destructive' as const, label: 'Emergencia' }
    };
    
    const config = variants[tipo as keyof typeof variants] || variants.secundario;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Contactos de Emergencia
          </CardTitle>
          <p className="text-sm text-gray-600">
            Configure las personas que deben ser contactadas en caso de emergencia o alerta
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <Phone className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No hay contactos de emergencia configurados</p>
              <p className="text-sm">Agregue al menos un contacto principal</p>
            </div>
          )}

          {fields.map((field, index) => (
            <Card key={field.id} className="border-dashed">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">
                    Contacto {index + 1}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {getTipoContactoBadge(form.watch(`contactos_emergencia.${index}.tipo_contacto`))}
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => remove(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`contactos_emergencia.${index}.nombre`}
                    rules={{ required: "El nombre es requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre Completo *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Nombre del contacto" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`contactos_emergencia.${index}.telefono`}
                    rules={{ required: "El teléfono es requerido" }}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teléfono *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+52 55 1234 5678" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name={`contactos_emergencia.${index}.email`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input {...field} type="email" placeholder="contacto@email.com" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name={`contactos_emergencia.${index}.tipo_contacto`}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Contacto *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="principal">Principal</SelectItem>
                            <SelectItem value="secundario">Secundario</SelectItem>
                            <SelectItem value="emergencia">Emergencia</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name={`contactos_emergencia.${index}.orden_prioridad`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Orden de Prioridad</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          type="number" 
                          min="1"
                          onChange={e => field.onChange(parseInt(e.target.value) || 1)}
                          placeholder="1" 
                        />
                      </FormControl>
                      <p className="text-xs text-gray-600">
                        1 = Mayor prioridad (se contacta primero)
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>
          ))}

          <Button
            type="button"
            variant="outline"
            onClick={agregarContacto}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Contacto de Emergencia
          </Button>
        </CardContent>
      </Card>

      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-medium text-blue-900 mb-2">Tipos de Contacto</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• <strong>Principal:</strong> Primera persona a contactar en cualquier tipo de alerta</li>
          <li>• <strong>Secundario:</strong> Contacto alternativo si no se puede alcanzar al principal</li>
          <li>• <strong>Emergencia:</strong> Solo para situaciones críticas (robos, accidentes graves)</li>
        </ul>
      </div>
    </div>
  );
};
