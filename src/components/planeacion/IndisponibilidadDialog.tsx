import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { CalendarIcon, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useCustodioIndisponibilidades, type CrearIndisponibilidadData } from '@/hooks/useCustodioIndisponibilidades';

interface IndisponibilidadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  custodio: {
    id: string;
    nombre: string;
    telefono?: string;
  };
}

const TIPOS_INDISPONIBILIDAD = [
  { value: 'falla_mecanica', label: 'Falla Mecánica', icon: '🔧' },
  { value: 'enfermedad', label: 'Enfermedad', icon: '🏥' },
  { value: 'familiar', label: 'Asunto Familiar', icon: '👨‍👩‍👧‍👦' },
  { value: 'personal', label: 'Asunto Personal', icon: '👤' },
  { value: 'mantenimiento', label: 'Mantenimiento', icon: '⚙️' },
  { value: 'capacitacion', label: 'Capacitación', icon: '📚' },
  { value: 'otro', label: 'Otro', icon: '📝' }
] as const;

const SEVERIDADES = [
  { value: 'baja', label: 'Baja', color: 'text-green-600' },
  { value: 'media', label: 'Media', color: 'text-yellow-600' },
  { value: 'alta', label: 'Alta', color: 'text-red-600' }
] as const;

export function IndisponibilidadDialog({ open, onOpenChange, custodio }: IndisponibilidadDialogProps) {
  const [formData, setFormData] = useState<CrearIndisponibilidadData>({
    custodio_id: custodio.id,
    tipo_indisponibilidad: 'otro',
    motivo: '',
    fecha_inicio: new Date().toISOString().slice(0, 16),
    fecha_fin_estimada: '',
    severidad: 'media',
    requiere_seguimiento: false,
    notas: ''
  });

  const { crearIndisponibilidad, creandoIndisponibilidad } = useCustodioIndisponibilidades();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motivo.trim()) {
      return;
    }

    try {
      await crearIndisponibilidad.mutateAsync(formData);
      onOpenChange(false);
      
      // Reset form
      setFormData({
        custodio_id: custodio.id,
        tipo_indisponibilidad: 'otro',
        motivo: '',
        fecha_inicio: new Date().toISOString().slice(0, 16),
        fecha_fin_estimada: '',
        severidad: 'media',
        requiere_seguimiento: false,
        notas: ''
      });
    } catch (error) {
      console.error('Error creando indisponibilidad:', error);
    }
  };

  const tipoSeleccionado = TIPOS_INDISPONIBILIDAD.find(t => t.value === formData.tipo_indisponibilidad);
  const severidadSeleccionada = SEVERIDADES.find(s => s.value === formData.severidad);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-orange-500" />
            Registrar Indisponibilidad
          </DialogTitle>
          <DialogDescription>
            Registrar indisponibilidad temporal para <strong>{custodio.nombre}</strong>
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tipo de indisponibilidad */}
          <div className="grid gap-2">
            <Label htmlFor="tipo">Tipo de Indisponibilidad</Label>
            <Select
              value={formData.tipo_indisponibilidad}
              onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, tipo_indisponibilidad: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar tipo">
                  {tipoSeleccionado && (
                    <span className="flex items-center gap-2">
                      <span>{tipoSeleccionado.icon}</span>
                      {tipoSeleccionado.label}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TIPOS_INDISPONIBILIDAD.map((tipo) => (
                  <SelectItem key={tipo.value} value={tipo.value}>
                    <span className="flex items-center gap-2">
                      <span>{tipo.icon}</span>
                      {tipo.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Motivo */}
          <div className="grid gap-2">
            <Label htmlFor="motivo">Motivo *</Label>
            <Input
              id="motivo"
              value={formData.motivo}
              onChange={(e) => setFormData(prev => ({ ...prev, motivo: e.target.value }))}
              placeholder="Descripción breve del motivo"
              required
            />
          </div>

          {/* Fechas */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="fecha_inicio">Fecha/Hora Inicio</Label>
              <Input
                id="fecha_inicio"
                type="datetime-local"
                value={formData.fecha_inicio}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_inicio: e.target.value }))}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="fecha_fin">Fecha/Hora Fin Estimada</Label>
              <Input
                id="fecha_fin"
                type="datetime-local"
                value={formData.fecha_fin_estimada}
                onChange={(e) => setFormData(prev => ({ ...prev, fecha_fin_estimada: e.target.value }))}
                placeholder="Opcional"
              />
            </div>
          </div>

          {/* Severidad */}
          <div className="grid gap-2">
            <Label htmlFor="severidad">Severidad</Label>
            <Select
              value={formData.severidad}
              onValueChange={(value: any) => 
                setFormData(prev => ({ ...prev, severidad: value }))
              }
            >
              <SelectTrigger>
                <SelectValue>
                  {severidadSeleccionada && (
                    <span className={`font-medium ${severidadSeleccionada.color}`}>
                      {severidadSeleccionada.label}
                    </span>
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                {SEVERIDADES.map((severidad) => (
                  <SelectItem key={severidad.value} value={severidad.value}>
                    <span className={`font-medium ${severidad.color}`}>
                      {severidad.label}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Switch de seguimiento */}
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="seguimiento">Requiere Seguimiento</Label>
              <p className="text-sm text-muted-foreground">
                Marcar para recibir recordatorios sobre esta indisponibilidad
              </p>
            </div>
            <Switch
              id="seguimiento"
              checked={formData.requiere_seguimiento}
              onCheckedChange={(checked) => 
                setFormData(prev => ({ ...prev, requiere_seguimiento: checked }))
              }
            />
          </div>

          {/* Notas adicionales */}
          <div className="grid gap-2">
            <Label htmlFor="notas">Notas Adicionales</Label>
            <Textarea
              id="notas"
              value={formData.notas}
              onChange={(e) => setFormData(prev => ({ ...prev, notas: e.target.value }))}
              placeholder="Información adicional sobre la indisponibilidad..."
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={creandoIndisponibilidad}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={creandoIndisponibilidad || !formData.motivo.trim()}
            >
              {creandoIndisponibilidad ? 'Registrando...' : 'Registrar Indisponibilidad'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}