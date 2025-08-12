import { useState } from 'react';
import { useDesechosInventario } from '@/hooks/useDesechosInventario';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const DesechosTab = () => {
  const { desechos, isLoading, crearDesecho } = useDesechosInventario();
  const { productos } = useProductosInventario();
  const [open, setOpen] = useState(false);
  const [productoId, setProductoId] = useState('');
  const [cantidad, setCantidad] = useState<number>(1);
  const [motivo, setMotivo] = useState('');
  const [costo, setCosto] = useState<number>(0);

  const handleCreate = async () => {
    if (!productoId || cantidad <= 0) return;
    await crearDesecho.mutateAsync({ producto_id: productoId, cantidad, motivo: motivo || undefined, costo_unitario: isFinite(costo) ? costo : 0 });
    setOpen(false);
    setProductoId('');
    setCantidad(1);
    setMotivo('');
    setCosto(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Desechos de Inventario</h2>
          <p className="text-muted-foreground">Registra productos dañados o fuera de garantía</p>
        </div>
        <Button onClick={() => setOpen(true)}>Registrar desecho</Button>
      </div>

      {open && (
        <Card>
          <CardHeader>
            <CardTitle>Nuevo desecho</CardTitle>
            <CardDescription>Selecciona el producto y cantidades</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-3">
            <div className="col-span-1">
              <label className="text-sm">Producto</label>
              <select value={productoId} onChange={e=>setProductoId(e.target.value)} className="mt-1 w-full border rounded-md h-9 px-3 bg-background">
                <option value="">Selecciona…</option>
                {(productos || []).map((p:any)=> (
                  <option key={p.id} value={p.id}>{p.nombre}</option>
                ))}
              </select>
            </div>
            <div className="col-span-1">
              <label className="text-sm">Cantidad</label>
              <input type="number" min={1} value={cantidad} onChange={e=>setCantidad(parseInt(e.target.value||'1'))} className="mt-1 w-full border rounded-md h-9 px-3 bg-background" />
            </div>
            <div className="col-span-1">
              <label className="text-sm">Costo unitario (opcional)</label>
              <input type="number" min={0} step="0.01" value={costo} onChange={e=>setCosto(parseFloat(e.target.value||'0'))} className="mt-1 w-full border rounded-md h-9 px-3 bg-background" />
            </div>
            <div className="col-span-3">
              <label className="text-sm">Motivo</label>
              <textarea value={motivo} onChange={e=>setMotivo(e.target.value)} className="mt-1 w-full border rounded-md p-3 bg-background" rows={3} />
            </div>
            <div className="col-span-3 flex gap-2 justify-end">
              <Button variant="outline" onClick={()=>setOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={crearDesecho.isPending || !productoId || cantidad<=0}>Guardar</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-muted-foreground">Cargando desechos…</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {(desechos || []).map((d) => (
            <Card key={d.id}>
              <CardHeader>
                <CardTitle className="flex justify-between">
                  <span>{(productos||[]).find((p:any)=>p.id===d.producto_id)?.nombre || d.producto_id}</span>
                  <span className="text-sm font-normal">{new Date(d.created_at || '').toLocaleString()}</span>
                </CardTitle>
                <CardDescription>Qty: {d.cantidad} • Valor: {new Intl.NumberFormat('es-MX',{style:'currency',currency:'MXN'}).format((d.valor_total||0))} • Estado: {d.estado}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{d.motivo || 'Sin motivo'}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
