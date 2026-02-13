import { useState, useEffect } from 'react';
import { useCreateCSQueja } from '@/hooks/useCSQuejas';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';

interface Props {
  onSuccess: () => void;
}

export function CSQuejaForm({ onSuccess }: Props) {
  const createQueja = useCreateCSQueja();
  const [clientes, setClientes] = useState<{ id: string; nombre: string }[]>([]);
  const [form, setForm] = useState({
    cliente_id: '',
    tipo: 'calidad_servicio',
    severidad: 'media',
    canal_entrada: 'telefono',
    descripcion: '',
    fecha_compromiso: '',
  });

  useEffect(() => {
    supabase
      .from('pc_clientes')
      .select('id, nombre')
      .eq('activo', true)
      .order('nombre')
      .then(({ data }) => setClientes(data || []));
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.cliente_id || !form.descripcion) return;

    createQueja.mutate(
      {
        ...form,
        fecha_compromiso: form.fecha_compromiso || undefined,
      },
      { onSuccess }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label>Cliente *</Label>
        <Select value={form.cliente_id} onValueChange={v => setForm(f => ({ ...f, cliente_id: v }))}>
          <SelectTrigger><SelectValue placeholder="Seleccionar cliente" /></SelectTrigger>
          <SelectContent>
            {clientes.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.nombre}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>Tipo *</Label>
          <Select value={form.tipo} onValueChange={v => setForm(f => ({ ...f, tipo: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="calidad_servicio">Calidad del servicio</SelectItem>
              <SelectItem value="facturacion">Facturación</SelectItem>
              <SelectItem value="cobertura">Cobertura</SelectItem>
              <SelectItem value="seguridad">Seguridad</SelectItem>
              <SelectItem value="consignas">Consignas</SelectItem>
              <SelectItem value="otro">Otro</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Severidad *</Label>
          <Select value={form.severidad} onValueChange={v => setForm(f => ({ ...f, severidad: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="baja">Baja</SelectItem>
              <SelectItem value="media">Media</SelectItem>
              <SelectItem value="alta">Alta</SelectItem>
              <SelectItem value="critica">Crítica</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Canal de entrada *</Label>
          <Select value={form.canal_entrada} onValueChange={v => setForm(f => ({ ...f, canal_entrada: v }))}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="whatsapp">WhatsApp</SelectItem>
              <SelectItem value="telefono">Teléfono</SelectItem>
              <SelectItem value="email">Email</SelectItem>
              <SelectItem value="ejecutivo">Ejecutivo</SelectItem>
              <SelectItem value="seguimiento_proactivo">Seguimiento proactivo</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label>Descripción *</Label>
        <Textarea
          value={form.descripcion}
          onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
          placeholder="Describe la queja del cliente con el mayor detalle posible..."
          className="min-h-[100px]"
        />
      </div>

      <div>
        <Label>Fecha compromiso de resolución</Label>
        <Input
          type="datetime-local"
          value={form.fecha_compromiso}
          onChange={e => setForm(f => ({ ...f, fecha_compromiso: e.target.value }))}
        />
      </div>

      <Button type="submit" className="w-full" disabled={createQueja.isPending || !form.cliente_id || !form.descripcion}>
        {createQueja.isPending ? 'Registrando...' : 'Registrar Queja'}
      </Button>
    </form>
  );
}
