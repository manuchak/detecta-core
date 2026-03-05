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
import { Plus, AlertCircle, CheckCircle2, XCircle, Banknote } from 'lucide-react';
import { format } from 'date-fns';
import {
  useApoyosExtraordinarios,
  useCreateApoyo,
  useAprobarApoyo,
  useRechazarApoyo,
  useRegistrarPagoApoyo,
  TIPOS_APOYO,
} from '../../../hooks/useApoyosExtraordinarios';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

const URGENCIA_COLORS: Record<string, string> = {
  baja: 'outline',
  normal: 'secondary',
  alta: 'default',
  critica: 'destructive',
};

const ESTADO_CONFIG: Record<string, { label: string; variant: string; icon: any }> = {
  pendiente: { label: 'Pendiente', variant: 'outline', icon: AlertCircle },
  aprobado: { label: 'Aprobado', variant: 'default', icon: CheckCircle2 },
  rechazado: { label: 'Rechazado', variant: 'destructive', icon: XCircle },
  pagado: { label: 'Pagado', variant: 'secondary', icon: Banknote },
  cancelado: { label: 'Cancelado', variant: 'destructive', icon: XCircle },
};

export function ApoyosPanel() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showCreate, setShowCreate] = useState(false);
  const [approveId, setApproveId] = useState<string | null>(null);
  const [approveAmount, setApproveAmount] = useState('');
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [payId, setPayId] = useState<string | null>(null);
  const [payMethod, setPayMethod] = useState('');
  const [payRef, setPayRef] = useState('');

  const { data: apoyos = [], isLoading } = useApoyosExtraordinarios({ estado: filtroEstado });
  const aprobarMutation = useAprobarApoyo();
  const rechazarMutation = useRechazarApoyo();
  const pagoMutation = useRegistrarPagoApoyo();

  const totalPendiente = apoyos.filter(a => a.estado === 'pendiente').reduce((s, a) => s + a.monto_solicitado, 0);
  const totalAprobado = apoyos.filter(a => a.estado === 'aprobado').reduce((s, a) => s + (a.monto_aprobado || 0), 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 text-warning p-2 rounded-lg"><AlertCircle className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold">{formatCurrency(totalPendiente)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-success/10 text-success p-2 rounded-lg"><CheckCircle2 className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Aprobados por Dispersar</p>
              <p className="text-2xl font-bold">{formatCurrency(totalAprobado)}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg"><Banknote className="h-5 w-5" /></div>
            <div>
              <p className="text-sm text-muted-foreground">Total Solicitudes</p>
              <p className="text-2xl font-bold">{apoyos.length}</p>
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
            <SelectItem value="pagado">Pagados</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowCreate(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Solicitud
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Servicio</TableHead>
                <TableHead>Custodio</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Urgencia</TableHead>
                <TableHead>Motivo</TableHead>
                <TableHead className="text-right">Solicitado</TableHead>
                <TableHead className="text-right">Aprobado</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : apoyos.length === 0 ? (
                <TableRow><TableCell colSpan={10} className="text-center py-8 text-muted-foreground">Sin solicitudes</TableCell></TableRow>
              ) : (
                apoyos.map(a => {
                  const ec = ESTADO_CONFIG[a.estado] || ESTADO_CONFIG.pendiente;
                  return (
                    <TableRow key={a.id}>
                      <TableCell className="text-xs font-mono">{a.id_servicio || '—'}</TableCell>
                      <TableCell className="text-sm">{a.custodio_nombre || '—'}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs">
                          {TIPOS_APOYO.find(t => t.value === a.tipo_apoyo)?.label || a.tipo_apoyo}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={URGENCIA_COLORS[a.urgencia] as any} className="text-xs capitalize">
                          {a.urgencia}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{a.motivo}</TableCell>
                      <TableCell className="text-right text-sm">{formatCurrency(a.monto_solicitado)}</TableCell>
                      <TableCell className="text-right text-sm">{a.monto_aprobado ? formatCurrency(a.monto_aprobado) : '—'}</TableCell>
                      <TableCell><Badge variant={ec.variant as any}>{ec.label}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(a.fecha_solicitud), 'dd/MM/yy HH:mm')}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          {a.estado === 'pendiente' && (
                            <>
                              <Button size="sm" variant="outline" className="h-7 text-xs"
                                onClick={() => { setApproveId(a.id); setApproveAmount(String(a.monto_solicitado)); }}>
                                Aprobar
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive"
                                onClick={() => { setRejectId(a.id); setRejectReason(''); }}>
                                Rechazar
                              </Button>
                            </>
                          )}
                          {a.estado === 'aprobado' && (
                            <Button size="sm" variant="default" className="h-7 text-xs"
                              onClick={() => { setPayId(a.id); setPayMethod(''); setPayRef(''); }}>
                              Pagar
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

      {/* Approve Dialog */}
      <Dialog open={!!approveId} onOpenChange={() => setApproveId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Aprobar Solicitud</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Monto Aprobado</Label>
              <Input type="number" value={approveAmount} onChange={e => setApproveAmount(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setApproveId(null)}>Cancelar</Button>
            <Button onClick={() => { 
              if (approveId) aprobarMutation.mutate({ id: approveId, monto_aprobado: Number(approveAmount) }); 
              setApproveId(null); 
            }}>Aprobar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={!!rejectId} onOpenChange={() => setRejectId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Rechazar Solicitud</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Motivo de Rechazo</Label>
              <Textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectId(null)}>Cancelar</Button>
            <Button variant="destructive" onClick={() => { 
              if (rejectId) rechazarMutation.mutate({ id: rejectId, motivo_rechazo: rejectReason }); 
              setRejectId(null); 
            }}>Rechazar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Pay Dialog */}
      <Dialog open={!!payId} onOpenChange={() => setPayId(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar Pago</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Método de Pago</Label>
              <Input value={payMethod} onChange={e => setPayMethod(e.target.value)} placeholder="Transferencia, Efectivo..." />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Referencia</Label>
              <Input value={payRef} onChange={e => setPayRef(e.target.value)} placeholder="No. de referencia" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPayId(null)}>Cancelar</Button>
            <Button onClick={() => { 
              if (payId) pagoMutation.mutate({ id: payId, metodo_pago: payMethod, referencia_pago: payRef }); 
              setPayId(null); 
            }}>Confirmar Pago</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <CreateApoyoDialog open={showCreate} onOpenChange={setShowCreate} />
    </div>
  );
}

function CreateApoyoDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({
    tipo_apoyo: 'regreso_base',
    motivo: '',
    monto_solicitado: '',
    urgencia: 'normal' as 'baja' | 'normal' | 'alta' | 'critica',
    id_servicio: '',
    custodio_nombre: '',
    cliente_nombre: '',
    notas: '',
  });
  const createMutation = useCreateApoyo();

  const handleSubmit = async () => {
    if (!form.motivo || !form.monto_solicitado) return;
    await createMutation.mutateAsync({
      tipo_apoyo: form.tipo_apoyo,
      motivo: form.motivo,
      monto_solicitado: Number(form.monto_solicitado),
      urgencia: form.urgencia,
      id_servicio: form.id_servicio || undefined,
      custodio_nombre: form.custodio_nombre || undefined,
      cliente_nombre: form.cliente_nombre || undefined,
      notas: form.notas || undefined,
    });
    onOpenChange(false);
    setForm({ tipo_apoyo: 'regreso_base', motivo: '', monto_solicitado: '', urgencia: 'normal', id_servicio: '', custodio_nombre: '', cliente_nombre: '', notas: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Nueva Solicitud de Apoyo</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Tipo de Apoyo *</Label>
              <Select value={form.tipo_apoyo} onValueChange={v => setForm(f => ({ ...f, tipo_apoyo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TIPOS_APOYO.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Urgencia</Label>
              <Select value={form.urgencia} onValueChange={v => setForm(f => ({ ...f, urgencia: v as any }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="baja">Baja</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="alta">Alta</SelectItem>
                  <SelectItem value="critica">Crítica</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Folio Servicio</Label>
              <Input value={form.id_servicio} onChange={e => setForm(f => ({ ...f, id_servicio: e.target.value }))} placeholder="TEOVTEL-XXX" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Monto Solicitado *</Label>
              <Input type="number" value={form.monto_solicitado} onChange={e => setForm(f => ({ ...f, monto_solicitado: e.target.value }))} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Custodio</Label>
              <Input value={form.custodio_nombre} onChange={e => setForm(f => ({ ...f, custodio_nombre: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Input value={form.cliente_nombre} onChange={e => setForm(f => ({ ...f, cliente_nombre: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Motivo *</Label>
            <Textarea value={form.motivo} onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))} rows={2} placeholder="Describe el motivo del apoyo..." />
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.motivo || !form.monto_solicitado || createMutation.isPending}>
            Enviar Solicitud
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
