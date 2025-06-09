
import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { X } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { useInstaladores } from '@/hooks/useInstaladores';
import type { CreateInstaladorData } from '@/types/instaladores';

interface RegistroInstaladorDialogProps {
  children: React.ReactNode;
}

export const RegistroInstaladorDialog: React.FC<RegistroInstaladorDialogProps> = ({ children }) => {
  const [open, setOpen] = React.useState(false);
  const [especialidades, setEspecialidades] = React.useState<string[]>([]);
  const [certificaciones, setCertificaciones] = React.useState<string[]>([]);
  const [nuevaEspecialidad, setNuevaEspecialidad] = React.useState('');
  const [nuevaCertificacion, setNuevaCertificacion] = React.useState('');
  
  const { createInstalador } = useInstaladores();
  const { register, handleSubmit, reset, setValue, watch } = useForm<CreateInstaladorData>();

  const vehiculoPropio = watch('vehiculo_propio');

  const especialidadesDisponibles = [
    'gps_vehicular',
    'gps_personal', 
    'camara',
    'alarma',
    'combo'
  ];

  const agregarEspecialidad = (especialidad: string) => {
    if (especialidad && !especialidades.includes(especialidad)) {
      const nuevasEsp = [...especialidades, especialidad];
      setEspecialidades(nuevasEsp);
      setValue('especialidades', nuevasEsp);
      setNuevaEspecialidad('');
    }
  };

  const quitarEspecialidad = (especialidad: string) => {
    const nuevasEsp = especialidades.filter(e => e !== especialidad);
    setEspecialidades(nuevasEsp);
    setValue('especialidades', nuevasEsp);
  };

  const agregarCertificacion = () => {
    if (nuevaCertificacion && !certificaciones.includes(nuevaCertificacion)) {
      const nuevasCert = [...certificaciones, nuevaCertificacion];
      setCertificaciones(nuevasCert);
      setValue('certificaciones', nuevasCert);
      setNuevaCertificacion('');
    }
  };

  const quitarCertificacion = (certificacion: string) => {
    const nuevasCert = certificaciones.filter(c => c !== certificacion);
    setCertificaciones(nuevasCert);
    setValue('certificaciones', nuevasCert);
  };

  const onSubmit = (data: CreateInstaladorData) => {
    createInstalador.mutate({
      ...data,
      especialidades,
      certificaciones
    }, {
      onSuccess: () => {
        setOpen(false);
        reset();
        setEspecialidades([]);
        setCertificaciones([]);
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Registrar Nuevo Instalador</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Información básica */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nombre_completo">Nombre Completo *</Label>
              <Input
                {...register('nombre_completo', { required: true })}
                placeholder="Nombre completo del instalador"
              />
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono *</Label>
              <Input
                {...register('telefono', { required: true })}
                placeholder="Número de teléfono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                type="email"
                {...register('email', { required: true })}
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <Label htmlFor="cedula_profesional">Cédula Profesional</Label>
              <Input
                {...register('cedula_profesional')}
                placeholder="Número de cédula (opcional)"
              />
            </div>
          </div>

          {/* Especialidades */}
          <div>
            <Label>Especialidades</Label>
            <div className="flex gap-2 mb-2">
              {especialidadesDisponibles.map((esp) => (
                <Button
                  key={esp}
                  type="button"
                  size="sm"
                  variant={especialidades.includes(esp) ? "default" : "outline"}
                  onClick={() => especialidades.includes(esp) ? quitarEspecialidad(esp) : agregarEspecialidad(esp)}
                >
                  {esp.replace('_', ' ')}
                </Button>
              ))}
            </div>
            <div className="flex flex-wrap gap-1">
              {especialidades.map((esp) => (
                <Badge key={esp} className="flex items-center gap-1">
                  {esp.replace('_', ' ')}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => quitarEspecialidad(esp)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Certificaciones */}
          <div>
            <Label>Certificaciones</Label>
            <div className="flex gap-2 mb-2">
              <Input
                value={nuevaCertificacion}
                onChange={(e) => setNuevaCertificacion(e.target.value)}
                placeholder="Nombre de la certificación"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), agregarCertificacion())}
              />
              <Button type="button" onClick={agregarCertificacion}>
                Agregar
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {certificaciones.map((cert) => (
                <Badge key={cert} variant="outline" className="flex items-center gap-1">
                  {cert}
                  <X className="h-3 w-3 cursor-pointer" onClick={() => quitarCertificacion(cert)} />
                </Badge>
              ))}
            </div>
          </div>

          {/* Vehículo propio */}
          <div className="flex items-center justify-between">
            <Label htmlFor="vehiculo_propio">¿Tiene vehículo propio?</Label>
            <Switch
              onCheckedChange={(checked) => setValue('vehiculo_propio', checked)}
            />
          </div>

          {/* Datos del vehículo (si tiene) */}
          {vehiculoPropio && (
            <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
              <div>
                <Label htmlFor="marca_vehiculo">Marca</Label>
                <Input
                  {...register('datos_vehiculo.marca')}
                  placeholder="Marca del vehículo"
                />
              </div>
              <div>
                <Label htmlFor="modelo_vehiculo">Modelo</Label>
                <Input
                  {...register('datos_vehiculo.modelo')}
                  placeholder="Modelo del vehículo"
                />
              </div>
              <div>
                <Label htmlFor="placas_vehiculo">Placas</Label>
                <Input
                  {...register('datos_vehiculo.placas')}
                  placeholder="Placas del vehículo"
                />
              </div>
            </div>
          )}

          {/* Botones */}
          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={createInstalador.isPending}>
              {createInstalador.isPending ? 'Registrando...' : 'Registrar Instalador'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
