
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProgramacionInstalaciones } from '@/hooks/useProgramacionInstalaciones';
import { useInstaladores } from '@/hooks/useInstaladores';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface ProgramarInstalacionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  servicioId?: string | null;
}

export const ProgramarInstalacionDialog = ({ 
  open, 
  onOpenChange, 
  servicioId 
}: ProgramarInstalacionDialogProps) => {
  const [fecha, setFecha] = useState<Date>();
  const [tipoInstalacion, setTipoInstalacion] = useState('');
  const [direccion, setDireccion] = useState('');
  const [contacto, setContacto] = useState('');
  const [telefono, setTelefono] = useState('');
  const [observaciones, setObservaciones] = useState('');
  const [tiempoEstimado, setTiempoEstimado] = useState('60');

  const { createProgramacion } = useProgramacionInstalaciones();
  const { instaladoresActivos } = useInstaladores();

  // Obtener datos del servicio si se proporciona servicioId
  const { data: servicio } = useQuery({
    queryKey: ['servicio', servicioId],
    queryFn: async () => {
      if (!servicioId) return null;
      const { data, error } = await supabase
        .from('servicios_monitoreo')
        .select('*')
        .eq('id', servicioId)
        .single();
      
      if (error) throw error;
      return data;
    },
    enabled: !!servicioId
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fecha || !tipoInstalacion || !direccion || !contacto) return;

    const programacionData = {
      servicio_id: servicioId || undefined,
      fecha_programada: fecha.toISOString(),
      tipo_instalacion: tipoInstalacion as 'vehicular' | 'flotilla' | 'personal',
      direccion_instalacion: direccion,
      contacto_cliente: contacto,
      telefono_cliente: telefono,
      observaciones_cliente: observaciones,
      tiempo_estimado: parseInt(tiempoEstimado),
      estado: 'programada' as const
    };

    createProgramacion.mutate(programacionData, {
      onSuccess: () => {
        onOpenChange(false);
        // Reset form
        setFecha(undefined);
        setTipoInstalacion('');
        setDireccion('');
        setContacto('');
        setTelefono('');
        setObservaciones('');
        setTiempoEstimado('60');
      }
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>
            {servicioId ? 'Programar Instalación GPS' : 'Nueva Programación de Instalación'}
          </DialogTitle>
        </DialogHeader>

        {servicio && (
          <div className="bg-blue-50 p-4 rounded-lg mb-4">
            <h4 className="font-medium text-blue-900">Servicio: {servicio.numero_servicio}</h4>
            <p className="text-blue-700">Cliente: {servicio.nombre_cliente}</p>
            <p className="text-blue-700">Tipo: {servicio.tipo_servicio}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="fecha">Fecha de Instalación</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !fecha && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {fecha ? format(fecha, "PPP", { locale: es }) : "Seleccionar fecha"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={fecha}
                    onSelect={setFecha}
                    disabled={(date) => date < new Date()}
                    initialFocus
                    className="p-3 pointer-events-auto"
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tipo">Tipo de Instalación</Label>
              <Select value={tipoInstalacion} onValueChange={setTipoInstalacion}>
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="vehicular">Vehicular</SelectItem>
                  <SelectItem value="flotilla">Flotilla</SelectItem>
                  <SelectItem value="personal">Personal</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="direccion">Dirección de Instalación</Label>
            <Textarea
              id="direccion"
              value={direccion}
              onChange={(e) => setDireccion(e.target.value)}
              placeholder="Dirección completa donde se realizará la instalación"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="contacto">Contacto Cliente</Label>
              <Input
                id="contacto"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
                placeholder="Nombre del contacto"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                placeholder="Número de teléfono"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tiempo">Tiempo Estimado (minutos)</Label>
            <Select value={tiempoEstimado} onValueChange={setTiempoEstimado}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutos</SelectItem>
                <SelectItem value="60">1 hora</SelectItem>
                <SelectItem value="90">1.5 horas</SelectItem>
                <SelectItem value="120">2 horas</SelectItem>
                <SelectItem value="180">3 horas</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observaciones">Observaciones</Label>
            <Textarea
              id="observaciones"
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Observaciones adicionales sobre la instalación"
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={createProgramacion.isPending || !fecha || !tipoInstalacion || !direccion || !contacto}
            >
              {createProgramacion.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Programar Instalación
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
