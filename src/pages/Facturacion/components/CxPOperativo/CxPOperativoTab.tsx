import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Plus, DollarSign, FileCheck2, ClipboardList, ChevronRight, HandCoins } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  useCxPCortesSemanales,
  useCxPCorteDetalle,
  useUpdateCxPCorte,
  ESTADO_CORTE_LABELS,
} from '../../hooks/useCxPCortesSemanales';
import {
  useApoyosExtraordinarios,
} from '../../hooks/useApoyosExtraordinarios';
import { GenerarCorteDialog } from './CortesSemanales/GenerarCorteDialog';
import { ApoyosPanel } from './ApoyosExtraordinarios/ApoyosPanel';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function CxPOperativoTab() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [showApoyos, setShowApoyos] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const { data: cortes = [], isLoading } = useCxPCortesSemanales(filtroEstado);
  const updateMutation = useUpdateCxPCorte();

  const totalPendiente = cortes
    .filter(c => ['borrador', 'revision_ops', 'aprobado_finanzas'].includes(c.estado))
    .reduce((s, c) => s + c.monto_total, 0);
  const totalPagado = cortes
    .filter(c => c.estado === 'pagado')
    .reduce((s, c) => s + c.monto_total, 0);

  const handleTransition = (id: string, estado: string) => {
    const extras: any = {};
    if (estado === 'aprobado_finanzas') extras.fecha_aprobacion = new Date().toISOString();
    if (estado === 'pagado') extras.fecha_pago = format(new Date(), 'yyyy-MM-dd');
    updateMutation.mutate({ id, estado, ...extras });
  };

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
      {/* Pipeline KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-amber-500/10 text-amber-600 dark:text-amber-400 p-1.5 rounded-lg">
              <DollarSign className="h-4 w-4" />
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
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
              <ClipboardList className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">Cortes</p>
              <p className="text-lg font-bold">{cortes.length}</p>
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
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generar Corte
        </Button>
      </div>

      {/* Table with expandable rows */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
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
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : cortes.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sin cortes semanales</TableCell></TableRow>
              ) : (
                cortes.map(c => {
                  const badge = ESTADO_CORTE_LABELS[c.estado] || ESTADO_CORTE_LABELS.borrador;
                  const isExpanded = expandedId === c.id;
                  return (
                    <React.Fragment key={c.id}>
                      <TableRow 
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => setExpandedId(isExpanded ? null : c.id)}
                      >
                        <TableCell className="w-8 px-2">
                          <ChevronRight className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-90')} />
                        </TableCell>
                        <TableCell className="font-medium text-sm">{c.operativo_nombre}</TableCell>
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
                          <td colSpan={8} className="p-0">
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

      <GenerarCorteDialog open={showDialog} onOpenChange={setShowDialog} />
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
      {/* Summary cards */}
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

      {/* Detail lines */}
      {isLoading ? (
        <p className="text-xs text-muted-foreground py-2">Cargando detalle...</p>
      ) : detalle.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Sin líneas de detalle (corte sin operativo ID).</p>
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
