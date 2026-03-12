import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCreateCxPCorte } from '../../../hooks/useCxPCortesSemanales';
import { startOfWeek, endOfWeek, subWeeks, format } from 'date-fns';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Search, Loader2, AlertTriangle } from 'lucide-react';
import { fetchTarifasKm, calcularCostoPlano } from '@/utils/tarifasKmUtils';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  weekStartsOn?: 0 | 1;
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

interface PreviewData {
  totalServicios: number;
  montoServicios: number;
  montoCasetas: number;
  montoEstadias: number;
  montoHoteles: number;
  montoApoyos: number;
  total: number;
}

function usePreviewCorte(
  tipo: 'custodio' | 'armado_interno',
  operativoId: string,
  semanaInicio: string,
  semanaFin: string,
) {
  return useQuery({
    queryKey: ['preview-corte', tipo, operativoId, semanaInicio, semanaFin],
    queryFn: async (): Promise<PreviewData> => {
      let montoServicios = 0, totalServicios = 0, montoCasetas = 0, montoEstadias = 0, montoHoteles = 0, montoApoyos = 0;

      if (tipo === 'custodio') {
        const { data: servicios } = await supabase
          .from('servicios_custodia')
          .select('id, costo_custodio, casetas')
          .eq('id_custodio', operativoId)
          .eq('estado', 'Finalizado')
          .gte('fecha_hora_cita', `${semanaInicio}T00:00:00`)
          .lte('fecha_hora_cita', `${semanaFin}T23:59:59`);

        if (servicios) {
          totalServicios = servicios.length;
          for (const s of servicios) {
            montoServicios += Number(s.costo_custodio) || 0;
            montoCasetas += Number(s.casetas) || 0;
          }
          if (servicios.length > 0) {
            const svcIds = servicios.map(s => s.id);
            const { data: dets } = await supabase
              .from('detenciones_servicio')
              .select('duracion_minutos')
              .in('servicio_id', svcIds)
              .eq('pagable_custodio', true);
            if (dets) {
              montoEstadias = dets.reduce((s, d) => s + ((d.duracion_minutos || 0) / 60) * 50, 0);
            }
          }
        }
      } else {
        const { data: asignaciones } = await supabase
          .from('asignacion_armados')
          .select('id, tarifa_acordada')
          .eq('armado_id', operativoId)
          .eq('tipo_asignacion', 'interno')
          .eq('estado_asignacion', 'completado')
          .gte('hora_encuentro', `${semanaInicio}T00:00:00`)
          .lte('hora_encuentro', `${semanaFin}T23:59:59`);
        if (asignaciones) {
          totalServicios = asignaciones.length;
          montoServicios = asignaciones.reduce((s, a) => s + (Number(a.tarifa_acordada) || 0), 0);
        }
      }

      const { data: hoteles } = await supabase
        .from('gastos_extraordinarios_servicio')
        .select('monto')
        .eq('registrado_por', operativoId)
        .eq('pagable_custodio', true)
        .in('tipo_gasto', ['hotel', 'pernocta'])
        .gte('created_at', `${semanaInicio}T00:00:00`)
        .lte('created_at', `${semanaFin}T23:59:59`);
      if (hoteles) montoHoteles = hoteles.reduce((s, h) => s + (Number(h.monto) || 0), 0);

      const { data: apoyos } = await supabase
        .from('solicitudes_apoyo_extraordinario')
        .select('monto_aprobado')
        .eq('custodio_id', operativoId)
        .eq('estado', 'aprobado')
        .gte('fecha_solicitud', `${semanaInicio}T00:00:00`)
        .lte('fecha_solicitud', `${semanaFin}T23:59:59`);
      if (apoyos) montoApoyos = apoyos.reduce((s, a) => s + (Number(a.monto_aprobado) || 0), 0);

      return {
        totalServicios,
        montoServicios: Math.round(montoServicios * 100) / 100,
        montoCasetas: Math.round(montoCasetas * 100) / 100,
        montoEstadias: Math.round(montoEstadias * 100) / 100,
        montoHoteles: Math.round(montoHoteles * 100) / 100,
        montoApoyos: Math.round(montoApoyos * 100) / 100,
        total: Math.round((montoServicios + montoCasetas + montoEstadias + montoHoteles + montoApoyos) * 100) / 100,
      };
    },
    enabled: !!operativoId && !!semanaInicio && !!semanaFin,
    staleTime: 30_000,
  });
}

// Duplicate check hook
function useDuplicateCheck(operativoId: string, semanaInicio: string, semanaFin: string) {
  return useQuery({
    queryKey: ['corte-duplicate-check', operativoId, semanaInicio, semanaFin],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cxp_cortes_semanales')
        .select('id, estado')
        .eq('operativo_id', operativoId)
        .gte('semana_inicio', semanaInicio)
        .lte('semana_fin', semanaFin)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!operativoId && !!semanaInicio && !!semanaFin,
    staleTime: 10_000,
  });
}

