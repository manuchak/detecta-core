import React, { useState } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Smartphone,
  AlertCircle
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { 
  useComodatosGPS, 
  useProductosGPSDisponibles, 
  useCustodiosOperativosActivos 
} from '@/hooks/useComodatosGPS';
import type { ComodatoGPSForm } from '@/types/comodatos';

const asignarGPSSchema = z.object({
  producto_gps_id: z.string().min(1, 'Selecciona un producto GPS'),
  numero_serie_gps: z.string().min(1, 'Ingresa el número de serie'),
  custodio_tipo: z.enum(['planeacion', 'operativo'], {
    required_error: 'Selecciona el tipo de custodio'
  }),
  pc_custodio_id: z.string().optional(),
  custodio_operativo_nombre: z.string().optional(),
  custodio_operativo_telefono: z.string().optional(),
  fecha_devolucion_programada: z.string().min(1, 'Selecciona la fecha de devolución'),
  observaciones: z.string().optional(),
  condiciones_asignacion: z.string().optional()
}).refine((data) => {
  if (data.custodio_tipo === 'planeacion') {
    return !!data.pc_custodio_id;
  } else {
    return !!data.custodio_operativo_nombre && !!data.custodio_operativo_telefono;
  }
}, {
  message: 'Completa la información del custodio',
  path: ['custodio_tipo']
});

