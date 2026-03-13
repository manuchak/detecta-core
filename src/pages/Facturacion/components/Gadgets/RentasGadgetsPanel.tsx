import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Plus, Receipt } from 'lucide-react';
import { useRentasGadgets, useUpsertRentaGadget } from '../../hooks/useInventarioGadgets';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function RentasGadgetsPanel() {
  const [showDialog, setShowDialog] = useState(false);
  const [form, setForm] = useState({
    mes: new Date().toISOString().slice(0, 7),
    total_unidades: 0,
    renta_por_unidad: 0,
    monto_total: 0,
    proveedor: '',
    factura_proveedor: '',
    notas: '',
  });

  const { data: rentas = [], isLoading } = useRentasGadgets();
  const upsertMutation = useUpsertRentaGadget();

  const updateTotal = (units: number, rate: number) => {
    setForm(f => ({ ...f, total_unidades: units, renta_por_unidad: rate, monto_total: units * rate }));
  };

  const handleSave = async () => {
    if (!form.mes) return;
    await upsertMutation.mutateAsync(form);
    setShowDialog(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold">Rentas Mensuales de Gadgets</h3>
          <p className="text-xs text-muted-foreground">Registro del costo mensual fijo por renta de candados</p>
        </div>
        <Button size="sm" onClick={() => setShowDialog(true)}>
          <Plus className="h-4 w-4 mr-1" /> Registrar Renta
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mes</TableHead>
                <TableHead>Proveedor</TableHead>
                <TableHead className="text-center">Unidades</TableHead>
                <TableHead className="text-right">$/Unidad</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead>Factura</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : rentas.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">Sin rentas registradas</TableCell></TableRow>
              ) : rentas.map(r => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-sm">{r.mes}</TableCell>
                  <TableCell className="text-sm">{r.proveedor || '—'}</TableCell>
                  <TableCell className="text-center">{r.total_unidades}</TableCell>
                  <TableCell className="text-right text-sm">{formatCurrency(r.renta_por_unidad)}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{formatCurrency(r.monto_total)}</TableCell>
                  <TableCell className="text-xs">{r.factura_proveedor || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={r.estado === 'pagado' ? 'secondary' : 'outline'} className="text-[10px]">
                      {r.estado === 'pagado' ? 'Pagado' : 'Pendiente'}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Registrar Renta Mensual</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Mes *</Label>
              <Input type="month" value={form.mes} onChange={e => setForm(f => ({ ...f, mes: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Proveedor</Label>
              <Input value={form.proveedor} onChange={e => setForm(f => ({ ...f, proveedor: e.target.value }))} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="text-xs">Unidades</Label>
                <Input type="number" value={form.total_unidades} onChange={e => updateTotal(Number(e.target.value), form.renta_por_unidad)} />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">$/Unidad</Label>
                <Input type="number" value={form.renta_por_unidad} onChange={e => updateTotal(form.total_unidades, Number(e.target.value))} />
              </div>
            </div>
            <div className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs text-muted-foreground">Total</p>
              <p className="text-lg font-bold">{formatCurrency(form.monto_total)}</p>
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Factura Proveedor</Label>
              <Input value={form.factura_proveedor} onChange={e => setForm(f => ({ ...f, factura_proveedor: e.target.value }))} placeholder="# Factura" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Notas</Label>
              <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!form.mes || upsertMutation.isPending}>Guardar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
