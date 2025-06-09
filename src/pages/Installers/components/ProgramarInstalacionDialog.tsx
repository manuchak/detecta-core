
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useServiciosMonitoreo } from '@/hooks/useServiciosMonitoreo';
import type { CreateProgramacionData } from '@/types/instaladores';

interface ProgramarInstalacionDialogProps {
  children: React.ReactNode;
}

export const ProgramarInstalacionDialog: React.FC<ProgramarInstalacionDialogProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const { createProgramacion } = useProgramacionInstalaciones();
  const { servicios } = useServiciosMonitoreo();
  
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateProgramacionData>();

  const onSubmit = (data: CreateProgramacionData) => {
    createProgramacion.mutate(data, {
      onSuccess: () => {
        setOpen(false);
        reset();
      }
    });
  };

  const serviciosMonitoreo = servicios?.filter(s => s.tipo_servicio !== 'personal') || [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programar Nueva Instalación</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Servicio */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="servicio_id">Servicio de Monitoreo *</Label>
              <Select onValueChange={(value) => setValue('servicio_id', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {serviciosMonitoreo.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.numero_servicio} - {servicio.nombre_cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="tipo_instalacion">Tipo de Instalación *</Label>
              <Select onValueChange={(value) => setValue('tipo_instalacion', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Tipo de instalación" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gps_vehicular">GPS Vehicular</SelectItem>
                  <SelectItem value="gps_personal">GPS Personal</SelectItem>
                  <SelectItem value="camara">Cámara</SelectItem>
                  <SelectItem value="alarma">Alarma</SelectItem>
                  <SelectItem value="combo">Combo (GPS + Cámara)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Fecha y prioridad */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="fecha_programada">Fecha y Hora *</Label>
              <Input
                type="datetime-local"
                {...register('fecha_programada', { required: true })}
              />
            </div>

            <div>
              <Label htmlFor="prioridad">Prioridad</Label>
              <Select onValueChange={(value) => setValue('prioridad', value as any)}>
                <SelectTrigger>
                  <SelectValue placeholder="Normal" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Dirección */}
          <div>
            <Label htmlFor="direccion_instalacion">Dirección de Instalación *</Label>
            <Textarea
              {...register('direccion_instalacion', { required: true })}
              placeholder="Dirección completa donde se realizará la instalación"
            />
          </div>

          {/* Contacto */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="contacto_cliente">Nombre del Contacto *</Label>
              <Input
                {...register('contacto_cliente', { required: true })}
                placeholder="Nombre de la persona de contacto"
              />
            </div>

            <div>
              <Label htmlFor="telefono_contacto">Teléfono de Contacto *</Label>
              <Input
                {...register('telefono_contacto', { required: true })}
                placeholder="Teléfono de contacto"
              />
            </div>
          </div>

          {/* Tiempo estimado */}
          <div>
            <Label htmlFor="tiempo_estimado">Tiempo Estimado (minutos)</Label>
            <Input
              type="number"
              {...register('tiempo_estimado')}
              placeholder="120"
              defaultValue="120"
            />
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="observaciones_cliente">Observaciones del Cliente</Label>
            <Textarea
              {...register('observaciones_cliente')}
              placeholder="Observaciones especiales del cliente"
            />
          </div>

          {/* Instrucciones especiales */}
          <div>
            <Label htmlFor="instrucciones_especiales">Instrucciones Especiales</Label>
            <Textarea
              {...register('instrucciones_especiales')}
              placeholder="Instrucciones específicas para el instalador"
            />
          </div>

          {/* Switches para condiciones especiales */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label htmlFor="requiere_vehiculo_elevado">Requiere Vehículo Elevado</Label>
              <Switch
                onCheckedChange={(checked) => setValue('requiere_vehiculo_elevado', checked)}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="acceso_restringido">Acceso Restringido</Label>
              <Switch
                onCheckedChange={(checked) => setValue('acceso_restringido', checked)}
              />
            </div>
          </div>

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createProgramacion.isPending}>
              {createProgramacion.isPending ? 'Programando...' : 'Programar Instalación'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
