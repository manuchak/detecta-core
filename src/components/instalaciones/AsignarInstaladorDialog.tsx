import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Clock, User, MapPin, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useToast } from '@/hooks/use-toast';

interface AsignarInstaladorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  instalacion: any;
}

export const AsignarInstaladorDialog = ({ 
  open, 
  onOpenChange, 
  instalacion 
}: AsignarInstaladorDialogProps) => {
  const { toast } = useToast();
  const { asignarInstalador, updateEstadoInstalacion, updateProgramacion: updateProgramacionMutation } = useProgramacionInstalaciones();
  
  // Mock de instaladores - en producción vendría de una API
  const instaladores = [
    { id: '1', nombre: 'Juan Pérez', telefono: '555-0001', especialidad: 'GPS Vehicular' },
    { id: '2', nombre: 'María García', telefono: '555-0002', especialidad: 'Sistemas Avanzados' },
    { id: '3', nombre: 'Carlos López', telefono: '555-0003', especialidad: 'Flotas Comerciales' },
    { id: '4', nombre: 'Ana Rodríguez', telefono: '555-0004', especialidad: 'GPS Básico' },
    { id: '5', nombre: 'Roberto Silva', telefono: '555-0005', especialidad: 'Instalaciones Especiales' }
  ];

  const [selectedInstalador, setSelectedInstalador] = useState<string>('');
  const [fechaCita, setFechaCita] = useState<Date | undefined>(
    instalacion?.fecha_programada ? new Date(instalacion.fecha_programada) : undefined
  );
  const [horaCita, setHoraCita] = useState<string>(
    instalacion?.fecha_programada ? format(new Date(instalacion.fecha_programada), 'HH:mm') : '09:00'
  );
  const [direccion, setDireccion] = useState<string>(instalacion?.direccion_instalacion || '');
  const [contacto, setContacto] = useState<string>(instalacion?.contacto_cliente || '');
  const [telefono, setTelefono] = useState<string>(instalacion?.telefono_contacto || '');
  const [observaciones, setObservaciones] = useState<string>(instalacion?.observaciones_cliente || '');
  const [tiempoEstimado, setTiempoEstimado] = useState<string>(instalacion?.tiempo_estimado?.toString() || '120');

  const handleAsignar = async () => {
    if (!selectedInstalador) {
      toast({
        title: "Error",
        description: "Debe seleccionar un instalador",
        variant: "destructive",
      });
      return;
    }

    if (!fechaCita) {
      toast({
        title: "Error", 
        description: "Debe seleccionar una fecha para la cita",
        variant: "destructive",
      });
      return;
    }

    try {
      // Crear la fecha y hora completa
      const fechaCompleta = new Date(fechaCita);
      const [horas, minutos] = horaCita.split(':');
      fechaCompleta.setHours(parseInt(horas), parseInt(minutos));

      // Actualizar todos los datos de la instalación
      await updateProgramacion({
        id: instalacion.id,
        fecha_programada: fechaCompleta.toISOString(),
        direccion_instalacion: direccion,
        contacto_cliente: contacto,
        telefono_contacto: telefono,
        observaciones_cliente: observaciones,
        tiempo_estimado: parseInt(tiempoEstimado),
        instalador_id: selectedInstalador
      });

      toast({
        title: "Instalación actualizada",
        description: "La instalación ha sido asignada y actualizada correctamente",
      });
      
      onOpenChange(false);
    } catch (error) {
      console.error('Error assigning installer:', error);
      toast({
        title: "Error",
        description: "No se pudo asignar el instalador",
        variant: "destructive",
      });
    }
  };

  // Función para actualizar programación
  const updateProgramacion = async (data: any) => {
    await updateProgramacionMutation.mutateAsync(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            Asignar Instalador y Gestionar Cita
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Información del Cliente */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Información del Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="contacto">Contacto del Cliente *</Label>
                <Input
                  id="contacto"
                  value={contacto}
                  onChange={(e) => setContacto(e.target.value)}
                  placeholder="Nombre del contacto"
                />
              </div>
              <div>
                <Label htmlFor="telefono">Teléfono *</Label>
                <Input
                  id="telefono"
                  value={telefono}
                  onChange={(e) => setTelefono(e.target.value)}
                  placeholder="Teléfono de contacto"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección de Instalación *</Label>
                <Input
                  id="direccion"
                  value={direccion}
                  onChange={(e) => setDireccion(e.target.value)}
                  placeholder="Dirección completa"
                />
              </div>
            </div>
          </div>

          {/* Programación de Cita */}
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-medium text-blue-900 mb-3 flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              Programación de Cita
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label>Fecha de Instalación *</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={"outline"}
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !fechaCita && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {fechaCita ? format(fechaCita, "PPP", { locale: es }) : "Seleccionar fecha"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={fechaCita}
                      onSelect={setFechaCita}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div>
                <Label htmlFor="hora">Hora *</Label>
                <Select value={horaCita} onValueChange={setHoraCita}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar hora" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 10 }, (_, i) => {
                      const hora = 8 + i;
                      return (
                        <SelectItem key={hora} value={`${hora.toString().padStart(2, '0')}:00`}>
                          {hora.toString().padStart(2, '0')}:00
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="tiempo">Tiempo Estimado (min)</Label>
                <Input
                  id="tiempo"
                  type="number"
                  value={tiempoEstimado}
                  onChange={(e) => setTiempoEstimado(e.target.value)}
                  placeholder="120"
                />
              </div>
            </div>
          </div>

          {/* Asignación de Instalador */}
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-900 mb-3 flex items-center gap-2">
              <User className="h-4 w-4" />
              Asignación de Instalador
            </h3>
            <div>
              <Label htmlFor="instalador">Seleccionar Instalador *</Label>
              <Select value={selectedInstalador} onValueChange={setSelectedInstalador}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar instalador" />
                </SelectTrigger>
                <SelectContent>
                  {instaladores.map((instalador) => (
                    <SelectItem key={instalador.id} value={instalador.id}>
                      <div className="flex flex-col">
                        <span className="font-medium">{instalador.nombre}</span>
                        <span className="text-xs text-gray-500">
                          {instalador.telefono} • {instalador.especialidad}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Observaciones */}
          <div>
            <Label htmlFor="observaciones">Observaciones e Instrucciones Especiales</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Instrucciones especiales, acceso al edificio, horarios preferenciales, etc."
              rows={3}
            />
          </div>

          {/* Botones de Acción */}
          <div className="flex gap-3 pt-4">
            <Button
              onClick={handleAsignar}
              disabled={asignarInstalador.isPending}
              className="flex-1"
            >
              {asignarInstalador.isPending ? 'Asignando...' : 'Asignar Instalador y Guardar'}
            </Button>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};