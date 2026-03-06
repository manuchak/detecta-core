import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2 } from 'lucide-react';
import { useClientesGadgets, useUpsertGadget, useDeleteGadget, GADGET_TIPOS } from '../../hooks/useClientesGadgets';

interface GadgetsTabProps {
  clienteId: string;
}

export function GadgetsTab({ clienteId }: GadgetsTabProps) {
  const { data: gadgets = [], isLoading } = useClientesGadgets(clienteId);
  const upsertMutation = useUpsertGadget();
  const deleteMutation = useDeleteGadget();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ tipo: 'gps', precio: '', incluido_en_tarifa: false, facturacion: 'por_servicio', notas: '' });

  const handleAdd = async () => {
    if (!form.tipo || !form.precio) return;
    await upsertMutation.mutateAsync({
      cliente_id: clienteId,
      tipo: form.tipo,
      precio: Number(form.precio),
      incluido_en_tarifa: form.incluido_en_tarifa,
      facturacion: form.facturacion,
      notas: form.notas || null,
    });
    setForm({ tipo: 'gps', precio: '', incluido_en_tarifa: false, facturacion: 'por_servicio', notas: '' });
    setShowAdd(false);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Cargando gadgets...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          Adicionales facturables (GPS, candados, hoteles)
        </p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      {showAdd && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Tipo *</Label>
              <Select value={form.tipo} onValueChange={v => setForm(p => ({ ...p, tipo: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {GADGET_TIPOS.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Precio *</Label>
              <Input type="number" value={form.precio} onChange={e => setForm(p => ({ ...p, precio: e.target.value }))} placeholder="$0.00" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Facturación</Label>
              <Select value={form.facturacion} onValueChange={v => setForm(p => ({ ...p, facturacion: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="por_servicio">Por servicio</SelectItem>
                  <SelectItem value="mensual">Mensual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-0">
              <Input value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value }))} placeholder="Notas..." className="text-xs mt-5" />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <input type="checkbox" id="incluido" checked={form.incluido_en_tarifa}
                onChange={e => setForm(p => ({ ...p, incluido_en_tarifa: e.target.checked }))}
                className="h-4 w-4 rounded border-border" />
              <label htmlFor="incluido" className="text-xs">Incluido en tarifa base</label>
            </div>
            <Button size="sm" onClick={handleAdd} disabled={!form.precio || upsertMutation.isPending}>Guardar</Button>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {gadgets.map(g => {
          const tipoLabel = GADGET_TIPOS.find(t => t.value === g.tipo)?.label || g.tipo;
          return (
            <div key={g.id} className="flex items-center justify-between border rounded-lg p-3">
              <div className="flex items-center gap-3">
                <div>
                  <p className="text-sm font-medium">{tipoLabel}</p>
                  <p className="text-xs text-muted-foreground">
                    ${g.precio} · {g.facturacion === 'mensual' ? 'Mensual' : 'Por servicio'}
                    {g.incluido_en_tarifa && ' · Incluido'}
                  </p>
                </div>
                {g.notas && <Badge variant="outline" className="text-[10px]">{g.notas}</Badge>}
              </div>
              <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
                onClick={() => deleteMutation.mutate(g.id)}>
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          );
        })}
        {gadgets.length === 0 && !showAdd && (
          <p className="text-sm text-center text-muted-foreground py-4">
            Sin adicionales configurados.
          </p>
        )}
      </div>
    </div>
  );
}
