
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useServiciosMonitoreo } from '@/hooks/useServiciosMonitoreo';
import { useToast } from '@/hooks/use-toast';
import { AsignacionGPSDialog } from '@/components/kits/AsignacionGPSDialog';
import type { TipoInstalacion, PrioridadInstalacion } from '@/types/instaladores';

const schema = z.object({
  servicio_id: z.string().min(1, 'Debe seleccionar un servicio'),
  tipo_instalacion: z.string().min(1, 'Debe seleccionar el tipo de instalación'),
  fecha_programada: z.string().min(1, 'Debe especificar la fecha'),
  direccion_instalacion: z.string().min(1, 'Debe especificar la dirección'),
  contacto_cliente: z.string().min(1, 'Debe especificar el contacto'),
  telefono_contacto: z.string().min(1, 'Debe especificar el teléfono'),
  prioridad: z.string().optional(),
  tiempo_estimado: z.number().min(30).max(480),
  observaciones_cliente: z.string().optional(),
  instrucciones_especiales: z.string().optional(),
  requiere_vehiculo_elevado: z.boolean().optional(),
  acceso_restringido: z.boolean().optional()
});

type FormData = z.infer<typeof schema>;

interface ProgramarInstalacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId?: string;
}

// Función para determinar sensores requeridos basado en el tipo de instalación
const determineSensoresRequeridos = (tipoInstalacion: string): string[] => {
  const sensoresMap: Record<string, string[]> = {
    'gps_vehicular': ['boton_panico', 'sensor_ignicion'],
    'gps_personal': ['boton_panico'],
    'camara': ['camara_respaldo', 'boton_panico'],
    'alarma': ['sensor_puerta', 'sensor_presencia_vibracion', 'boton_panico'],
    'combo': ['camara_respaldo', 'boton_panico', 'sensor_ignicion', 'sensor_puerta']
  };
  
  return sensoresMap[tipoInstalacion] || ['boton_panico'];
};

