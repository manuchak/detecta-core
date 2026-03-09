import React, { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, DollarSign, FileCheck2, ClipboardList, ChevronRight, ChevronLeft, HandCoins, Users, CheckCircle2, ArrowRightCircle, Trash2 } from 'lucide-react';
import { format, startOfWeek, endOfWeek, subWeeks, addWeeks } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  useCxPCortesSemanales,
  useCxPCorteDetalle,
  useUpdateCxPCorte,
  useDeleteCxPCorte,
  ESTADO_CORTE_LABELS,
} from '../../hooks/useCxPCortesSemanales';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { GenerarCorteDialog } from './CortesSemanales/GenerarCorteDialog';
import { GenerarCortesMasivosDialog } from './CortesSemanales/GenerarCortesMasivosDialog';
import { ApoyosPanel } from './ApoyosExtraordinarios/ApoyosPanel';
import { toast } from 'sonner';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

type WeekStartDay = 0 | 1;

// State machine for allowed transitions
const NEXT_STATE: Record<string, string> = {
  borrador: 'revision_ops',
  revision_ops: 'aprobado_finanzas',
  aprobado_finanzas: 'dispersado',
  dispersado: 'pagado',
};

const TRANSITION_LABELS: Record<string, string> = {
  revision_ops: 'Enviar a Ops',
  aprobado_finanzas: 'Aprobar',
  dispersado: 'Dispersar',
  pagado: 'Marcar Pagado',
};

