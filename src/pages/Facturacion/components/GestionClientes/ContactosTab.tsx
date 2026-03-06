import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Trash2, Star } from 'lucide-react';
import { useClientesContactos, useUpsertContacto, useDeleteContacto, ClienteContacto } from '../../hooks/useClientesContactos';

interface ContactosTabProps {
  clienteId: string;
}

const ROLES = [
  { value: 'facturacion', label: 'Facturación' },
  { value: 'pagos', label: 'Pagos' },
  { value: 'operaciones', label: 'Operaciones' },
  { value: 'logistica', label: 'Logística' },
  { value: 'general', label: 'General' },
];

export function ContactosTab({ clienteId }: ContactosTabProps) {
  const { data: contactos = [], isLoading } = useClientesContactos(clienteId);
  const upsertMutation = useUpsertContacto();
  const deleteMutation = useDeleteContacto();

  const [newContact, setNewContact] = useState({ nombre: '', email: '', telefono: '', rol: 'facturacion', principal: false });
  const [showAdd, setShowAdd] = useState(false);

  const handleAdd = async () => {
    if (!newContact.email) return;
    await upsertMutation.mutateAsync({
      cliente_id: clienteId,
      ...newContact,
    });
    setNewContact({ nombre: '', email: '', telefono: '', rol: 'facturacion', principal: false });
    setShowAdd(false);
  };

  if (isLoading) return <p className="text-sm text-muted-foreground py-4">Cargando contactos...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {contactos.length} contacto(s) registrado(s)
        </p>
        <Button variant="outline" size="sm" onClick={() => setShowAdd(!showAdd)}>
          <Plus className="h-3.5 w-3.5 mr-1" />
          Agregar
        </Button>
      </div>

      {showAdd && (
        <div className="border rounded-lg p-3 space-y-3 bg-muted/30">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Nombre</Label>
              <Input value={newContact.nombre} onChange={e => setNewContact(p => ({ ...p, nombre: e.target.value }))} placeholder="Nombre completo" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Email *</Label>
              <Input type="email" value={newContact.email} onChange={e => setNewContact(p => ({ ...p, email: e.target.value }))} placeholder="email@empresa.com" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Teléfono</Label>
              <Input value={newContact.telefono} onChange={e => setNewContact(p => ({ ...p, telefono: e.target.value }))} placeholder="55 1234 5678" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Rol</Label>
              <Select value={newContact.rol} onValueChange={v => setNewContact(p => ({ ...p, rol: v }))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLES.map(r => <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button size="sm" onClick={handleAdd} disabled={!newContact.email || upsertMutation.isPending}>
                Guardar
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {contactos.map(c => (
          <div key={c.id} className="flex items-center justify-between border rounded-lg p-3">
            <div className="flex items-center gap-3">
              {c.principal && <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-500" />}
              <div>
                <p className="text-sm font-medium">{c.nombre || c.email}</p>
                <p className="text-xs text-muted-foreground">{c.email}{c.telefono ? ` · ${c.telefono}` : ''}</p>
              </div>
              <Badge variant="outline" className="text-[10px]">{c.rol}</Badge>
            </div>
            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive"
              onClick={() => deleteMutation.mutate(c.id)}>
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        ))}
        {contactos.length === 0 && !showAdd && (
          <p className="text-sm text-center text-muted-foreground py-4">
            Sin contactos adicionales. Use el botón "Agregar" para registrar emails de facturación.
          </p>
        )}
      </div>
    </div>
  );
}
