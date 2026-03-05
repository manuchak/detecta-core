import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Hotel, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { useHotelesPernocta } from '../../../hooks/useHotelesPernocta';
import { useCreateGastoExtraordinario } from '../../../hooks/useGastosExtraordinarios';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

const ESTADO_BADGE: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
  pendiente: { variant: 'outline', label: 'Pendiente' },
  aprobado: { variant: 'default', label: 'Aprobado' },
  rechazado: { variant: 'destructive', label: 'Rechazado' },
  reembolsado: { variant: 'secondary', label: 'Reembolsado' },
};

export function HotelesPanel() {
  const [filtroEstado, setFiltroEstado] = useState('todos');
  const [showRegister, setShowRegister] = useState(false);
  const { data: hoteles = [], isLoading } = useHotelesPernocta({ estado: filtroEstado });

  const totalMonto = hoteles.reduce((s, h: any) => s + (Number(h.monto) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Hoteles y Pernoctas</h3>
          <p className="text-sm text-muted-foreground">
            Gastos de hospedaje de custodios. Se incluyen como línea en los cortes semanales.
          </p>
        </div>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Hotel className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Hoteles</p>
              <p className="text-lg font-bold">{formatCurrency(totalMonto)}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <Select value={filtroEstado} onValueChange={setFiltroEstado}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos</SelectItem>
            <SelectItem value="pendiente">Pendiente</SelectItem>
            <SelectItem value="aprobado">Aprobado</SelectItem>
            <SelectItem value="reembolsado">Reembolsado</SelectItem>
          </SelectContent>
        </Select>
        <Button onClick={() => setShowRegister(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Registrar Hotel
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Descripción</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead className="text-right">Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Fecha</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : hoteles.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin gastos de hotel registrados</TableCell></TableRow>
              ) : (
                hoteles.map((h: any) => {
                  const badge = ESTADO_BADGE[h.estado_reembolso] || ESTADO_BADGE.pendiente;
                  return (
                    <TableRow key={h.id}>
                      <TableCell className="text-sm">{h.descripcion}</TableCell>
                      <TableCell className="text-sm">{h.cliente || '—'}</TableCell>
                      <TableCell className="text-right font-medium">{formatCurrency(Number(h.monto))}</TableCell>
                      <TableCell><Badge variant={badge.variant}>{badge.label}</Badge></TableCell>
                      <TableCell className="text-xs">{format(new Date(h.created_at), 'dd/MM/yy')}</TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <RegisterHotelDialog open={showRegister} onOpenChange={setShowRegister} />
    </div>
  );
}

function RegisterHotelDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [form, setForm] = useState({
    descripcion: '',
    monto: '',
    cliente: '',
    notas: '',
  });
  const createMutation = useCreateGastoExtraordinario();

  const handleSubmit = async () => {
    if (!form.descripcion || !form.monto) return;
    await createMutation.mutateAsync({
      tipo_gasto: 'hotel',
      descripcion: form.descripcion,
      monto: Number(form.monto),
      cobrable_cliente: false,
      pagable_custodio: true,
      cliente: form.cliente || undefined,
      notas: form.notas || undefined,
    });
    onOpenChange(false);
    setForm({ descripcion: '', monto: '', cliente: '', notas: '' });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader><DialogTitle>Registrar Gasto de Hotel</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1">
            <Label className="text-xs">Descripción *</Label>
            <Input value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} placeholder="Hotel en GDL, 1 noche" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Monto *</Label>
              <Input type="number" value={form.monto} onChange={e => setForm(f => ({ ...f, monto: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Cliente</Label>
              <Input value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Textarea value={form.notas} onChange={e => setForm(f => ({ ...f, notas: e.target.value }))} rows={2} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleSubmit} disabled={!form.descripcion || !form.monto || createMutation.isPending}>
            Registrar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
