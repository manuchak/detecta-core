import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, ExternalLink, Eye, EyeOff } from 'lucide-react';
import { useClientesPortales, useUpsertPortal, useDeletePortal, TIPOS_PORTAL } from '../../hooks/useClientesPortales';

interface PortalesTabProps {
  clienteId: string;
}

export function PortalesTab({ clienteId }: PortalesTabProps) {
  const { data: portales = [], isLoading } = useClientesPortales(clienteId);
  const upsertMutation = useUpsertPortal();
  const deleteMutation = useDeletePortal();

  const [showAdd, setShowAdd] = useState(false);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
  const [form, setForm] = useState({
    nombre_portal: '',
    url_portal: '',
    usuario_portal: '',
    password_portal: '',
    tipo_portal: 'facturacion',
    instrucciones: '',
  });

  const handleAdd = async () => {
    if (!form.nombre_portal) return;
    await upsertMutation.mutateAsync({
      cliente_id: clienteId,
      nombre_portal: form.nombre_portal,
      url_portal: form.url_portal || null,
      usuario_portal: form.usuario_portal || null,
      password_portal: form.password_portal || null,
      tipo_portal: form.tipo_portal,
      instrucciones: form.instrucciones || null,
    } as any);
    setForm({ nombre_portal: '', url_portal: '', usuario_portal: '', password_portal: '', tipo_portal: 'facturacion', instrucciones: '' });
    setShowAdd(false);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Cargando portales...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">Portales del cliente (facturación, cobranza, operativo)</p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      {showAdd && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Nombre del Portal *</Label>
              <Input className="h-8 text-xs" placeholder="Portal SAT, Ariba..." value={form.nombre_portal} onChange={(e) => setForm({ ...form, nombre_portal: e.target.value })} />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Tipo</Label>
              <Select value={form.tipo_portal} onValueChange={(v) => setForm({ ...form, tipo_portal: v })}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>{TIPOS_PORTAL.map((t) => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-1 min-w-0">
            <Label className="text-xs">URL</Label>
            <Input className="h-8 text-xs" placeholder="https://portal.cliente.com" value={form.url_portal} onChange={(e) => setForm({ ...form, url_portal: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-3 min-w-0">
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Usuario</Label>
              <Input className="h-8 text-xs" placeholder="user@empresa.com" value={form.usuario_portal} onChange={(e) => setForm({ ...form, usuario_portal: e.target.value })} />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-xs">Contraseña</Label>
              <Input type="password" className="h-8 text-xs" placeholder="••••••" value={form.password_portal} onChange={(e) => setForm({ ...form, password_portal: e.target.value })} />
            </div>
          </div>
          <div className="space-y-1">
            <Label className="text-xs">Instrucciones</Label>
            <Textarea className="text-xs min-h-[40px]" placeholder="Pasos para subir factura..." value={form.instrucciones} onChange={(e) => setForm({ ...form, instrucciones: e.target.value })} rows={2} />
          </div>
          <div className="flex gap-2 justify-end">
            <Button variant="ghost" size="sm" onClick={() => setShowAdd(false)}>Cancelar</Button>
            <Button size="sm" onClick={handleAdd} disabled={upsertMutation.isPending || !form.nombre_portal}>Guardar</Button>
          </div>
        </div>
      )}

      {portales.length === 0 && !showAdd ? (
        <p className="text-xs text-muted-foreground text-center py-6">Sin portales registrados</p>
      ) : (
        <div className="space-y-2">
          {portales.map((p) => (
            <div key={p.id} className="flex items-center justify-between p-3 border rounded-lg bg-background">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{p.nombre_portal}</span>
                  <Badge variant="outline" className="text-[10px]">{TIPOS_PORTAL.find(t => t.value === p.tipo_portal)?.label || p.tipo_portal}</Badge>
                  {!p.activo && <Badge variant="secondary" className="text-[10px]">Inactivo</Badge>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  {p.usuario_portal && <span className="text-[10px] text-muted-foreground">👤 {p.usuario_portal}</span>}
                  {p.password_portal && (
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground flex items-center gap-0.5 hover:text-foreground"
                      onClick={() => setShowPasswords(prev => ({ ...prev, [p.id]: !prev[p.id] }))}
                    >
                      {showPasswords[p.id] ? <><EyeOff className="h-2.5 w-2.5" /> {p.password_portal}</> : <><Eye className="h-2.5 w-2.5" /> ••••••</>}
                    </button>
                  )}
                </div>
                {p.instrucciones && <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{p.instrucciones}</p>}
              </div>
              <div className="flex items-center gap-1">
                {p.url_portal && (
                  <Button variant="ghost" size="icon" className="h-7 w-7" asChild>
                    <a href={p.url_portal} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-3.5 w-3.5" /></a>
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteMutation.mutate({ id: p.id, clienteId })}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
