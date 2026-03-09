import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, DollarSign, FileCheck2, ClipboardList, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import {
  useCxPCortesSemanales,
  useUpdateCxPCorte,
  useDeleteCxPCorte,
  ESTADO_CORTE_LABELS,
} from '../../../hooks/useCxPCortesSemanales';
import { GenerarCorteDialog } from './GenerarCorteDialog';
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

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function CortesPanel() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const { data: cortes = [], isLoading } = useCxPCortesSemanales(filtroEstado);
  const updateMutation = useUpdateCxPCorte();
  const deleteMutation = useDeleteCxPCorte();

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

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 text-warning p-2 rounded-lg"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Por Pagar</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPendiente)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-2 rounded-lg"><FileCheck2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Pagado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPagado)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg"><ClipboardList className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Cortes</p>
              <p className="text-2xl font-bold">{cortes.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="revision_ops">Revisión Ops</SelectItem>
            <SelectItem value="aprobado_finanzas">Aprobado Finanzas</SelectItem>
            <SelectItem value="dispersado">Dispersado</SelectItem>
            <SelectItem value="pagado">Pagado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Generar Corte Semanal
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Operativo</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Semana</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-right">Base</TableHead>
                <TableHead className="text-right">Estadías</TableHead>
                <TableHead className="text-right">Casetas</TableHead>
                <TableHead className="text-right">Hoteles</TableHead>
                <TableHead className="text-right">Apoyos</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : cortes.length === 0 ? (
                <TableRow><TableCell colSpan={12} className="text-center py-8 text-muted-foreground">Sin cortes semanales</TableCell></TableRow>
              ) : (
                cortes.map(c => {
                  const badge = ESTADO_CORTE_LABELS[c.estado] || ESTADO_CORTE_LABELS.borrador;
                  return (
                    <TableRow key={c.id}>
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
                      <TableCell className="text-right text-sm">{formatCurrency(c.monto_servicios)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(c.monto_estadias)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(c.monto_casetas)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(c.monto_hoteles)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(c.monto_apoyos_extra)}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{formatCurrency(c.monto_total)}</TableCell>
                      <TableCell>
                        <Badge variant={badge.color as any}>{badge.label}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {c.estado === 'borrador' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => handleTransition(c.id, 'revision_ops')}>
                                Enviar a Ops
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10" disabled={deleteMutation.isPending}>
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>¿Eliminar corte borrador?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Se eliminará el corte de "{c.operativo_nombre}" y todos sus detalles. Esta acción no se puede deshacer.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      onClick={() => deleteMutation.mutate(c.id)}
                                    >
                                      Eliminar
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </>
                          )}
                          {c.estado === 'revision_ops' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => handleTransition(c.id, 'aprobado_finanzas')}>
                              Aprobar
                            </Button>
                          )}
                          {c.estado === 'aprobado_finanzas' && (
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => handleTransition(c.id, 'dispersado')}>
                              Dispersar
                            </Button>
                          )}
                          {c.estado === 'dispersado' && (
                            <Button size="sm" variant="default" className="h-7 text-xs"
                              onClick={() => handleTransition(c.id, 'pagado')}>
                              Confirmar Pago
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
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
