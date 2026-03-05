import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCxPCorte } from '../../../hooks/useCxPCortesSemanales';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function GenerarCorteDialog({ open, onOpenChange }: Props) {
  const lastMonday = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const lastSunday = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

  const [form, setForm] = useState({
    tipo_operativo: 'custodio' as 'custodio' | 'armado_interno',
    operativo_nombre: '',
    operativo_id: '',
    semana_inicio: format(lastMonday, 'yyyy-MM-dd'),
    semana_fin: format(lastSunday, 'yyyy-MM-dd'),
    notas: '',
  });

  const createMutation = useCreateCxPCorte();

  const handleCreate = async () => {
    if (!form.operativo_nombre || !form.semana_inicio || !form.semana_fin) return;
    await createMutation.mutateAsync({
      tipo_operativo: form.tipo_operativo,
      operativo_nombre: form.operativo_nombre,
      operativo_id: form.operativo_id || undefined,
      semana_inicio: form.semana_inicio,
      semana_fin: form.semana_fin,
      notas: form.notas || undefined,
    });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Generar Corte Semanal</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Tipo de Operativo *</Label>
            <Select value={form.tipo_operativo} onValueChange={v => setForm(f => ({ ...f, tipo_operativo: v as any }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custodio">Custodio</SelectItem>
                <SelectItem value="armado_interno">Armado Interno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Nombre del Operativo *</Label>
            <Input
              value={form.operativo_nombre}
              onChange={e => setForm(f => ({ ...f, operativo_nombre: e.target.value }))}
              placeholder="Nombre completo"
            />
          </div>

          <div className="space-y-2">
            <Label>ID del Operativo (UUID)</Label>
            <Input
              value={form.operativo_id}
              onChange={e => setForm(f => ({ ...f, operativo_id: e.target.value }))}
              placeholder="UUID del custodio o armado (opcional)"
            />
            <p className="text-xs text-muted-foreground">Si se proporciona, el sistema auto-calcula servicios, casetas, hoteles y apoyos.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Semana Inicio (Lunes) *</Label>
              <Input
                type="date"
                value={form.semana_inicio}
                onChange={e => setForm(f => ({ ...f, semana_inicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Semana Fin (Domingo) *</Label>
              <Input
                type="date"
                value={form.semana_fin}
                onChange={e => setForm(f => ({ ...f, semana_fin: e.target.value }))}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
            />
          </div>

          <p className="text-xs text-muted-foreground">
            El sistema calculará automáticamente: servicios completados, casetas, hoteles y apoyos extraordinarios aprobados en la semana seleccionada.
          </p>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={!form.operativo_nombre || createMutation.isPending}>
            Generar Corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