export function CxPOperativoTab() {
  const [weekStartsOn, setWeekStartsOn] = useState<WeekStartDay>(1);
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() =>
    startOfWeek(subWeeks(new Date(), 1), { weekStartsOn: 1 })
  );

  const weekStart = useMemo(
    () => startOfWeek(currentWeekStart, { weekStartsOn }),
    [currentWeekStart, weekStartsOn]
  );
  const weekEnd = useMemo(
    () => endOfWeek(currentWeekStart, { weekStartsOn }),
    [currentWeekStart, weekStartsOn]
  );

  const semanaInicio = format(weekStart, 'yyyy-MM-dd');
  const semanaFin = format(weekEnd, 'yyyy-MM-dd');

  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [showBulkDialog, setShowBulkDialog] = useState(false);
  const [showApoyos, setShowApoyos] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Batch selection
  const [selectedCorteIds, setSelectedCorteIds] = useState<Set<string>>(new Set());

  const { data: cortes = [], isLoading } = useCxPCortesSemanales(filtroEstado, semanaInicio, semanaFin);
  const updateMutation = useUpdateCxPCorte();

  // Pipeline stats
  const pipeline = useMemo(() => {
    const stats = { borrador: 0, revision_ops: 0, aprobado_finanzas: 0, dispersado: 0, pagado: 0 };
    for (const c of cortes) {
      if (c.estado in stats) stats[c.estado as keyof typeof stats]++;
    }
    return stats;
  }, [cortes]);

  const totalPendiente = cortes
    .filter(c => ['borrador', 'revision_ops', 'aprobado_finanzas'].includes(c.estado))
    .reduce((s, c) => s + c.monto_total, 0);
  const totalPagado = cortes
    .filter(c => c.estado === 'pagado')
    .reduce((s, c) => s + c.monto_total, 0);
  const nominaTotal = cortes.reduce((s, c) => s + c.monto_total, 0);

  const handleTransition = (id: string, estado: string) => {
    const extras: any = {};
    if (estado === 'aprobado_finanzas') extras.fecha_aprobacion = new Date().toISOString();
    if (estado === 'pagado') extras.fecha_pago = format(new Date(), 'yyyy-MM-dd');
    updateMutation.mutate({ id, estado, ...extras });
  };

  // Batch transitions
  const selectedCortes = useMemo(
    () => cortes.filter(c => selectedCorteIds.has(c.id)),
    [cortes, selectedCorteIds]
  );

  const batchNextState = useMemo(() => {
    if (selectedCortes.length === 0) return null;
    const states = new Set(selectedCortes.map(c => c.estado));
    if (states.size !== 1) return null; // mixed states
    const current = [...states][0];
    return NEXT_STATE[current] || null;
  }, [selectedCortes]);

  const handleBatchTransition = async () => {
    if (!batchNextState || selectedCortes.length === 0) return;
    const extras: any = {};
    if (batchNextState === 'aprobado_finanzas') extras.fecha_aprobacion = new Date().toISOString();
    if (batchNextState === 'pagado') extras.fecha_pago = format(new Date(), 'yyyy-MM-dd');

    let errors = 0;
    for (const c of selectedCortes) {
      try {
        await updateMutation.mutateAsync({ id: c.id, estado: batchNextState, ...extras });
      } catch { errors++; }
    }
    const ok = selectedCortes.length - errors;
    toast.success(`${ok} corte${ok !== 1 ? 's' : ''} actualizado${ok !== 1 ? 's' : ''}`);
    setSelectedCorteIds(new Set());
  };

  const toggleCorteSelection = (id: string) => {
    const next = new Set(selectedCorteIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedCorteIds(next);
  };

  const allSelected = cortes.length > 0 && cortes.every(c => selectedCorteIds.has(c.id));
  const toggleAllCortes = () => {
    if (allSelected) setSelectedCorteIds(new Set());
    else setSelectedCorteIds(new Set(cortes.map(c => c.id)));
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentWeekStart(prev =>
      direction === 'prev' ? subWeeks(prev, 1) : addWeeks(prev, 1)
    );
    setSelectedCorteIds(new Set());
  };

  const toggleCycle = () => {
    setWeekStartsOn(prev => (prev === 1 ? 0 : 1));
  };

  const weekLabel = useMemo(() => {
    const startDay = format(weekStart, 'EEE dd/MMM', { locale: es });
    const endDay = format(weekEnd, 'EEE dd/MMM yyyy', { locale: es });
    return `${startDay} – ${endDay}`;
  }, [weekStart, weekEnd]);

  if (showApoyos) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setShowApoyos(false)} className="text-xs">
          ← Volver a Cortes
        </Button>
        <ApoyosPanel />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Week Navigator */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/20 px-3 py-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek('prev')}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[260px] text-center capitalize">
            {weekLabel}
          </span>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => navigateWeek('next')}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div
          className="inline-flex rounded-md border border-border/50 bg-muted/30 p-0.5 cursor-pointer select-none"
          onClick={toggleCycle}
        >
          <span className={cn('px-2.5 py-1 text-xs font-medium rounded transition-all', weekStartsOn === 1 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>L–D</span>
          <span className={cn('px-2.5 py-1 text-xs font-medium rounded transition-all', weekStartsOn === 0 ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground')}>D–S</span>
        </div>
      </div>

      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
              <DollarSign className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Nómina Semanal</p>
              <p className="text-lg font-bold">{formatCurrency(nominaTotal)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Por Pagar</p>
              <p className="text-lg font-bold">{formatCurrency(totalPendiente)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 p-1.5 rounded-lg">
              <FileCheck2 className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Pagado</p>
              <p className="text-lg font-bold">{formatCurrency(totalPagado)}</p>
            </div>
          </div>
        </Card>
        {/* Pipeline mini */}
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
              <ArrowRightCircle className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Pipeline</p>
              <div className="flex gap-1 items-center">
                {[
                  { k: 'borrador', label: 'B' },
                  { k: 'revision_ops', label: 'R' },
                  { k: 'aprobado_finanzas', label: 'A' },
                  { k: 'dispersado', label: 'D' },
                  { k: 'pagado', label: 'P' },
                ].map(s => (
                  <span key={s.k} className="text-[10px] font-medium text-muted-foreground" title={s.k}>
                    {pipeline[s.k as keyof typeof pipeline]}{s.label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </Card>
        <Card className="p-3 cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => setShowApoyos(true)}>
          <div className="flex items-center gap-2">
            <div className="bg-violet-500/10 text-violet-600 dark:text-violet-400 p-1.5 rounded-lg">
              <HandCoins className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Apoyos Extra</p>
              <p className="text-xs text-primary font-medium">Ver solicitudes →</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Batch Actions Bar */}
      {selectedCorteIds.size > 0 && (
        <Card className="p-3 border-primary/20 bg-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">
                {selectedCorteIds.size} corte{selectedCorteIds.size !== 1 ? 's' : ''} seleccionado{selectedCorteIds.size !== 1 ? 's' : ''}
              </span>
              {batchNextState && (
                <Badge variant="outline" className="text-xs">
                  → {TRANSITION_LABELS[batchNextState] || batchNextState}
                </Badge>
              )}
              {!batchNextState && selectedCorteIds.size > 0 && (
                <Badge variant="outline" className="text-xs text-amber-600 dark:text-amber-400">
                  Estados mixtos — selecciona cortes del mismo estado
                </Badge>
              )}
            </div>
            <div className="flex gap-2">
              {batchNextState && (
                <Button
                  size="sm"
                  onClick={handleBatchTransition}
                  disabled={updateMutation.isPending}
                >
                  {TRANSITION_LABELS[batchNextState]} ({selectedCorteIds.size})
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedCorteIds(new Set())}
              >
                Limpiar
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filters & Actions */}
      <div className="flex items-center justify-between">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los estados</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="revision_ops">Revisión Ops</SelectItem>
            <SelectItem value="aprobado_finanzas">Aprobado Finanzas</SelectItem>
            <SelectItem value="dispersado">Dispersado</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
          </SelectContent>
        </Select>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Corte Individual
          </Button>
          <Button onClick={() => setShowBulkDialog(true)}>
            <Users className="h-4 w-4 mr-2" />
            Generar Cortes Semana
          </Button>
        </div>
      </div>

      {/* Table with checkboxes and expandable rows */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <Checkbox
                    checked={allSelected}
                    onCheckedChange={toggleAllCortes}
                    disabled={cortes.length === 0}
                  />
                </TableHead>
                <TableHead className="w-8" />
                <TableHead>Operativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Semana</TableHead>
                <TableHead className="text-center">Svcs</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : cortes.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Sin cortes en esta semana</TableCell></TableRow>
              ) : (
                cortes.map(c => {
                  const badge = ESTADO_CORTE_LABELS[c.estado] || ESTADO_CORTE_LABELS.borrador;
                  const isExpanded = expandedId === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <TableRow className="cursor-pointer hover:bg-muted/50">
                        <TableCell className="w-10" onClick={e => e.stopPropagation()}>
                          <Checkbox
                            checked={selectedCorteIds.has(c.id)}
                            onCheckedChange={() => toggleCorteSelection(c.id)}
                          />
                        </TableCell>
                        <TableCell className="w-8 px-2" onClick={() => setExpandedId(isExpanded ? null : c.id)}>
                          <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
                        </TableCell>
                        <TableCell className="font-medium text-sm" onClick={() => setExpandedId(isExpanded ? null : c.id)}>{c.operativo_nombre}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-xs">
                            {c.tipo_operativo === 'custodio' ? 'Custodio' : 'Armado Int.'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(c.semana_inicio), 'dd/MM')} – {format(new Date(c.semana_fin), 'dd/MM/yy')}
                        </TableCell>
                        <TableCell className="text-center">{c.total_servicios}</TableCell>
                        <TableCell className="text-right font-bold text-sm">{formatCurrency(c.monto_total)}</TableCell>
                        <TableCell><Badge variant={badge.color as any}>{badge.label}</Badge></TableCell>
                        <TableCell>
                          <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                            {c.estado === 'borrador' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleTransition(c.id, 'revision_ops')}>Enviar Ops</Button>
                            )}
                            {c.estado === 'revision_ops' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleTransition(c.id, 'aprobado_finanzas')}>Aprobar</Button>
                            )}
                            {c.estado === 'aprobado_finanzas' && (
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleTransition(c.id, 'dispersado')}>Dispersar</Button>
                            )}
                            {c.estado === 'dispersado' && (
                              <Button size="sm" variant="default" className="h-7 text-xs"
                                onClick={() => handleTransition(c.id, 'pagado')}>Pagar</Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                      {isExpanded && (
                        <tr>
                          <td colSpan={9} className="p-0">
                            <CorteDetalleInline corteId={c.id} corte={c} />
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <GenerarCorteDialog open={showDialog} onOpenChange={setShowDialog} weekStartsOn={weekStartsOn} />
      <GenerarCortesMasivosDialog
        open={showBulkDialog}
        onOpenChange={setShowBulkDialog}
        semanaInicio={semanaInicio}
        semanaFin={semanaFin}
        weekLabel={weekLabel}
      />
    </div>
  );
}

function CorteDetalleInline({ corteId, corte }: { corteId: string; corte: any }) {
  const { data: detalle = [], isLoading } = useCxPCorteDetalle(corteId);

  const conceptoLabels: Record<string, string> = {
    servicio: 'Servicio Base',
    estadia: 'Estadía',
    caseta: 'Caseta',
    hotel: 'Hotel/Pernocta',
    apoyo_extraordinario: 'Apoyo Extra',
    deduccion: 'Deducción',
  };

  return (
    <div className="bg-muted/20 border-t px-6 py-3 space-y-2">
      <div className="grid grid-cols-5 gap-2">
        {[
          { label: 'Servicios', value: corte.monto_servicios },
          { label: 'Estadías', value: corte.monto_estadias },
          { label: 'Casetas', value: corte.monto_casetas },
          { label: 'Hoteles', value: corte.monto_hoteles },
          { label: 'Apoyos', value: corte.monto_apoyos_extra },
        ].map(item => (
          <div key={item.label} className="text-center p-2 rounded-lg bg-background/60 border border-border/30">
            <p className="text-[10px] text-muted-foreground">{item.label}</p>
            <p className="text-sm font-semibold">{formatCurrency(item.value)}</p>
          </div>
        ))}
      </div>

      {isLoading ? (
        <p className="text-xs text-muted-foreground py-2">Cargando detalle...</p>
      ) : detalle.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Sin líneas de detalle.</p>
      ) : (
        <div className="max-h-[200px] overflow-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b">
                <th className="text-left py-1 font-medium text-muted-foreground">Concepto</th>
                <th className="text-left py-1 font-medium text-muted-foreground">Descripción</th>
                <th className="text-right py-1 font-medium text-muted-foreground">Monto</th>
              </tr>
            </thead>
            <tbody>
              {detalle.map(d => (
                <tr key={d.id} className="border-b border-border/20">
                  <td className="py-1">
                    <Badge variant="outline" className="text-[10px]">
                      {conceptoLabels[d.concepto] || d.concepto}
                    </Badge>
                  </td>
                  <td className="py-1 text-muted-foreground">{d.descripcion || '—'}</td>
                  <td className="py-1 text-right font-medium">{formatCurrency(d.monto)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
