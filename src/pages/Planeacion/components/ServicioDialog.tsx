import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Servicio, ServicioForm } from '@/types/planeacion';
import { useClientes } from '@/hooks/usePlaneacion';

const servicioSchema = z.object({
  cliente_id: z.string().min(1, 'Cliente es requerido'),
  id_interno_cliente: z.string().max(50, 'Máximo 50 caracteres').optional(),
  fecha_programada: z.string().min(1, 'Fecha es requerida'),
  hora_ventana_inicio: z.string().min(1, 'Hora inicio es requerida'),
  hora_ventana_fin: z.string().min(1, 'Hora fin es requerida'),
  origen_lat: z.number().optional(),
  origen_lng: z.number().optional(),
  origen_texto: z.string().min(1, 'Origen es requerido'),
  destino_lat: z.number().optional(),
  destino_lng: z.number().optional(),
  destino_texto: z.string().min(1, 'Destino es requerido'),
  tipo_servicio: z.enum(['traslado', 'custodia_local', 'escolta', 'vigilancia']),
  requiere_gadgets: z.boolean().default(false),
  notas_especiales: z.string().optional(),
  prioridad: z.number().min(1).default(1),
  valor_estimado: z.number().min(0).optional(),
});

interface ServicioDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicio?: Servicio | null;
  onSubmit: (data: ServicioForm) => Promise<void>;
  loading?: boolean;
}

export default function ServicioDialog({
  open,
  onOpenChange,
  servicio,
  onSubmit,
  loading = false,
}: ServicioDialogProps) {
  const { data: clientes = [] } = useClientes();

  const form = useForm<ServicioForm>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      cliente_id: '',
      fecha_programada: '',
      hora_ventana_inicio: '09:00',
      hora_ventana_fin: '17:00',
      origen_texto: '',
      destino_texto: '',
      tipo_servicio: 'traslado',
      requiere_gadgets: false,
      notas_especiales: '',
      prioridad: 1,
      valor_estimado: 0,
    },
  });

  useEffect(() => {
    if (servicio) {
      form.reset({
        cliente_id: servicio.cliente_id,
        fecha_programada: servicio.fecha_programada,
        hora_ventana_inicio: servicio.hora_ventana_inicio,
        hora_ventana_fin: servicio.hora_ventana_fin,
        origen_lat: servicio.origen_lat,
        origen_lng: servicio.origen_lng,
        origen_texto: servicio.origen_texto,
        destino_lat: servicio.destino_lat,
        destino_lng: servicio.destino_lng,
        destino_texto: servicio.destino_texto,
        tipo_servicio: servicio.tipo_servicio,
        requiere_gadgets: servicio.requiere_gadgets,
        notas_especiales: servicio.notas_especiales || '',
        prioridad: servicio.prioridad,
        valor_estimado: servicio.valor_estimado,
      });
    } else {
      form.reset();
    }
  }, [servicio, form]);

  const handleSubmit = async (data: ServicioForm) => {
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {servicio ? 'Editar Servicio' : 'Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription>
            {servicio 
              ? 'Modifica los datos del servicio de custodia'
              : 'Crea un nuevo servicio de custodia'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              {/* Cliente */}
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar cliente" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {clientes.map((cliente) => (
                          <SelectItem key={cliente.id} value={cliente.id}>
                            {cliente.nombre}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ID Interno del Cliente */}
              <FormField
                control={form.control}
                name="id_interno_cliente"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ID Interno del Cliente (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="Ej: CLI-2024-001, REF-ABC123"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Tipo de Servicio */}
              <FormField
                control={form.control}
                name="tipo_servicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="traslado">Traslado</SelectItem>
                        <SelectItem value="custodia_local">Custodia Local</SelectItem>
                        <SelectItem value="escolta">Escolta</SelectItem>
                        <SelectItem value="vigilancia">Vigilancia</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              {/* Fecha */}
              <FormField
                control={form.control}
                name="fecha_programada"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fecha Programada</FormLabel>
                    <FormControl>
                      <Input type="date" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hora Inicio */}
              <FormField
                control={form.control}
                name="hora_ventana_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Inicio</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Hora Fin */}
              <FormField
                control={form.control}
                name="hora_ventana_fin"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Hora Fin</FormLabel>
                    <FormControl>
                      <Input type="time" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Origen */}
            <FormField
              control={form.control}
              name="origen_texto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Origen</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección de origen" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Destino */}
            <FormField
              control={form.control}
              name="destino_texto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destino</FormLabel>
                  <FormControl>
                    <Input placeholder="Dirección de destino" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              {/* Prioridad */}
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad (1-5)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1"
                        max="5"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Valor Estimado */}
              <FormField
                control={form.control}
                name="valor_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        step="0.01"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Requiere Gadgets */}
            <FormField
              control={form.control}
              name="requiere_gadgets"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">Requiere Gadgets</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      El servicio requiere equipamiento especial
                    </div>
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

            {/* Notas Especiales */}
            <FormField
              control={form.control}
              name="notas_especiales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Especiales</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Instrucciones adicionales para el servicio..."
                      className="min-h-[100px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (servicio ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}