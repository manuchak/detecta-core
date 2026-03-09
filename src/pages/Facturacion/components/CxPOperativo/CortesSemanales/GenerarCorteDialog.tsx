import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCreateCxPCorte } from '../../../hooks/useCxPCortesSemanales';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface OperativoOption {
  id: string;
  nombre: string;
  tipo: 'custodio' | 'armado_interno';
}

function useOperativosDisponibles(tipo: 'custodio' | 'armado_interno') {
  return useQuery({
    queryKey: ['operativos-corte', tipo],
    queryFn: async (): Promise<OperativoOption[]> => {
      if (tipo === 'custodio') {
        const { data, error } = await supabase
          .from('candidatos_custodios')
          .select('id, nombre')
          .in('estado_proceso', ['liberado', 'activo'])
          .order('nombre');
        if (error) throw error;
        return (data || []).map(d => ({ id: d.id, nombre: d.nombre, tipo: 'custodio' as const }));
      } else {
        const { data, error } = await supabase
          .from('armados_operativos')
          .select('id, nombre')
          .eq('estado', 'activo')
          .in('tipo_armado', ['interno', 'planta'])
          .order('nombre');
        if (error) throw error;
        return (data || []).map(d => ({ id: d.id, nombre: d.nombre, tipo: 'armado_interno' as const }));
      }
    },
    staleTime: 2 * 60 * 1000,
  });
}

export function GenerarCorteDialog({ open, onOpenChange }: Props) {
  const lastMonday = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });
  const lastSunday = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 });

  const [form, setForm] = useState({
    tipo_operativo: 'custodio' as 'custodio' | 'armado_interno',
    operativo_id: '',
    semana_inicio: format(lastMonday, 'yyyy-MM-dd'),
    semana_fin: format(lastSunday, 'yyyy-MM-dd'),
    notas: '',
  });

  const [busqueda, setBusqueda] = useState('');

  const { data: operativos = [], isLoading: loadingOps } = useOperativosDisponibles(form.tipo_operativo);
  const createMutation = useCreateCxPCorte();

  const operativosFiltrados = useMemo(() => {
    if (!busqueda) return operativos;
    const q = busqueda.toLowerCase();
    return operativos.filter(o => o.nombre.toLowerCase().includes(q));
  }, [operativos, busqueda]);

  const selectedOp = operativos.find(o => o.id === form.operativo_id);

  const handleCreate = async () => {
    if (!form.operativo_id || !selectedOp) return;
    await createMutation.mutateAsync({
      tipo_operativo: form.tipo_operativo,
      operativo_nombre: selectedOp.nombre,
      operativo_id: form.operativo_id,
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
            <Select
              value={form.tipo_operativo}
              onValueChange={v => {
                setForm(f => ({ ...f, tipo_operativo: v as any, operativo_id: '' }));
                setBusqueda('');
              }}
            >
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="custodio">Custodio</SelectItem>
                <SelectItem value="armado_interno">Armado Interno</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Operativo *</Label>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                value={busqueda}
                onChange={e => setBusqueda(e.target.value)}
                placeholder={loadingOps ? 'Cargando...' : `Buscar ${form.tipo_operativo === 'custodio' ? 'custodio' : 'armado'}...`}
                className="pl-8"
              />
            </div>
            {busqueda && operativosFiltrados.length > 0 && !form.operativo_id && (
              <div className="max-h-40 overflow-y-auto border rounded-md bg-popover">
                {operativosFiltrados.slice(0, 20).map(op => (
                  <button
                    key={op.id}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-accent transition-colors"
                    onClick={() => {
                      setForm(f => ({ ...f, operativo_id: op.id }));
                      setBusqueda(op.nombre);
                    }}
                  >
                    {op.nombre}
                  </button>
                ))}
              </div>
            )}
            {selectedOp && (
              <p className="text-xs text-muted-foreground">
                Seleccionado: <strong>{selectedOp.nombre}</strong>
                <button
                  className="ml-2 text-destructive hover:underline"
                  onClick={() => {
                    setForm(f => ({ ...f, operativo_id: '' }));
                    setBusqueda('');
                  }}
                >
                  Cambiar
                </button>
              </p>
            )}
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
          <Button onClick={handleCreate} disabled={!form.operativo_id || createMutation.isPending}>
            Generar Corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
