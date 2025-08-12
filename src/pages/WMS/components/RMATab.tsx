import { useState } from 'react';
import { useDevolucionesProveedor } from '@/hooks/useDevolucionesProveedor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const RMATab = () => {
  const { devoluciones, isLoading, crearDevolucion } = useDevolucionesProveedor();
  const [open, setOpen] = useState(false);
  const [numeroRMA, setNumeroRMA] = useState('');
  const [proveedorId, setProveedorId] = useState('');
  const [notas, setNotas] = useState('');

  const handleCreate = async () => {
    await crearDevolucion.mutateAsync({ numero_rma: numeroRMA || undefined, proveedor_id: proveedorId || undefined, notas: notas || undefined });
    setOpen(false);
    setNumeroRMA('');
    setProveedorId('');
    setNotas('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Devoluciones a Proveedor (RMA)</h2>
          <p className="text-muted-foreground">Controla devoluciones por garantía y sus impactos</p>
        </div>
        <Button onClick={() => setOpen(true)}>Nueva devolución</Button>
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>Nueva devolución</CardTitle>
            <CardDescription>Crea un folio de devolución (puedes editar luego)</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="col-span-1">
              <label className="text-sm">Número RMA (opcional)</label>
              <input value={numeroRMA} onChange={e=>setNumeroRMA(e.target.value)} className="mt-1 w-full border rounded-md h-9 px-3 bg-background" />
            </div>
            <div className="col-span-1">
              <label className="text-sm">Proveedor ID (opcional)</label>
              <input value={proveedorId} onChange={e=>setProveedorId(e.target.value)} className="mt-1 w-full border rounded-md h-9 px-3 bg-background" />
            </div>
            <div className="col-span-3">
              <label className="text-sm">Notas</label>
              <textarea value={notas} onChange={e=>setNotas(e.target.value)} className="mt-1 w-full border rounded-md p-3 bg-background" rows={3} />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={crearDevolucion.isPending}>Crear</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando devoluciones…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(devoluciones || []).map((dev) => (
            <Card key={dev.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>Folio: {dev.numero_rma || dev.id.slice(0,8)}</span>
                  <span className="text-sm font-normal">{new Date(dev.created_at || '').toLocaleString()}</span>
                </CardTitle>
                <CardDescription>Estado: {dev.estado} • Ítems: {dev.total_items} • Valor: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format(dev.total_valor || 0)}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{dev.notas || 'Sin notas'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
