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
import { Switch } from '@/components/ui/switch';
import { Plus, DollarSign, CheckCircle2, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  useGastosExtraordinarios,
  useCreateGastoExtraordinario,
  useUpdateGastoExtraordinario,
  TIPOS_GASTO,
  type CreateGastoData,
} from '../../hooks/useGastosExtraordinarios';

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  pendiente: { variant: 'default', label: 'Pendiente' },
  aprobado: { variant: 'secondary', label: 'Aprobado' },
  rechazado: { variant: 'destructive', label: 'Rechazado' },
  reembolsado: { variant: 'outline', label: 'Reembolsado' },
};

export function GastosExtraTab() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<CreateGastoData>({
    tipo_gasto: 'caseta_extra',
    descripcion: '',
    monto: 0,
    cobrable_cliente: false,
    pagable_custodio: false,
  });

  const { data: gastos = [], isLoading } = useGastosExtraordinarios({ estado: filtroEstado });
  const createMutation = useCreateGastoExtraordinario();
  const updateMutation = useUpdateGastoExtraordinario();

  const handleCreate = async () => {
    if (!form.descripcion || form.monto <= 0) return;
    await createMutation.mutateAsync(form);
    setShowDialog(false);
    setForm({ tipo_gasto: 'caseta_extra', descripcion: '', monto: 0, cobrable_cliente: false, pagable_custodio: false });
  };

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const totalPendiente = gastos.filter(g => g.estado_reembolso === 'pendiente').reduce((s, g) => s + g.monto, 0);
  const totalAprobado = gastos.filter(g => g.estado_reembolso === 'aprobado').reduce((s, g) => s + g.monto, 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 text-warning p-2 rounded-lg"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Pendiente Aprobación</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPendiente)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-2 rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Aprobado</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAprobado)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg"><DollarSign className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Registros</p>
              <p className="text-2xl font-bold">{gastos.length}</p>
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
            <SelectItem value="pendiente">Pendientes</SelectItem>
            <SelectItem value="aprobado">Aprobados</SelectItem>
            <SelectItem value="rechazado">Rechazados</SelectItem>
            <SelectItem value="reembolsado">Reembolsados</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nuevo Gasto
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Cobrable</TableHead>
                <TableHead>Pagable Custodio</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : gastos.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Sin gastos extraordinarios</TableCell></TableRow>
              ) : (
                gastos.map(g => {
                  const badge = ESTADO_BADGE[g.estado_reembolso] || ESTADO_BADGE.pendiente;
                  const tipoLabel = TIPOS_GASTO.find(t => t.value === g.tipo_gasto)?.label || g.tipo_gasto;
                  return (
                    <TableRow key={g.id}>
                      <TableCell className="text-xs">{format(new Date(g.created_at), 'dd/MM/yy')}</TableCell>
                      <TableCell className="text-xs">{tipoLabel}</TableCell>
                      <TableCell className="text-xs max-w-[180px] truncate">{g.descripcion}</TableCell>
                      <TableCell className="text-xs">{g.cliente || '—'}</TableCell>
                      <TableCell className="text-right text-sm font-medium">{formatCurrency(g.monto)}</TableCell>
                      <TableCell>{g.cobrable_cliente ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                      <TableCell>{g.pagable_custodio ? <CheckCircle2 className="h-4 w-4 text-success" /> : <XCircle className="h-4 w-4 text-muted-foreground" />}</TableCell>
                      <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                      <TableCell>
                        {g.estado_reembolso === 'pendiente' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => updateMutation.mutate({ id: g.id, estado_reembolso: 'aprobado', fecha_aprobacion: new Date().toISOString() })}>
                              Aprobar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                              onClick={() => updateMutation.mutate({ id: g.id, estado_reembolso: 'rechazado' })}>
                              Rechazar
                            </Button>
                          </div>
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
            <DialogTitle>Registrar Gasto Extraordinario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Gasto</Label>
                <Select value={form.tipo_gasto} onValueChange={v => setForm(f => ({ ...f, tipo_gasto: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_GASTO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto *</Label>
                <Input type="number" step="0.01" value={form.monto || ''} onChange={e => setForm(f => ({ ...f, monto: Number(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={2} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente</Label>
                <Input value={form.cliente || ''} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>ID Servicio</Label>
                <Input type="number" value={form.servicio_custodia_id || ''} onChange={e => setForm(f => ({ ...f, servicio_custodia_id: Number(e.target.value) || undefined }))} />
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={form.cobrable_cliente} onCheckedChange={v => setForm(f => ({ ...f, cobrable_cliente: v }))} />
                <Label>Cobrable al Cliente</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={form.pagable_custodio} onCheckedChange={v => setForm(f => ({ ...f, pagable_custodio: v }))} />
                <Label>Pagable al Custodio</Label>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.descripcion || form.monto <= 0 || createMutation.isPending}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