interface AsignarGPSDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const AsignarGPSDialog: React.FC<AsignarGPSDialogProps> = ({
  open,
  onOpenChange
}) => {
  const [busquedaCustodio, setBusquedaCustodio] = useState('');
  
  const { createComodato } = useComodatosGPS();
  const { data: productosGPS = [], isLoading: loadingProductos } = useProductosGPSDisponibles();
  const { data: custodiosOperativos = [], isLoading: loadingCustodios } = useCustodiosOperativosActivos();

  // Query para custodios de planeación
  const { data: custodiosPlaneacion = [] } = useQuery({
    queryKey: ['pc-custodios'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('pc_custodios')
        .select('id, nombre, email, tel, disponibilidad')
        .eq('disponibilidad', 'disponible')
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    }
  });

  const form = useForm<ComodatoGPSForm>({
    resolver: zodResolver(asignarGPSSchema),
    defaultValues: {
      custodio_tipo: 'planeacion',
      fecha_devolucion_programada: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0] // 30 días por defecto
    }
  });

  const custodioTipo = form.watch('custodio_tipo');
  const productoSeleccionado = form.watch('producto_gps_id');

  const onSubmit = async (data: ComodatoGPSForm) => {
    try {
      await createComodato.mutateAsync(data);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error al asignar GPS:', error);
    }
  };

  const custodiosOperativosFiltrados = custodiosOperativos.filter(custodio =>
    custodio.nombre_custodio.toLowerCase().includes(busquedaCustodio.toLowerCase())
  );

  const productoGPSSeleccionado = productosGPS.find(p => p.id === productoSeleccionado);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Asignar GPS en Comodato</DialogTitle>
          <DialogDescription>
            Selecciona un GPS disponible y asígnalo a un custodio activo
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Selección de GPS */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Smartphone className="h-5 w-5" />
                Seleccionar GPS
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="producto_gps_id">Producto GPS *</Label>
                <Select
                  value={form.watch('producto_gps_id')}
                  onValueChange={(value) => form.setValue('producto_gps_id', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un GPS disponible" />
                  </SelectTrigger>
                  <SelectContent>
                    {loadingProductos ? (
                      <SelectItem value="">Cargando productos...</SelectItem>
                    ) : productosGPS.length === 0 ? (
                      <SelectItem value="">No hay GPS disponibles</SelectItem>
                    ) : (
                      productosGPS.map((producto) => (
                        <SelectItem key={producto.id} value={producto.id}>
                          <div className="flex justify-between items-center w-full">
                            <span>{producto.nombre}</span>
                            <Badge variant="secondary">
                              Stock: {producto.cantidad_disponible}
                            </Badge>
                          </div>
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                {form.formState.errors.producto_gps_id && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.producto_gps_id.message}
                  </p>
                )}
              </div>

              {productoGPSSeleccionado && (
                <div className="bg-muted p-3 rounded-lg">
                  <h4 className="font-medium mb-2">Información del GPS</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Marca: {productoGPSSeleccionado.marca || 'N/A'}</div>
                    <div>Modelo: {productoGPSSeleccionado.modelo || 'N/A'}</div>
                    <div>Stock: {productoGPSSeleccionado.cantidad_disponible}</div>
                    <div>Precio: ${productoGPSSeleccionado.precio_venta_sugerido || 'N/A'}</div>
                  </div>
                </div>
              )}

              <div>
                <Label htmlFor="numero_serie_gps">Número de Serie *</Label>
                <Input
                  id="numero_serie_gps"
                  {...form.register('numero_serie_gps')}
                  placeholder="Ingresa el número de serie del GPS"
                />
                {form.formState.errors.numero_serie_gps && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.numero_serie_gps.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Selección de Custodio */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Seleccionar Custodio
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Tipo de Custodio *</Label>
                <RadioGroup
                  value={custodioTipo}
                  onValueChange={(value) => form.setValue('custodio_tipo', value as 'planeacion' | 'operativo')}
                  className="flex gap-6 mt-2"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="planeacion" id="planeacion" />
                    <Label htmlFor="planeacion">Custodio de Planeación</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="operativo" id="operativo" />
                    <Label htmlFor="operativo">Custodio Operativo</Label>
                  </div>
                </RadioGroup>
              </div>

              {custodioTipo === 'planeacion' ? (
                <div>
                  <Label htmlFor="pc_custodio_id">Custodio de Planeación *</Label>
                  <Select
                    value={form.watch('pc_custodio_id')}
                    onValueChange={(value) => form.setValue('pc_custodio_id', value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona un custodio" />
                    </SelectTrigger>
                    <SelectContent>
                      {custodiosPlaneacion.map((custodio) => (
                        <SelectItem key={custodio.id} value={custodio.id}>
                          <div>
                            <div className="font-medium">{custodio.nombre}</div>
                            <div className="text-sm text-muted-foreground">
                              {custodio.email} • {custodio.tel}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar custodio operativo..."
                      value={busquedaCustodio}
                      onChange={(e) => setBusquedaCustodio(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  {loadingCustodios ? (
                    <div className="text-center py-4">Cargando custodios...</div>
                  ) : custodiosOperativosFiltrados.length === 0 ? (
                    <div className="text-center py-4 text-muted-foreground">
                      No se encontraron custodios operativos
                    </div>
                  ) : (
                    <div className="max-h-48 overflow-y-auto space-y-2">
                      {custodiosOperativosFiltrados.map((custodio) => (
                        <Card 
                          key={`${custodio.nombre_custodio}-${custodio.telefono}`}
                          className={`cursor-pointer transition-colors ${
                            form.watch('custodio_operativo_nombre') === custodio.nombre_custodio
                              ? 'ring-2 ring-primary'
                              : 'hover:bg-muted'
                          }`}
                          onClick={() => {
                            form.setValue('custodio_operativo_nombre', custodio.nombre_custodio);
                            form.setValue('custodio_operativo_telefono', custodio.telefono || custodio.telefono_operador || '');
                          }}
                        >
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <div>
                                <div className="font-medium">{custodio.nombre_custodio}</div>
                                <div className="text-sm text-muted-foreground flex items-center gap-2">
                                  <Phone className="h-3 w-3" />
                                  {custodio.telefono || custodio.telefono_operador || 'Sin teléfono'}
                                </div>
                              </div>
                              <div className="text-right text-sm">
                                <div>{custodio.total_servicios} servicios</div>
                                <div className="text-muted-foreground">
                                  {custodio.servicios_completados} completados
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Configuración de Fechas y Condiciones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Configuración del Comodato
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="fecha_devolucion_programada">Fecha de Devolución Programada *</Label>
                <Input
                  id="fecha_devolucion_programada"
                  type="date"
                  {...form.register('fecha_devolucion_programada')}
                />
                {form.formState.errors.fecha_devolucion_programada && (
                  <p className="text-sm text-destructive mt-1">
                    {form.formState.errors.fecha_devolucion_programada.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="condiciones_asignacion">Condiciones de Asignación</Label>
                <Textarea
                  id="condiciones_asignacion"
                  {...form.register('condiciones_asignacion')}
                  placeholder="Especifica las condiciones de uso y cuidado del GPS..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="observaciones">Observaciones</Label>
                <Textarea
                  id="observaciones"
                  {...form.register('observaciones')}
                  placeholder="Observaciones adicionales sobre la asignación..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Resumen */}
          {productoGPSSeleccionado && (form.watch('pc_custodio_id') || form.watch('custodio_operativo_nombre')) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5" />
                  Resumen de Asignación
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span>GPS:</span>
                  <span className="font-medium">{productoGPSSeleccionado.nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span>Serie:</span>
                  <span className="font-medium">{form.watch('numero_serie_gps')}</span>
                </div>
                <div className="flex justify-between">
                  <span>Custodio:</span>
                  <span className="font-medium">
                    {custodioTipo === 'planeacion' 
                      ? custodiosPlaneacion.find(c => c.id === form.watch('pc_custodio_id'))?.nombre
                      : form.watch('custodio_operativo_nombre')
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Devolución:</span>
                  <span className="font-medium">{form.watch('fecha_devolucion_programada')}</span>
                </div>
              </CardContent>
            </Card>
          )}

          <Separator />

          {/* Botones de acción */}
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createComodato.isPending}
            >
              {createComodato.isPending ? 'Asignando...' : 'Asignar GPS'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};