export const ProgramarInstalacionDialog: React.FC<ProgramarInstalacionDialogProps> = ({
  open,
  onOpenChange,
  servicioId
}) => {
  const { createProgramacion } = useProgramacionInstalaciones();
  const { servicios } = useServiciosMonitoreo();
  const { toast } = useToast();
  
  // Estados para el diálogo de asignación GPS
  const [showAsignacionGPS, setShowAsignacionGPS] = React.useState(false);
  const [programacionCreada, setProgramacionCreada] = React.useState<{
    id: string;
    tipo_instalacion: string;
    sensores_requeridos: string[];
  } | null>(null);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      servicio_id: servicioId || '',
      prioridad: 'normal',
      tiempo_estimado: 120,
      requiere_vehiculo_elevado: false,
      acceso_restringido: false
    }
  });

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset, setValue, watch } = form;

  // Set servicioId when prop changes
  React.useEffect(() => {
    if (servicioId) {
      setValue('servicio_id', servicioId);
    }
  }, [servicioId, setValue]);

  // Filtrar servicios aprobados que necesitan instalación
  const serviciosAprobados = servicios?.filter(s => 
    s.estado_general === 'aprobado' || s.estado_general === 'programacion_instalacion'
  ) || [];

  const onSubmit = async (data: FormData) => {
    try {
      console.log('Datos del formulario:', data);
      
      // Validar fecha mínima
      const fechaSeleccionada = new Date(data.fecha_programada);
      const fechaMinima = new Date(Date.now() + 72 * 60 * 60 * 1000);
      
      if (fechaSeleccionada < fechaMinima) {
        toast({
          title: "Error de validación",
          description: "La fecha debe ser al menos 72 horas en el futuro",
          variant: "destructive",
        });
        return;
      }

      // Construir payload
      const payload = {
        servicio_id: data.servicio_id,
        tipo_instalacion: data.tipo_instalacion as TipoInstalacion,
        fecha_programada: data.fecha_programada,
        direccion_instalacion: data.direccion_instalacion,
        contacto_cliente: data.contacto_cliente,
        telefono_contacto: data.telefono_contacto,
        prioridad: (data.prioridad || 'normal') as PrioridadInstalacion,
        tiempo_estimado: data.tiempo_estimado || 120,
        observaciones_cliente: data.observaciones_cliente || '',
        instrucciones_especiales: data.instrucciones_especiales || '',
        requiere_vehiculo_elevado: data.requiere_vehiculo_elevado || false,
        acceso_restringido: data.acceso_restringido || false,
        herramientas_especiales: []
      };

      console.log('Payload a enviar:', payload);

      const result = await createProgramacion.mutateAsync(payload);
      
      // Determinar sensores requeridos basado en el tipo de instalación
      const sensoresRequeridos = determineSensoresRequeridos(data.tipo_instalacion);
      
      // Configurar datos para el diálogo de asignación GPS
      setProgramacionCreada({
        id: result.id,
        tipo_instalacion: data.tipo_instalacion,
        sensores_requeridos: sensoresRequeridos
      });
      
      reset();
      onOpenChange(false);
      
      // Abrir diálogo de asignación GPS
      setShowAsignacionGPS(true);
      
      toast({
        title: "Instalación programada",
        description: "Ahora selecciona los componentes del kit GPS.",
      });
    } catch (error) {
      console.error('Error creating installation:', error);
      toast({
        title: "Error al programar instalación",
        description: error instanceof Error ? error.message : "Error desconocido al programar la instalación",
        variant: "destructive",
      });
    }
  };

  const handleClose = () => {
    reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Programar Nueva Instalación</DialogTitle>
          <DialogDescription>
            Complete los detalles para programar una nueva instalación de GPS
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="servicio_id">Servicio</Label>
              <Select 
                onValueChange={(value) => setValue('servicio_id', value)}
                value={watch('servicio_id')}
                disabled={!!servicioId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar servicio" />
                </SelectTrigger>
                <SelectContent>
                  {serviciosAprobados.map((servicio) => (
                    <SelectItem key={servicio.id} value={servicio.id}>
                      {servicio.numero_servicio} - {servicio.nombre_cliente}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.servicio_id && (
                <p className="text-sm text-red-500">{errors.servicio_id.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo_instalacion">Tipo de Instalación</Label>
              <Select onValueChange={(value) => setValue('tipo_instalacion', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="gps_vehicular">GPS Vehicular</SelectItem>
                  <SelectItem value="gps_personal">GPS Personal</SelectItem>
                  <SelectItem value="camara">Cámara</SelectItem>
                  <SelectItem value="alarma">Alarma</SelectItem>
                  <SelectItem value="combo">Combo</SelectItem>
                </SelectContent>
              </Select>
              {errors.tipo_instalacion && (
                <p className="text-sm text-red-500">{errors.tipo_instalacion.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha_programada">Fecha y Hora</Label>
              <Input
                {...register('fecha_programada')}
                type="datetime-local"
                min={new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString().slice(0, 16)}
              />
              {errors.fecha_programada && (
                <p className="text-sm text-red-500">{errors.fecha_programada.message}</p>
              )}
              <p className="text-xs text-gray-500">
                Mínimo 72 horas de anticipación
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tiempo_estimado">Tiempo Estimado (minutos)</Label>
              <Input
                {...register('tiempo_estimado', { valueAsNumber: true })}
                type="number"
                min={30}
                max={480}
                defaultValue={120}
              />
              {errors.tiempo_estimado && (
                <p className="text-sm text-red-500">{errors.tiempo_estimado.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion_instalacion">Dirección de Instalación</Label>
            <Textarea
              {...register('direccion_instalacion')}
              placeholder="Dirección completa donde se realizará la instalación"
            />
            {errors.direccion_instalacion && (
              <p className="text-sm text-red-500">{errors.direccion_instalacion.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto_cliente">Contacto del Cliente</Label>
              <Input
                {...register('contacto_cliente')}
                placeholder="Nombre del contacto"
              />
              {errors.contacto_cliente && (
                <p className="text-sm text-red-500">{errors.contacto_cliente.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono_contacto">Teléfono de Contacto</Label>
              <Input
                {...register('telefono_contacto')}
                placeholder="Teléfono del contacto"
              />
              {errors.telefono_contacto && (
                <p className="text-sm text-red-500">{errors.telefono_contacto.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="prioridad">Prioridad</Label>
            <Select onValueChange={(value) => setValue('prioridad', value)} defaultValue="normal">
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="baja">Baja</SelectItem>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="alta">Alta</SelectItem>
                <SelectItem value="urgente">Urgente</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="requiere_vehiculo_elevado"
                onCheckedChange={(checked) => setValue('requiere_vehiculo_elevado', checked)}
              />
              <Label htmlFor="requiere_vehiculo_elevado">Requiere vehículo elevado</Label>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="acceso_restringido"
                onCheckedChange={(checked) => setValue('acceso_restringido', checked)}
              />
              <Label htmlFor="acceso_restringido">Acceso restringido</Label>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones_cliente">Observaciones del Cliente</Label>
            <Textarea
              {...register('observaciones_cliente')}
              placeholder="Observaciones especiales del cliente"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="instrucciones_especiales">Instrucciones Especiales</Label>
            <Textarea
              {...register('instrucciones_especiales')}
              placeholder="Instrucciones especiales para el instalador"
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Programando...' : 'Programar Instalación'}
            </Button>
          </div>
        </form>
      </DialogContent>
      
      {/* Diálogo de asignación GPS */}
      {programacionCreada && (
        <AsignacionGPSDialog
          open={showAsignacionGPS}
          onOpenChange={setShowAsignacionGPS}
          programacionId={programacionCreada.id}
          tipoInstalacion={programacionCreada.tipo_instalacion}
          sensoresRequeridos={programacionCreada.sensores_requeridos}
          onKitCreated={() => {
            setShowAsignacionGPS(false);
            setProgramacionCreada(null);
          }}
        />
      )}
    </Dialog>
  );
};
