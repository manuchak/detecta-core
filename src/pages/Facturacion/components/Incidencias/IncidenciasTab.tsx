import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, AlertTriangle, CheckCircle2, Clock, Search } from 'lucide-react';
import { format } from 'date-fns';
import {
  useIncidenciasFacturacion,
  useCreateIncidencia,
  useUpdateIncidencia,
  TIPOS_INCIDENCIA,
  type CreateIncidenciaData,
  type IncidenciaFacturacion,
} from '../../hooks/useIncidenciasFacturacion';

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  abierta: { variant: 'destructive', label: 'Abierta' },
  en_revision: { variant: 'default', label: 'En Revisión' },
  resuelta: { variant: 'secondary', label: 'Resuelta' },
  cerrada: { variant: 'outline', label: 'Cerrada' },
};

const PRIORIDAD_COLOR: Record<string, string> = {
  baja: 'bg-muted text-muted-foreground',
  media: 'bg-warning/10 text-warning',
  alta: 'bg-orange-500/10 text-orange-600',
  critica: 'bg-destructive/10 text-destructive font-bold',
};

export function IncidenciasTab() {
  const [filtroEstado, setFiltroEstado] = useState('todas');
  const [showDialog, setShowDialog] = useState(false);
  const [selectedIncidencia, setSelectedIncidencia] = useState<IncidenciaFacturacion | null>(null);
  const [form, setForm] = useState<CreateIncidenciaData>({
    cliente: '',
    tipo_incidencia: 'discrepancia_monto',
    descripcion: '',
    prioridad: 'media',
  });

  const { data: incidencias = [], isLoading } = useIncidenciasFacturacion(filtroEstado);
  const createMutation = useCreateIncidencia();
  const updateMutation = useUpdateIncidencia();

  const handleCreate = async () => {
    if (!form.cliente || !form.descripcion) return;
    await createMutation.mutateAsync(form);
    setShowDialog(false);
    setForm({ cliente: '', tipo_incidencia: 'discrepancia_monto', descripcion: '', prioridad: 'media' });
  };

  const handleResolve = async (inc: IncidenciaFacturacion) => {
    await updateMutation.mutateAsync({ id: inc.id, estado: 'resuelta', fecha_resolucion: new Date().toISOString() });
  };

  const formatCurrency = (v: number | null) =>
    v != null ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v) : '—';

  const totalAbiertas = incidencias.filter(i => i.estado === 'abierta').length;
  const totalEnRevision = incidencias.filter(i => i.estado === 'en_revision').length;
  const montoImpacto = incidencias
    .filter(i => i.estado !== 'cerrada' && i.monto_original && i.monto_ajustado)
    .reduce((s, i) => s + ((i.monto_original || 0) - (i.monto_ajustado || 0)), 0);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 text-destructive p-2 rounded-lg">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Abiertas</p>
              <p className="text-2xl font-bold">{totalAbiertas}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-warning/10 text-warning p-2 rounded-lg">
              <Clock className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">En Revisión</p>
              <p className="text-2xl font-bold">{totalEnRevision}</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
              <Search className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Impacto Pendiente</p>
              <p className="text-2xl font-bold">{formatCurrency(montoImpacto)}</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Filters & Actions */}
      <div className="flex items-center justify-between">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todas">Todas</SelectItem>
            <SelectItem value="abierta">Abiertas</SelectItem>
            <SelectItem value="en_revision">En Revisión</SelectItem>
            <SelectItem value="resuelta">Resueltas</SelectItem>
            <SelectItem value="cerrada">Cerradas</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nueva Incidencia
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Prioridad</TableHead>
                <TableHead>Monto Orig.</TableHead>
                <TableHead>Monto Ajust.</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : incidencias.length === 0 ? (
                <TableRow><TableCell colSpan={9} className="text-center py-8 text-muted-foreground">Sin incidencias</TableCell></TableRow>
              ) : (
                incidencias.map(inc => {
                  const badge = ESTADO_BADGE[inc.estado] || ESTADO_BADGE.abierta;
                  const tipoLabel = TIPOS_INCIDENCIA.find(t => t.value === inc.tipo_incidencia)?.label || inc.tipo_incidencia;
                  return (
                    <TableRow key={inc.id}>
                      <TableCell className="text-xs">{format(new Date(inc.created_at), 'dd/MM/yy')}</TableCell>
                      <TableCell className="font-medium text-sm max-w-[120px] truncate">{inc.cliente}</TableCell>
                      <TableCell className="text-xs">{tipoLabel}</TableCell>
                      <TableCell className="text-xs max-w-[200px] truncate">{inc.descripcion}</TableCell>
                      <TableCell>
                        <span className={`text-xs px-2 py-0.5 rounded ${PRIORIDAD_COLOR[inc.prioridad]}`}>
                          {inc.prioridad}
                        </span>
                      </TableCell>
                      <TableCell className="text-xs">{formatCurrency(inc.monto_original)}</TableCell>
                      <TableCell className="text-xs">{formatCurrency(inc.monto_ajustado)}</TableCell>
                      <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                      <TableCell>
                        {inc.estado === 'abierta' && (
                          <div className="flex gap-1">
                            <Button size="sm" variant="outline" className="h-7 text-xs"
                              onClick={() => updateMutation.mutate({ id: inc.id, estado: 'en_revision' })}>
                              Revisar
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 text-xs"
                              onClick={() => handleResolve(inc)}>
                              <CheckCircle2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        )}
                        {inc.estado === 'en_revision' && (
                          <Button size="sm" variant="outline" className="h-7 text-xs"
                            onClick={() => handleResolve(inc)}>
                            Resolver
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
            <DialogTitle>Nueva Incidencia de Facturación</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cliente *</Label>
                <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
              </div>
              <div className="space-y-2">
                <Label>Tipo</Label>
                <Select value={form.tipo_incidencia} onValueChange={v => setForm(f => ({ ...f, tipo_incidencia: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS_INCIDENCIA.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Descripción *</Label>
              <Textarea value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} rows={3} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Prioridad</Label>
                <Select value={form.prioridad} onValueChange={(v: any) => setForm(f => ({ ...f, prioridad: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="baja">Baja</SelectItem>
                    <SelectItem value="media">Media</SelectItem>
                    <SelectItem value="alta">Alta</SelectItem>
                    <SelectItem value="critica">Crítica</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Monto Original</Label>
                <Input type="number" value={form.monto_original || ''} onChange={e => setForm(f => ({ ...f, monto_original: Number(e.target.value) || undefined }))} />
              </div>
              <div className="space-y-2">
                <Label>Monto Ajustado</Label>
                <Input type="number" value={form.monto_ajustado || ''} onChange={e => setForm(f => ({ ...f, monto_ajustado: Number(e.target.value) || undefined }))} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleCreate} disabled={!form.cliente || !form.descripcion || createMutation.isPending}>
              Registrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
