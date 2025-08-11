import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { useClientes } from '@/hooks/usePlaneacion';
import { Servicio, ServicioForm } from '@/types/planeacion';

const servicioSchema = z.object({
  cliente_id: z.string().min(1, 'Debe seleccionar un cliente'),
  fecha_programada: z.date({ required_error: 'La fecha es requerida' }),
  hora_ventana_inicio: z.string().min(1, 'La hora de inicio es requerida'),
  hora_ventana_fin: z.string().min(1, 'La hora de fin es requerida'),
  origen_texto: z.string().min(1, 'El origen es requerido'),
  origen_lat: z.number().optional(),
  origen_lng: z.number().optional(),
  destino_texto: z.string().min(1, 'El destino es requerido'),
  destino_lat: z.number().optional(),
  destino_lng: z.number().optional(),
  tipo_servicio: z.enum(['traslado', 'custodia_local', 'escolta', 'vigilancia']),
  requiere_gadgets: z.boolean(),
  notas_especiales: z.string().optional(),
  prioridad: z.number().min(1).max(10),
  valor_estimado: z.number().optional(),
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
  const isEditing = !!servicio;
  const { data: clientes = [] } = useClientes();

  const form = useForm<z.infer<typeof servicioSchema>>({
    resolver: zodResolver(servicioSchema),
    defaultValues: {
      cliente_id: '',
      fecha_programada: new Date(),
      hora_ventana_inicio: '09:00',
      hora_ventana_fin: '17:00',
      origen_texto: '',
      origen_lat: undefined,
      origen_lng: undefined,
      destino_texto: '',
      destino_lat: undefined,
      destino_lng: undefined,
      tipo_servicio: 'traslado',
      requiere_gadgets: false,
      notas_especiales: '',
      prioridad: 5,
      valor_estimado: undefined,
    },
  });

  useEffect(() => {
    if (servicio) {
      form.reset({
        cliente_id: servicio.cliente_id,
        fecha_programada: new Date(servicio.fecha_programada),
        hora_ventana_inicio: servicio.hora_ventana_inicio,
        hora_ventana_fin: servicio.hora_ventana_fin,
        origen_texto: servicio.origen_texto,
        origen_lat: servicio.origen_lat,
        origen_lng: servicio.origen_lng,
        destino_texto: servicio.destino_texto,
        destino_lat: servicio.destino_lat,
        destino_lng: servicio.destino_lng,
        tipo_servicio: servicio.tipo_servicio,
        requiere_gadgets: servicio.requiere_gadgets,
        notas_especiales: servicio.notas_especiales || '',
        prioridad: servicio.prioridad,
        valor_estimado: servicio.valor_estimado,
      });
    } else {
      form.reset({
        cliente_id: '',
        fecha_programada: new Date(),
        hora_ventana_inicio: '09:00',
        hora_ventana_fin: '17:00',
        origen_texto: '',
        origen_lat: undefined,
        origen_lng: undefined,
        destino_texto: '',
        destino_lat: undefined,
        destino_lng: undefined,
        tipo_servicio: 'traslado',
        requiere_gadgets: false,
        notas_especiales: '',
        prioridad: 5,
        valor_estimado: undefined,
      });
    }
  }, [servicio, form]);

  const handleSubmit = async (values: z.infer<typeof servicioSchema>) => {
    const data: ServicioForm = {
      ...values,
      fecha_programada: format(values.fecha_programada, 'yyyy-MM-dd'),
      notas_especiales: values.notas_especiales || undefined,
    };
    
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Servicio' : 'Nuevo Servicio'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del servicio'
              : 'Ingresa los datos del nuevo servicio de custodia'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cliente_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cliente</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona un cliente" />
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

              <FormField
                control={form.control}
                name="tipo_servicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo de Servicio</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona el tipo" />
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
                            variant={"outline"}
                            className={cn(
                              "w-full pl-3 text-left font-normal",
                              !field.value && "text-muted-foreground"
                            )}
                          >
                            {field.value ? (
                              format(field.value, "dd/MM/yyyy")
                            ) : (
                              <span>Selecciona fecha</span>
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
                          disabled={(date) =>
                            date < new Date(new Date().setHours(0, 0, 0, 0))
                          }
                          initialFocus
                          className="pointer-events-auto"
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />

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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="origen_texto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Origen</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Polanco, CDMX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="destino_texto"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Destino</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Santa Fe, CDMX" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="prioridad"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prioridad (1-10)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="1" 
                        max="10" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      1 = Baja, 10 = Crítica
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor_estimado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor Estimado (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="requiere_gadgets"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                    <div className="space-y-0.5">
                      <FormLabel>Requiere Gadgets</FormLabel>
                      <FormDescription className="text-xs">
                        Equipamiento tecnológico
                      </FormDescription>
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
            </div>

            <FormField
              control={form.control}
              name="notas_especiales"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas Especiales (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Instrucciones especiales, contactos adicionales, etc..."
                      rows={3}
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : isEditing ? 'Actualizar' : 'Crear'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}