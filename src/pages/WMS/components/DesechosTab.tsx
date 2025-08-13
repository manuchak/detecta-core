import { useState } from 'react';
import { useDesechosInventario } from '@/hooks/useDesechosInventario';
import { useProductosInventario } from '@/hooks/useProductosInventario';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DesechoWizard } from './DesechoWizard';

export const DesechosTab = () => {
  const { desechos, isLoading } = useDesechosInventario();
  const { productos } = useProductosInventario();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Desechos de Inventario</h2>
          <p className="text-muted-foreground">Registra productos dañados o fuera de garantía</p>
        </div>
        <Button onClick={() => setOpen(true)}>Registrar desecho</Button>
      </div>

      <DesechoWizard open={open} onOpenChange={setOpen} />

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
