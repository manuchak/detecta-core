import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProgramacionInstalacionesCandidato } from '@/hooks/useProgramacionInstalacionesCandidato';
import { useInstaladores } from '@/hooks/useInstaladores';
import { Loader2, Calendar, Clock, MapPin, User } from 'lucide-react';

interface ScheduleInstallationDialogProps {
  open: boolean;
  onClose: () => void;
  candidatoId: string;
  candidatoNombre?: string;
}

export const ScheduleInstallationDialog = ({
  open,
  onClose,
  candidatoId,
  candidatoNombre
}: ScheduleInstallationDialogProps) => {
  const { createInstalacion } = useProgramacionInstalacionesCandidato(candidatoId);
  const { instaladores } = useInstaladores();

  const [formData, setFormData] = useState({
    fecha_programada: '',
    hora_inicio: '09:00',
    hora_fin: '12:00',
    instalador_id: '',
    direccion_instalacion: '',
    notas: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    await createInstalacion.mutateAsync({
      candidato_id: candidatoId,
      fecha_programada: formData.fecha_programada,
      hora_inicio: formData.hora_inicio,
      hora_fin: formData.hora_fin,
      instalador_id: formData.instalador_id || undefined,
      direccion_instalacion: formData.direccion_instalacion || undefined,
      notas: formData.notas || undefined
    });

    setFormData({
      fecha_programada: '',
      hora_inicio: '09:00',
      hora_fin: '12:00',
      instalador_id: '',
      direccion_instalacion: '',
      notas: ''
    });
    onClose();
  };

  const instaladoresActivos = instaladores?.filter(i => i.activo) || [];

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Programar Instalación GPS</DialogTitle>
          {candidatoNombre && (
            <p className="text-sm text-muted-foreground">
              Candidato: {candidatoNombre}
            </p>
          )}
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Fecha */}
          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha programada *
            </Label>
            <Input
              id="fecha"
              type="date"
              required
              value={formData.fecha_programada}
              onChange={(e) => setFormData(f => ({ ...f, fecha_programada: e.target.value }))}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Horario */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hora_inicio" className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Hora inicio
              </Label>
              <Input
                id="hora_inicio"
                type="time"
                value={formData.hora_inicio}
                onChange={(e) => setFormData(f => ({ ...f, hora_inicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="hora_fin">Hora fin</Label>
              <Input
                id="hora_fin"
                type="time"
                value={formData.hora_fin}
                onChange={(e) => setFormData(f => ({ ...f, hora_fin: e.target.value }))}
              />
            </div>
          </div>

          {/* Instalador */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Instalador asignado
            </Label>
            <Select
              value={formData.instalador_id}
              onValueChange={(value) => setFormData(f => ({ ...f, instalador_id: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar instalador (opcional)" />
              </SelectTrigger>
              <SelectContent>
                {instaladoresActivos.map((instalador) => (
                  <SelectItem key={instalador.id} value={instalador.id}>
                    {instalador.nombre_completo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <Label htmlFor="direccion" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Dirección de instalación
            </Label>
            <Input
              id="direccion"
              placeholder="Ej: Av. Reforma 123, Col. Centro"
              value={formData.direccion_instalacion}
              onChange={(e) => setFormData(f => ({ ...f, direccion_instalacion: e.target.value }))}
            />
          </div>

          {/* Notas */}
          <div className="space-y-2">
            <Label htmlFor="notas">Notas adicionales</Label>
            <Textarea
              id="notas"
              placeholder="Instrucciones especiales, referencias, etc."
              value={formData.notas}
              onChange={(e) => setFormData(f => ({ ...f, notas: e.target.value }))}
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              disabled={!formData.fecha_programada || createInstalacion.isPending}
            >
              {createInstalacion.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Programar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
