import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Building2, DollarSign, FileCheck2 } from 'lucide-react';
import { format } from 'date-fns';
import { useProveedoresArmados } from '@/hooks/useProveedoresArmados';
import {
  useCxPProveedores,
  useCreateCxP,
  useUpdateCxP,
} from '../../hooks/useCxPProveedores';

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  borrador: { variant: 'outline', label: 'Borrador' },
  revision: { variant: 'default', label: 'En Revisión' },
  aprobado: { variant: 'secondary', label: 'Aprobado' },
  pagado: { variant: 'secondary', label: 'Pagado' },
  cancelado: { variant: 'destructive', label: 'Cancelado' },
};

export function CxPProveedoresTab() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    proveedor_id: '',
    periodo_inicio: '',
    periodo_fin: '',
    notas: '',
  });

  const { proveedores } = useProveedoresArmados();
  const { data: cxps = [], isLoading } = useCxPProveedores(filtroEstado);
  const createMutation = useCreateCxP();
  const updateMutation = useUpdateCxP();

  const handleCreate = async () => {
    if (!form.proveedor_id || !form.periodo_inicio || !form.periodo_fin) return;
    await createMutation.mutateAsync(form);
    setShowDialog(false);
    setForm({ proveedor_id: '', periodo_inicio: '', periodo_fin: '', notas: '' });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const totalPendiente = cxps.filter(c => ['borrador', 'revision', 'aprobado'].includes(c.estado)).reduce((s, c) => s + c.monto_total, 0);
  const totalPagado = cxps.filter(c => c.estado === 'pagado').reduce((s, c) => s + c.monto_total, 0);

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
            <div className="bg-primary/10 text-primary p-2 rounded-lg"><Building2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Estados de Cuenta</p>
              <p className="text-2xl font-bold">{cxps.length}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="borrador">Borrador</SelectItem>
            <SelectItem value="revision">En Revisión</SelectItem>
            <SelectItem value="aprobado">Aprobados</SelectItem>
            <SelectItem value="pagado">Pagados</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Estado de Cuenta
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Proveedor</TableHead>
                <TableHead>Periodo</TableHead>
                <TableHead className="text-center">Servicios</TableHead>
                <TableHead className="text-right">Monto Servicios</TableHead>
                <TableHead className="text-right">Extras</TableHead>
                <TableHead className="text-right">Deducciones</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Factura Prov.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : cxps.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Sin estados de cuenta</TableCell></TableRow>
              ) : (
                cxps.map(cxp => {
                  const badge = ESTADO_BADGE[cxp.estado] || ESTADO_BADGE.borrador;
                  return (
                    <TableRow key={cxp.id}>
                      <TableCell className="font-medium text-sm">{cxp.proveedor_nombre}</TableCell>
                      <TableCell className="text-xs">
                        {format(new Date(cxp.periodo_inicio), 'dd/MM/yy')} – {format(new Date(cxp.periodo_fin), 'dd/MM/yy')}
                      </TableCell>
                      <TableCell className="text-center">{cxp.total_servicios}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(cxp.monto_servicios)}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(cxp.monto_gastos_extra)}</TableCell>
                      <TableCell className="text-right text-sm text-destructive">{formatCurrency(cxp.monto_deducciones)}</TableCell>
                      <TableCell className="text-right text-sm font-bold">{formatCurrency(cxp.monto_total)}</TableCell>
                      <TableCell className="text-xs">{cxp.factura_proveedor || '—'}</TableCell>
                      <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                      <TableCell>
                        {cxp.estado === 'borrador' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => updateMutation.mutate({ id: cxp.id, estado: 'revision' })}>
                            Enviar Revisión
                          </Button>
                        )}
                        {cxp.estado === 'revision' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => updateMutation.mutate({ id: cxp.id, estado: 'aprobado', fecha_aprobacion: new Date().toISOString() })}>
                            Aprobar
                          </Button>
                        )}
                        {cxp.estado === 'aprobado' && (
                          <Button size="sm" variant="default" className="h-7 text-xs"
                            onClick={() => updateMutation.mutate({ id: cxp.id, estado: 'pagado', fecha_pago: format(new Date(), 'yyyy-MM-dd') })}>
                            Marcar Pagado
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Nuevo Estado de Cuenta — Proveedor</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Proveedor *</Label>
              <Select value={form.proveedor_id} onValueChange={v => setForm(f => ({ ...f, proveedor_id: v }))}>
                <SelectTrigger><SelectValue placeholder="Seleccionar proveedor" /></SelectTrigger>
                <SelectContent>
                  {proveedores.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nombre_empresa}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Periodo Inicio *</Label>
                <Input type="date" value={form.periodo_inicio} onChange={e => setForm(f => ({ ...f, periodo_inicio: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Periodo Fin *</Label>
                <Input type="date" value={form.periodo_fin} onChange={e => setForm(f => ({ ...f, periodo_fin: e.target.value }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
            </div>
            <p className="text-xs text-muted-foreground">
              El sistema calculará automáticamente los servicios completados y montos del proveedor en el periodo seleccionado.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.proveedor_id || !form.periodo_inicio || !form.periodo_fin || createMutation.isPending}>
              Generar Estado de Cuenta
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
