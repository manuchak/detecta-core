import { useEffect, useCallback } from 'react';
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
import { Cliente, ClienteForm } from '@/types/planeacion';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

const clienteSchema = z.object({
  nombre: z.string().min(1, 'Nombre de la empresa es requerido'),
  rfc: z.string().optional(),
  contacto_nombre: z.string().min(1, 'Nombre del contacto es requerido'),
  contacto_tel: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  contacto_email: z.string().email('Email inválido').optional().or(z.literal('')),
  sla_minutos_asignacion: z.coerce.number().min(1, 'El SLA debe ser mayor a 0'),
  notas: z.string().optional(),
});

type ClienteFormValues = z.infer<typeof clienteSchema>;

interface ClienteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cliente?: Cliente | null;
  onSubmit: (data: ClienteForm) => Promise<void>;
  loading?: boolean;
}

const defaultValues: ClienteFormValues = {
  nombre: '',
  rfc: '',
  contacto_nombre: '',
  contacto_tel: '',
  contacto_email: '',
  sla_minutos_asignacion: 60,
  notas: '',
};

export default function ClienteDialog({
  open,
  onOpenChange,
  cliente,
  onSubmit,
  loading = false,
}: ClienteDialogProps) {
  const isEditing = !!cliente;

  const form = useForm<ClienteFormValues>({
    resolver: zodResolver(clienteSchema),
    defaultValues,
  });

  // Persistence - only for new clients (not editing)
  const persistence = useFormPersistence<ClienteFormValues>({
    key: 'cliente-dialog-draft',
    initialData: defaultValues,
    level: 'light',
    form: !isEditing ? form : undefined, // Only sync when creating new
    isMeaningful: (data) => !!(data.nombre?.trim() || data.contacto_nombre?.trim()),
    ttl: 2 * 60 * 60 * 1000, // 2 hours for dialogs
  });

  // Load existing cliente data when editing
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
    } else if (!persistence.hasDraft) {
      // Only reset if no draft exists
      form.reset(defaultValues);
    }
  }, [cliente, form, persistence.hasDraft]);

  // Handle dialog close with confirmation
  const handleOpenChange = useCallback(async (newOpen: boolean) => {
    if (!newOpen && !isEditing) {
      // Check if we should confirm before closing
      const shouldClose = await persistence.confirmDiscard();
      if (!shouldClose) return;
    }
    onOpenChange(newOpen);
  }, [onOpenChange, persistence, isEditing]);

  const handleSubmit = async (values: ClienteFormValues) => {
    const data: ClienteForm = {
      nombre: values.nombre,
      contacto_nombre: values.contacto_nombre,
      contacto_tel: values.contacto_tel,
      sla_minutos_asignacion: values.sla_minutos_asignacion,
      contacto_email: values.contacto_email || undefined,
      rfc: values.rfc || undefined,
      notas: values.notas || undefined,
    };
    
    await onSubmit(data);
    
    // Clear draft after successful submit
    if (!isEditing) {
      persistence.clearDraft(true);
    }
    form.reset(defaultValues);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>
              {isEditing ? 'Editar Cliente' : 'Nuevo Cliente'}
            </DialogTitle>
            {!isEditing && (
              <DraftIndicator
                hasDraft={persistence.hasDraft}
                hasUnsavedChanges={persistence.hasUnsavedChanges}
                lastSaved={persistence.lastSaved}
                getTimeSinceSave={persistence.getTimeSinceSave}
                variant="minimal"
              />
            )}
          </div>
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
                    <FormLabel>SLA de Asignación (minutos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="1"
                        placeholder="60"
                        {...field}
                      />
                    </FormControl>
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
                      className="min-h-[80px]"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => handleOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
