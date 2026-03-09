import { useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Loader2, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useCreateCxPCorte, CXP_TARIFA_ESTADIA_HORA } from '../../../hooks/useCxPCortesSemanales';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semanaInicio: string;
  semanaFin: string;
  weekLabel: string;
}

interface OperativoPreview {
  id: string;
  nombre: string;
  tipo: 'custodio' | 'armado_interno';
  totalServicios: number;
  montoEstimado: number;
  yaGenerado: boolean;
}

const fmt = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

function useOperativosConServicios(semanaInicio: string, semanaFin: string, enabled: boolean) {
  return useQuery({
    queryKey: ['operativos-con-servicios', semanaInicio, semanaFin],
    queryFn: async (): Promise<OperativoPreview[]> => {
      // 1) Fetch all finalized services in the week grouped by custodio
      const { data: servicios } = await supabase
        .from('servicios_custodia')
        .select('id_custodio, costo_custodio, casetas')
        .eq('estado', 'Finalizado')
        .gte('fecha_hora_cita', `${semanaInicio}T00:00:00`)
        .lte('fecha_hora_cita', `${semanaFin}T23:59:59`)
        .not('id_custodio', 'is', null);

      // 2) Fetch existing cortes for this week
      const { data: cortesExistentes } = await supabase
        .from('cxp_cortes_semanales')
        .select('operativo_id')
        .gte('semana_inicio', semanaInicio)
        .lte('semana_fin', semanaFin);

      const cortesSet = new Set((cortesExistentes || []).map(c => c.operativo_id));

      // 3) Group services by custodio
      const grouped: Record<string, { total: number; monto: number }> = {};
      for (const s of servicios || []) {
        if (!s.id_custodio) continue;
        if (!grouped[s.id_custodio]) grouped[s.id_custodio] = { total: 0, monto: 0 };
        grouped[s.id_custodio].total += 1;
        grouped[s.id_custodio].monto += (Number(s.costo_custodio) || 0) + (Number(s.casetas) || 0);
      }

      const custodioIds = Object.keys(grouped);
      if (custodioIds.length === 0) return [];

      // 4) Fetch names
      const { data: perfiles } = await supabase
        .from('candidatos_custodios')
        .select('id, nombre')
        .in('id', custodioIds);

      const nombreMap: Record<string, string> = {};
      for (const p of perfiles || []) {
        nombreMap[p.id] = p.nombre;
      }

      // 5) Build preview list
      const result: OperativoPreview[] = custodioIds.map(id => ({
        id,
        nombre: nombreMap[id] || `Custodio ${id.slice(0, 8)}`,
        tipo: 'custodio' as const,
        totalServicios: grouped[id].total,
        montoEstimado: Math.round(grouped[id].monto * 100) / 100,
        yaGenerado: cortesSet.has(id),
      }));

      // Sort: pending first, then by name
      result.sort((a, b) => {
        if (a.yaGenerado !== b.yaGenerado) return a.yaGenerado ? 1 : -1;
        return a.nombre.localeCompare(b.nombre);
      });

      return result;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function GenerarCortesMasivosDialog({ open, onOpenChange, semanaInicio, semanaFin, weekLabel }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, errors: 0 });

  const { data: operativos = [], isLoading } = useOperativosConServicios(semanaInicio, semanaFin, open);
  const createMutation = useCreateCxPCorte();
  const queryClient = useQueryClient();

  const pendientes = useMemo(() => operativos.filter(o => !o.yaGenerado && o.totalServicios > 0), [operativos]);
  const yaGenerados = useMemo(() => operativos.filter(o => o.yaGenerado), [operativos]);
  const sinServicios = useMemo(() => operativos.filter(o => !o.yaGenerado && o.totalServicios === 0), [operativos]);

  const allPendientesSelected = pendientes.length > 0 && pendientes.every(o => selectedIds.has(o.id));

  const toggleAll = () => {
    if (allPendientesSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(pendientes.map(o => o.id)));
    }
  };

  const toggleOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const totalEstimado = useMemo(
    () => pendientes.filter(o => selectedIds.has(o.id)).reduce((s, o) => s + o.montoEstimado, 0),
    [pendientes, selectedIds]
  );

  const handleGenerate = async () => {
    const selected = pendientes.filter(o => selectedIds.has(o.id));
    if (selected.length === 0) return;

    setGenerating(true);
    setProgress({ current: 0, total: selected.length, errors: 0 });

    let errors = 0;
    for (let i = 0; i < selected.length; i++) {
      const op = selected[i];
      try {
        await createMutation.mutateAsync({
          tipo_operativo: op.tipo,
          operativo_nombre: op.nombre,
          operativo_id: op.id,
          semana_inicio: semanaInicio,
          semana_fin: semanaFin,
        });
      } catch {
        errors++;
      }
      setProgress({ current: i + 1, total: selected.length, errors });
    }

    setGenerating(false);
    queryClient.invalidateQueries({ queryKey: ['cxp-cortes-semanales'] });
    queryClient.invalidateQueries({ queryKey: ['operativos-con-servicios'] });
    
    const exitosos = selected.length - errors;
    toast.success(`${exitosos} corte${exitosos !== 1 ? 's' : ''} generado${exitosos !== 1 ? 's' : ''}${errors > 0 ? `, ${errors} error${errors !== 1 ? 'es' : ''}` : ''}`);
    
    setSelectedIds(new Set());
    if (errors === 0) onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={generating ? undefined : onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Generar Cortes Masivos
          </DialogTitle>
          <DialogDescription className="capitalize">{weekLabel}</DialogDescription>
        </DialogHeader>

        {/* Summary badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-xs">
            {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
          </Badge>
          {yaGenerados.length > 0 && (
            <Badge variant="secondary" className="text-xs">
              {yaGenerados.length} ya generado{yaGenerados.length !== 1 ? 's' : ''}
            </Badge>
          )}
          {sinServicios.length > 0 && (
            <Badge variant="outline" className="text-xs text-muted-foreground">
              {sinServicios.length} sin servicios
            </Badge>
          )}
        </div>

        {/* Progress bar during generation */}
        {generating && (
          <div className="space-y-2">
            <Progress value={(progress.current / progress.total) * 100} />
            <p className="text-xs text-muted-foreground text-center">
              Generando {progress.current}/{progress.total}...
              {progress.errors > 0 && <span className="text-destructive"> ({progress.errors} errores)</span>}
            </p>
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto border rounded-md min-h-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allPendientesSelected}
                    onCheckedChange={toggleAll}
                    disabled={generating || pendientes.length === 0}
                  />
                </TableHead>
                <TableHead>Operativo</TableHead>
                <TableHead className="text-center">Svcs</TableHead>
                <TableHead className="text-right">Estimado</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                  </TableCell>
                </TableRow>
              ) : operativos.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No se encontraron operativos con servicios finalizados en esta semana
                  </TableCell>
                </TableRow>
              ) : (
                operativos.map(op => (
                  <TableRow
                    key={op.id}
                    className={op.yaGenerado ? 'opacity-50' : undefined}
                  >
                    <TableCell>
                      {!op.yaGenerado && op.totalServicios > 0 ? (
                        <Checkbox
                          checked={selectedIds.has(op.id)}
                          onCheckedChange={() => toggleOne(op.id)}
                          disabled={generating}
                        />
                      ) : op.yaGenerado ? (
                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                    <TableCell className="font-medium text-sm">{op.nombre}</TableCell>
                    <TableCell className="text-center">{op.totalServicios}</TableCell>
                    <TableCell className="text-right font-semibold text-sm">{fmt(op.montoEstimado)}</TableCell>
                    <TableCell>
                      {op.yaGenerado ? (
                        <Badge variant="secondary" className="text-[10px]">Ya generado</Badge>
                      ) : op.totalServicios === 0 ? (
                        <Badge variant="outline" className="text-[10px]">Sin servicios</Badge>
                      ) : (
                        <Badge variant="outline" className="text-[10px] border-amber-500/50 text-amber-600 dark:text-amber-400">
                          Pendiente
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-sm">
            <span className="text-muted-foreground">Seleccionados:</span>{' '}
            <strong>{selectedIds.size}</strong> · {fmt(totalEstimado)}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={generating}>
              Cancelar
            </Button>
            <Button onClick={handleGenerate} disabled={generating || selectedIds.size === 0}>
              {generating ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Generando...
                </>
              ) : (
                `Generar ${selectedIds.size} Corte${selectedIds.size !== 1 ? 's' : ''}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
