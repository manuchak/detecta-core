import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Clock, Save, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface CapturaFinServicioProps {
  servicioPlanificadoId: string;
  servicioId?: string;
  fechaServicio: string;
  onSave?: () => void;
  defaultHoraInicio?: string;
  defaultHoraFin?: string;
}

export function CapturaFinServicio({
  servicioPlanificadoId,
  servicioId,
  fechaServicio,
  onSave,
  defaultHoraInicio,
  defaultHoraFin
}: CapturaFinServicioProps) {
  const [horaInicio, setHoraInicio] = useState(defaultHoraInicio || '');
  const [horaFin, setHoraFin] = useState(defaultHoraFin || '');
  const [isSaving, setIsSaving] = useState(false);

  const calcularDuracion = (): string | null => {
    if (!horaInicio || !horaFin) return null;
    
    const inicio = new Date(`${fechaServicio}T${horaInicio}`);
    const fin = new Date(`${fechaServicio}T${horaFin}`);
    
    // Si la hora fin es menor que inicio, asumimos que termina al día siguiente
    let diffMs = fin.getTime() - inicio.getTime();
    if (diffMs < 0) {
      diffMs += 24 * 60 * 60 * 1000; // Añadir 24 horas
    }
    
    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${hours}h ${minutes}m`;
  };

  const handleSave = async () => {
    if (!horaInicio || !horaFin) {
      toast.error('Por favor ingresa la hora de inicio y fin');
      return;
    }

    setIsSaving(true);
    try {
      const horaInicioReal = new Date(`${fechaServicio}T${horaInicio}`).toISOString();
      let horaFinReal = new Date(`${fechaServicio}T${horaFin}`);
      
      // Si hora fin es menor, asumir día siguiente
      const inicio = new Date(`${fechaServicio}T${horaInicio}`);
      if (horaFinReal < inicio) {
        horaFinReal = new Date(horaFinReal.getTime() + 24 * 60 * 60 * 1000);
      }

      const { error } = await supabase
        .from('servicios_planificados')
        .update({
          hora_inicio_real: horaInicioReal,
          hora_fin_real: horaFinReal.toISOString()
        })
        .eq('id', servicioPlanificadoId);

      if (error) throw error;

      toast.success('Duración del servicio guardada correctamente');
      onSave?.();
    } catch (error) {
      console.error('Error saving service duration:', error);
      toast.error('Error al guardar la duración del servicio');
    } finally {
      setIsSaving(false);
    }
  };

  const duracion = calcularDuracion();

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Clock className="h-4 w-4" />
          Duración Real del Servicio (Proveedor Externo)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="hora_inicio">Hora Inicio Real</Label>
            <Input
              id="hora_inicio"
              type="time"
              value={horaInicio}
              onChange={(e) => setHoraInicio(e.target.value)}
              className="w-full"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora_fin">Hora Fin Real</Label>
            <Input
              id="hora_fin"
              type="time"
              value={horaFin}
              onChange={(e) => setHoraFin(e.target.value)}
              className="w-full"
            />
          </div>
        </div>
        
        {duracion && (
          <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
            <span className="text-sm text-muted-foreground">Duración calculada:</span>
            <span className="font-semibold text-primary">{duracion}</span>
          </div>
        )}

        <Button 
          onClick={handleSave} 
          disabled={isSaving || !horaInicio || !horaFin}
          className="w-full"
        >
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Guardando...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Guardar Duración
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
