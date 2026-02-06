import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { CalendarIcon, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useRecepciones } from '@/hooks/useRecepciones';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { cn } from '@/lib/utils';
import type { OrdenCompra } from '@/types/wms';

const recepcionSchema = z.object({
  orden_compra_id: z.string().optional(),
  proveedor_id: z.string().min(1, 'Selecciona un proveedor'),
  fecha_programada: z.date().optional(),
  observaciones: z.string().optional(),
});

type RecepcionFormData = z.infer<typeof recepcionSchema>;

interface RecepcionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ordenes: OrdenCompra[];
}

export const RecepcionDialog = ({ open, onOpenChange, ordenes }: RecepcionDialogProps) => {
  const [selectedOrden, setSelectedOrden] = useState<OrdenCompra | null>(null);
  const { crearRecepcion } = useRecepciones();

  // Standard persistence for form
  const persistence = useFormPersistence<Partial<RecepcionFormData>>({
    key: 'wms_recepcion_dialog',
    initialData: {},
    level: 'standard',
    isMeaningful: (data) => !!(data.proveedor_id || data.observaciones),
  });

  const form = useForm<RecepcionFormData>({
    resolver: zodResolver(recepcionSchema),
    defaultValues: {
      observaciones: '',
    },
  });

  // Sync to persistence
  useEffect(() => {
    const subscription = form.watch((values) => {
      persistence.updateData(values as Partial<RecepcionFormData>);
    });
    return () => subscription.unsubscribe();
  }, [form, persistence.updateData]);

  const onSubmit = async (data: RecepcionFormData) => {
    try {
      const recepcionData = {
        ...data,
        fecha_programada: data.fecha_programada?.toISOString(),
        total_esperado: selectedOrden?.total || 0,
        total_recibido: 0,
        estado: 'pendiente' as const,
      };

      await crearRecepcion.mutateAsync(recepcionData);
      persistence.clearDraft(true);
      form.reset();
      setSelectedOrden(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error al crear recepción:', error);
    }
  };

  const handleOrdenChange = (ordenId: string) => {
    const orden = ordenes.find(o => o.id === ordenId);
    setSelectedOrden(orden || null);
    
    if (orden) {
      form.setValue('proveedor_id', orden.proveedor_id);
      form.setValue('orden_compra_id', orden.id);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Nueva Recepción de Mercancía
          </DialogTitle>
          <DialogDescription>
            Registra una nueva recepción de mercancía. Puedes crear una recepción desde una orden de compra existente.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Orden de Compra */}
              <FormField
                control={form.control}
                name="orden_compra_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Orden de Compra (Opcional)</FormLabel>
                    <Select 
                      value={field.value} 
                      onValueChange={(value) => {
                        field.onChange(value);
                        handleOrdenChange(value);
                      }}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar orden de compra" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {ordenes.map((orden) => (
                          <SelectItem key={orden.id} value={orden.id}>
                            {orden.numero_orden} - {orden.proveedor?.nombre} - ${orden.total?.toLocaleString()}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Proveedor */}
              <FormField
                control={form.control}
                name="proveedor_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Proveedor *</FormLabel>
                    <FormControl>
                      <Input 
                        {...field} 
                        value={selectedOrden?.proveedor?.nombre || field.value}
                        placeholder="ID del proveedor o selecciona una orden"
                        disabled={!!selectedOrden}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Fecha Programada */}
              <FormField
                control={form.control}
                name="fecha_programada"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Fecha Programada</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "PPP", { locale: es })
                            ) : (
                              <span>Seleccionar fecha</span>
                            )}
                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          disabled={(date) => date < new Date()}
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Observaciones */}
              <FormField
                control={form.control}
                name="observaciones"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observaciones</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field} 
                        placeholder="Observaciones adicionales sobre la recepción..."
                        rows={3}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resumen de orden seleccionada */}
            {selectedOrden && (
              <div className="bg-muted p-4 rounded-lg space-y-2">
                <h4 className="font-medium">Resumen de Orden de Compra</h4>
                <div className="text-sm space-y-1">
                  <p><span className="font-medium">Número:</span> {selectedOrden.numero_orden}</p>
                  <p><span className="font-medium">Proveedor:</span> {selectedOrden.proveedor?.nombre}</p>
                  <p><span className="font-medium">Total:</span> ${selectedOrden.total?.toLocaleString()}</p>
                  <p><span className="font-medium">Productos:</span> {selectedOrden.detalles?.length || 0} items</p>
                </div>
              </div>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={crearRecepcion.isPending}>
                {crearRecepcion.isPending ? 'Creando...' : 'Crear Recepción'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};