const fmt = (v: number) => new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function GenerarCorteDialog({ open, onOpenChange, weekStartsOn = 1 }: Props) {
  const wso = weekStartsOn as 0 | 1;
  const lastWeekStart = startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: wso });
  const lastWeekEnd = endOfWeek(subWeeks(new Date(), 1), { weekStartsOn: wso });

  const startLabel = wso === 1 ? 'Inicio (Lunes)' : 'Inicio (Domingo)';
  const endLabel = wso === 1 ? 'Fin (Domingo)' : 'Fin (Sábado)';

  const [form, setForm] = useState({
    tipo_operativo: 'custodio' as 'custodio' | 'armado_interno',
    operativo_id: '',
    semana_inicio: format(lastWeekStart, 'yyyy-MM-dd'),
    semana_fin: format(lastWeekEnd, 'yyyy-MM-dd'),
    notas: '',
  });

  const [busqueda, setBusqueda] = useState('');

  const { data: operativos = [], isLoading: loadingOps } = useOperativosDisponibles(form.tipo_operativo);
  const createMutation = useCreateCxPCorte();

  const { data: preview, isLoading: loadingPreview } = usePreviewCorte(
    form.tipo_operativo,
    form.operativo_id,
    form.semana_inicio,
    form.semana_fin,
  );

  const { data: duplicate } = useDuplicateCheck(
    form.operativo_id,
    form.semana_inicio,
    form.semana_fin,
  );

  const operativosFiltrados = useMemo(() => {
    if (!busqueda) return operativos;
    const q = busqueda.toLowerCase();
    return operativos.filter(o => o.nombre.toLowerCase().includes(q));
  }, [operativos, busqueda]);

  const selectedOp = operativos.find(o => o.id === form.operativo_id);

  const handleCreate = async () => {
    if (!form.operativo_id || !selectedOp || duplicate) return;
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

  const isDisabled = !form.operativo_id || createMutation.isPending || (preview?.totalServicios === 0) || !!duplicate;

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

          {/* Duplicate warning */}
          {duplicate && (
            <div className="flex items-center gap-2 p-3 rounded-lg border border-destructive/30 bg-destructive/5">
              <AlertTriangle className="h-4 w-4 text-destructive shrink-0" />
              <p className="text-xs text-destructive">
                Este operativo ya tiene un corte generado para esta semana (estado: {duplicate.estado}). No se puede crear otro.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{startLabel} *</Label>
              <Input
                type="date"
                value={form.semana_inicio}
                onChange={e => setForm(f => ({ ...f, semana_inicio: e.target.value }))}
              />
            </div>
            <div className="space-y-2">
              <Label>{endLabel} *</Label>
              <Input
                type="date"
                value={form.semana_fin}
                onChange={e => setForm(f => ({ ...f, semana_fin: e.target.value }))}
              />
            </div>
          </div>

          {/* Preview */}
          {form.operativo_id && !duplicate && (
            <Card className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground uppercase">Preview del Corte</p>
                {loadingPreview && <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />}
              </div>
              {preview ? (
                <>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-1.5">
                      <p className="text-[10px] text-muted-foreground">Servicios</p>
                      <p className="text-sm font-bold">{preview.totalServicios}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1.5">
                      <p className="text-[10px] text-muted-foreground">Base</p>
                      <p className="text-sm font-semibold">{fmt(preview.montoServicios)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1.5">
                      <p className="text-[10px] text-muted-foreground">Casetas</p>
                      <p className="text-sm font-semibold">{fmt(preview.montoCasetas)}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-muted/50 rounded-md p-1.5">
                      <p className="text-[10px] text-muted-foreground">Estadías</p>
                      <p className="text-sm font-semibold">{fmt(preview.montoEstadias)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1.5">
                      <p className="text-[10px] text-muted-foreground">Hoteles</p>
                      <p className="text-sm font-semibold">{fmt(preview.montoHoteles)}</p>
                    </div>
                    <div className="bg-muted/50 rounded-md p-1.5">
                      <p className="text-[10px] text-muted-foreground">Apoyos</p>
                      <p className="text-sm font-semibold">{fmt(preview.montoApoyos)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between border-t pt-2">
                    <p className="text-xs font-semibold">Total Estimado</p>
                    <p className="text-base font-bold">{fmt(preview.total)}</p>
                  </div>
                  {preview.totalServicios === 0 && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                      ⚠ No se encontraron servicios finalizados en esta semana para este operativo.
                    </p>
                  )}
                </>
              ) : !loadingPreview ? (
                <p className="text-xs text-muted-foreground">Sin datos para mostrar.</p>
              ) : null}
            </Card>
          )}

          <div className="space-y-2">
            <Label>Notas</Label>
            <Textarea
              value={form.notas}
              onChange={e => setForm(f => ({ ...f, notas: e.target.value }))}
              rows={2}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleCreate} disabled={isDisabled}>
            Generar Corte
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
