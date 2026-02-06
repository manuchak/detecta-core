import React, { useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useInstaladorData } from '@/hooks/useInstaladorData';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftIndicator';

const schema = z.object({
  nombre_completo: z.string().min(1, 'Nombre completo es requerido'),
  telefono: z.string().min(10, 'Teléfono debe tener al menos 10 dígitos'),
  email: z.string().email('Email inválido'),
  cedula_profesional: z.string().optional(),
  especialidades: z.string().min(1, 'Debe especificar al menos una especialidad'),
  vehiculo_propio: z.boolean().optional(),
  banco: z.string().optional(),
  cuenta: z.string().optional(),
  clabe: z.string().optional(),
  titular: z.string().optional()
});

type FormData = z.infer<typeof schema>;

const defaultValues: FormData = {
  nombre_completo: '',
  telefono: '',
  email: '',
  cedula_profesional: '',
  especialidades: '',
  vehiculo_propio: false,
  banco: '',
  cuenta: '',
  clabe: '',
  titular: ''
};

interface RegistroInstaladorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const RegistroInstaladorDialog: React.FC<RegistroInstaladorDialogProps> = ({
  open,
  onOpenChange
}) => {
  const { createInstalador } = useInstaladorData();

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch, getValues } = form;

  // Persistence hook
  const persistence = useFormPersistence<FormData>({
    key: 'registro_instalador_dialog',
    initialData: defaultValues,
    level: 'standard',
    form,
    isMeaningful: (data) => !!(data.nombre_completo?.trim() || data.telefono?.trim() || data.email?.trim()),
    ttl: 4 * 60 * 60 * 1000, // 4 hours
  });

  const vehiculoPropio = watch('vehiculo_propio');

  const onSubmit = async (data: FormData) => {
    try {
      const formData = getValues();
      const especialidadesArray = formData.especialidades.split(',').map(esp => esp.trim());
      
      const bancoData = formData.banco ? {
        banco: formData.banco,
        cuenta: formData.cuenta,
        clabe: formData.clabe,
        titular: formData.titular
      } : undefined;

      await createInstalador({
        nombre_completo: formData.nombre_completo,
        telefono: formData.telefono,
        email: formData.email,
        cedula_profesional: formData.cedula_profesional,
        especialidades: especialidadesArray,
        vehiculo_propio: formData.vehiculo_propio,
        banco_datos: bancoData
      });
      
      persistence.clearDraft(true);
      reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error creating installer:', error);
    }
  };

  const handleClose = useCallback(async () => {
    if (persistence.hasUnsavedChanges) {
      const discard = await persistence.confirmDiscard();
      if (!discard) return;
    }
    onOpenChange(false);
  }, [persistence, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>Registrar Nuevo Instalador</DialogTitle>
            <DraftIndicator
              hasDraft={persistence.hasDraft}
              hasUnsavedChanges={persistence.hasUnsavedChanges}
              lastSaved={persistence.lastSaved}
              getTimeSinceSave={persistence.getTimeSinceSave}
              variant="minimal"
            />
          </div>
          <DialogDescription>
            Complete la información para registrar un nuevo instalador certificado
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Información básica */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Información Personal</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre_completo">Nombre Completo *</Label>
                <Input
                  {...register('nombre_completo')}
                  placeholder="Nombre completo del instalador"
                />
                {errors.nombre_completo && (
                  <p className="text-sm text-destructive">{errors.nombre_completo.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="cedula_profesional">Cédula Profesional</Label>
                <Input
                  {...register('cedula_profesional')}
                  placeholder="Número de cédula profesional"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  {...register('telefono')}
                  placeholder="Número de teléfono"
                />
                {errors.telefono && (
                  <p className="text-sm text-destructive">{errors.telefono.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email *</Label>
                <Input
                  {...register('email')}
                  type="email"
                  placeholder="Correo electrónico"
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Especialidades */}
          <div className="space-y-2">
            <Label htmlFor="especialidades">Especialidades *</Label>
            <Textarea
              {...register('especialidades')}
              placeholder="GPS Vehicular, GPS Personal, Alarmas, Cámaras (separadas por comas)"
            />
            {errors.especialidades && (
              <p className="text-sm text-destructive">{errors.especialidades.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Ingrese las especialidades separadas por comas
            </p>
          </div>

          {/* Vehículo */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="vehiculo_propio"
                checked={vehiculoPropio}
                onCheckedChange={(checked) => setValue('vehiculo_propio', checked)}
              />
              <Label htmlFor="vehiculo_propio">Cuenta con vehículo propio</Label>
            </div>
          </div>

          {/* Datos bancarios */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Datos Bancarios (Opcional)</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="banco">Banco</Label>
                <Input
                  {...register('banco')}
                  placeholder="Nombre del banco"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="cuenta">Número de Cuenta</Label>
                <Input
                  {...register('cuenta')}
                  placeholder="Número de cuenta"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clabe">CLABE</Label>
                <Input
                  {...register('clabe')}
                  placeholder="CLABE interbancaria"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="titular">Titular</Label>
                <Input
                  {...register('titular')}
                  placeholder="Nombre del titular"
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Registrando...' : 'Registrar Instalador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
