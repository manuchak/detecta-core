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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Cliente, ClienteForm } from '@/types/planeacion';

const clienteSchema = z.object({
  nombre: z.string().min(1, 'El nombre es requerido'),
  rfc: z.string().optional(),
  contacto_nombre: z.string().min(1, 'El nombre del contacto es requerido'),
  contacto_tel: z.string().min(1, 'El teléfono es requerido'),
  contacto_email: z.string().email('Email inválido').optional().or(z.literal('')),
  sla_minutos_asignacion: z.number().min(1, 'SLA debe ser mayor a 0'),
  notas: z.string().optional(),
});

interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSubmit: (data: ClienteForm) => Promise<void>;
  loading?: boolean;
}

export default function ClienteDialog({
  open,
  onOpenChange,
  cliente,
  onSubmit,
  loading = false,
}: ClienteDialogProps) {
  const isEditing = !!cliente;

  const form = useForm<z.infer<typeof clienteSchema>>({
    resolver: zodResolver(clienteSchema),
    defaultValues: {
      nombre: '',
      rfc: '',
      contacto_nombre: '',
      contacto_tel: '',
      contacto_email: '',
      sla_minutos_asignacion: 60,
      notas: '',
    },
  });

  useEffect(() => {
    if (cliente) {
      form.reset({
        nombre: cliente.nombre,
        rfc: cliente.rfc || '',
        contacto_nombre: cliente.contacto_nombre,
        contacto_tel: cliente.contacto_tel,
        contacto_email: cliente.contacto_email || '',
        sla_minutos_asignacion: cliente.sla_minutos_asignacion,
        notas: cliente.notas || '',
      });
    } else {
      form.reset({
        nombre: '',
        rfc: '',
        contacto_nombre: '',
        contacto_tel: '',
        contacto_email: '',
        sla_minutos_asignacion: 60,
        notas: '',
      });
    }
  }, [cliente, form]);

  const handleSubmit = async (values: z.infer<typeof clienteSchema>) => {
    const data: ClienteForm = {
      ...values,
      contacto_email: values.contacto_email || undefined,
      rfc: values.rfc || undefined,
      notas: values.notas || undefined,
    };
    
    await onSubmit(data);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Modifica la información del cliente'
              : 'Ingresa los datos del nuevo cliente'
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre de la Empresa</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Empresa SA de CV" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rfc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RFC (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. EMP123456ABC" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contacto_nombre"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre del Contacto</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="contacto_tel"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej. +52 55 1234 5678" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contacto_email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email (Opcional)</FormLabel>
                    <FormControl>
                      <Input 
                        type="email" 
                        placeholder="Ej. contacto@empresa.com" 
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="sla_minutos_asignacion"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SLA Asignación (minutos)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        placeholder="60" 
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      Tiempo máximo para asignar un custodio
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notas (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Información adicional sobre el cliente..."
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