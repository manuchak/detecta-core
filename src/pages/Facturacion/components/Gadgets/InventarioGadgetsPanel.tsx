import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Package, Pencil, Trash2 } from 'lucide-react';
import {
  useInventarioGadgets,
  useUpsertInventarioGadget,
  useDeleteInventarioGadget,
  type InventarioGadget,
} from '../../hooks/useInventarioGadgets';

const TIPOS = [
  { value: 'candado_sintel', label: 'Candado Sintel' },
  { value: 'candado_rhino', label: 'Candado Rhino' },
  { value: 'candado_kraken', label: 'Candado Kraken' },
  { value: 'trabapatin', label: 'Trabapatín' },
  { value: 'gps', label: 'GPS' },
  { value: 'otro', label: 'Otro' },
];

const ESTADOS = [
  { value: 'activo', label: 'Activo' },
  { value: 'baja', label: 'Baja' },
  { value: 'reparacion', label: 'Reparación' },
];

const EMPTY_FORM = {
  serial: '',
  tipo: 'candado_sintel',
  proveedor_nombre: '',
  es_propio: false,
  renta_mensual: 0,
  estado: 'activo',
  fecha_alta: new Date().toISOString().slice(0, 10),
  notas: '',
};

export function InventarioGadgetsPanel() {
  const [filtroTipo, setFiltroTipo] = useState('todos');
  const [filtroEstado, setFiltroEstado] = useState('activo');
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState<typeof EMPTY_FORM & { id?: string }>(EMPTY_FORM);

  const { data: gadgets = [], isLoading } = useInventarioGadgets({ tipo: filtroTipo, estado: filtroEstado });
  const upsertMutation = useUpsertInventarioGadget();
  const deleteMutation = useDeleteInventarioGadget();

  const handleSave = async () => {
    if (!form.serial || !form.tipo) return;
    await upsertMutation.mutateAsync(form as any);
    setShowDialog(false);
    setForm(EMPTY_FORM);
  };

  const handleEdit = (g: InventarioGadget) => {
    setForm({
      id: g.id,
      serial: g.serial,
      tipo: g.tipo,
      proveedor_nombre: g.proveedor_nombre || '',
      es_propio: g.es_propio,
      renta_mensual: g.renta_mensual,
      estado: g.estado,
      fecha_alta: g.fecha_alta,
      notas: g.notas || '',
    } as any);
    setShowDialog(true);
  };

  const activos = gadgets.filter(g => g.estado === 'activo');
  const rentados = activos.filter(g => !g.es_propio);
  const propios = activos.filter(g => g.es_propio);

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  return (
    <div className="space-y-4">
      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Total Activos</p>
          <p className="text-xl font-bold">{activos.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Rentados</p>
          <p className="text-xl font-bold text-warning">{rentados.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Propios</p>
          <p className="text-xl font-bold text-primary">{propios.length}</p>
        </Card>
        <Card className="p-3">
          <p className="text-xs text-muted-foreground">Renta Mensual Est.</p>
          <p className="text-xl font-bold">{formatCurrency(rentados.reduce((s, g) => s + g.renta_mensual, 0))}</p>
        </Card>
      </div>

      {/* Filters + Add */}
      <div className="flex items-center gap-2 flex-wrap">
        <Select value={filtroTipo} onValueChange={setFiltroTipo}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos los tipos</SelectItem>
            {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[140px] h-8 text-xs"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos estados</SelectItem>
            {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <div className="flex-1" />
        <Button size="sm" onClick={() => { setForm(EMPTY_FORM); setShowDialog(true); }}>
          <Plus className="h-4 w-4 mr-1" /> Agregar Gadget
        </Button>
      </div>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Serial</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-center">Propio</TableHead>
                <TableHead className="text-right">Renta/Mes</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Alta</TableHead>
                <TableHead className="w-20"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : gadgets.length === 0 ? (
                <TableRow><TableCell colSpan={8} className="text-center py-8 text-muted-foreground">Sin gadgets registrados</TableCell></TableRow>
              ) : gadgets.map(g => (
                <TableRow key={g.id}>
                  <TableCell className="font-mono text-xs">{g.serial}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px]">
                      {TIPOS.find(t => t.value === g.tipo)?.label || g.tipo}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm">{g.proveedor_nombre || '—'}</TableCell>
                  <TableCell className="text-center">
                    {g.es_propio ? <Badge variant="secondary" className="text-[10px]">Propio</Badge> : <Badge variant="outline" className="text-[10px]">Rentado</Badge>}
                  </TableCell>
                  <TableCell className="text-right text-sm">{g.es_propio ? '—' : formatCurrency(g.renta_mensual)}</TableCell>
                  <TableCell>
                    <Badge variant={g.estado === 'activo' ? 'default' : g.estado === 'reparacion' ? 'secondary' : 'destructive'} className="text-[10px]">
                      {ESTADOS.find(e => e.value === g.estado)?.label || g.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs">{g.fecha_alta}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => handleEdit(g)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate(g.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{form.id ? 'Editar Gadget' : 'Nuevo Gadget'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Serial *</Label>
              <Input value={form.serial} onChange={e => setForm(f => ({ ...f, serial: e.target.value }))} placeholder="SITEL-00068" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Tipo *</Label>
                <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Estado</Label>
                <Select value={form.estado} onValueChange={v => setForm(f => ({ ...f, estado: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Proveedor</Label>
              <Input value={form.proveedor_nombre} onChange={e => setForm(f => ({ ...f, proveedor_nombre: e.target.value }))} placeholder="Nombre del proveedor" />
            </div>
            <div className="flex items-center gap-3">
              <Switch checked={form.es_propio} onCheckedChange={v => setForm(f => ({ ...f, es_propio: v, renta_mensual: v ? 0 : f.renta_mensual }))} />
              <Label className="text-xs">Es propio (sin renta)</Label>
            </div>
            {!form.es_propio && (
              <div className="space-y-1">
                <Label className="text-xs">Renta Mensual (MXN)</Label>
                <Input type="number" value={form.renta_mensual} onChange={e => setForm(f => ({ ...f, renta_mensual: Number(e.target.value) }))} />
              </div>
            )}
            <div className="space-y-1">
              <Label className="text-xs">Fecha de Alta</Label>
              <Input type="date" value={form.fecha_alta} onChange={e => setForm(f => ({ ...f, fecha_alta: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.serial || upsertMutation.isPending}>
              {form.id ? 'Actualizar' : 'Crear'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
