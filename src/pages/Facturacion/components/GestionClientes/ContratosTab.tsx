import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, RefreshCw } from 'lucide-react';
import { useContratosMonitoreo, useUpsertContrato, useDeleteContrato } from '../../hooks/useContratosMonitoreo';

interface ContratosTabProps {
  clienteId: string;
}

const TIPOS_CONTRATO = [
  { value: 'monitoreo', label: 'Monitoreo' },
  { value: 'custodia', label: 'Custodia' },
  { value: 'mixto', label: 'Mixto' },
];

const ESTADOS = [
  { value: 'activo', label: 'Activo', color: 'bg-emerald-500/15 text-emerald-700' },
  { value: 'vencido', label: 'Vencido', color: 'bg-red-500/15 text-red-700' },
  { value: 'en_renovacion', label: 'En renovación', color: 'bg-amber-500/15 text-amber-700' },
  { value: 'cancelado', label: 'Cancelado', color: 'bg-muted text-muted-foreground' },
];

export function ContratosTab({ clienteId }: ContratosTabProps) {
  const { data: contratos = [], isLoading } = useContratosMonitoreo(clienteId);
  const upsertMutation = useUpsertContrato();
  const deleteMutation = useDeleteContrato();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    numero_contrato: '',
    tipo_contrato: 'monitoreo',
    fecha_inicio: '',
    fecha_fin: '',
    estado: 'activo',
    monto_mensual: '',
    renovacion_automatica: false,
    condiciones_especiales: '',
    notas: '',
  });

  const handleAdd = async () => {
    if (!form.numero_contrato || !form.fecha_inicio) return;
    await upsertMutation.mutateAsync({
      cliente_id: clienteId,
      numero_contrato: form.numero_contrato,
      tipo_contrato: form.tipo_contrato,
      fecha_inicio: form.fecha_inicio,
      fecha_fin: form.fecha_fin || null,
      estado: form.estado,
      monto_mensual: form.monto_mensual ? Number(form.monto_mensual) : null,
      renovacion_automatica: form.renovacion_automatica,
      condiciones_especiales: form.condiciones_especiales || null,
      notas: form.notas || null,
    } as any);
    setForm({ numero_contrato: '', tipo_contrato: 'monitoreo', fecha_inicio: '', fecha_fin: '', estado: 'activo', monto_mensual: '', renovacion_automatica: false, condiciones_especiales: '', notas: '' });
    setShowAdd(false);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Cargando contratos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Contratos de monitoreo/custodia del cliente</p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      {showAdd && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Número de Contrato *</Label>
              <Input className="h-8 text-xs" placeholder="CTR-001" value={form.numero_contrato} onChange={(e) => setForm({ ...form, numero_contrato: e.target.value })} />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo_contrato} onValueChange={(v) => setForm({ ...form, tipo_contrato: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_CONTRATO.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Fecha Inicio *</Label>
              <Input type="date" className="h-8 text-xs" value={form.fecha_inicio} onChange={(e) => setForm({ ...form, fecha_inicio: e.target.value })} />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Fecha Fin</Label>
              <Input type="date" className="h-8 text-xs" value={form.fecha_fin} onChange={(e) => setForm({ ...form, fecha_fin: e.target.value })} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Monto Mensual</Label>
              <Input type="number" className="h-8 text-xs" placeholder="$0.00" value={form.monto_mensual} onChange={(e) => setForm({ ...form, monto_mensual: e.target.value })} />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Estado</Label>
              <Select value={form.estado} onValueChange={(v) => setForm({ ...form, estado: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{ESTADOS.map((e) => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="renovacion" checked={form.renovacion_automatica} onChange={(e) => setForm({ ...form, renovacion_automatica: e.target.checked })} className="h-3.5 w-3.5 rounded border-border shrink-0" />
            <label htmlFor="renovacion" className="text-xs cursor-pointer">Renovación automática</label>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Notas</Label>
            <Textarea className="text-xs min-h-[40px]" placeholder="Condiciones especiales..." value={form.notas} onChange={(e) => setForm({ ...form, notas: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={upsertMutation.isPending || !form.numero_contrato || !form.fecha_inicio}>Guardar</Button>
          </div>
        </div>
      )}

      {contratos.length === 0 && !showAdd ? (
        <p className="text-xs text-muted-foreground text-center py-6">Sin contratos registrados</p>
      ) : (
        <div className="space-y-2">
          {contratos.map((c) => {
            const estadoInfo = ESTADOS.find((e) => e.value === c.estado) || ESTADOS[0];
            return (
              <div key={c.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium truncate">{c.numero_contrato}</span>
                    <Badge variant="outline" className={`text-[10px] ${estadoInfo.color}`}>{estadoInfo.label}</Badge>
                    {c.renovacion_automatica && <RefreshCw className="h-3 w-3 text-muted-foreground" />}
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {c.tipo_contrato} · {c.fecha_inicio}{c.fecha_fin ? ` → ${c.fecha_fin}` : ' (indefinido)'}
                    {c.monto_mensual ? ` · $${Number(c.monto_mensual).toLocaleString()} ${c.moneda}/mes` : ''}
                  </p>
                </div>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: c.id, clienteId })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
