import { useState } from 'react';
import { useDevolucionesProveedor } from '@/hooks/useDevolucionesProveedor';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { DevolucionWizard } from './DevolucionWizard';

export const RMATab = () => {
  const { devoluciones, isLoading } = useDevolucionesProveedor();
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Devoluciones a Proveedor (RMA)</h2>
          <p className="text-muted-foreground">Controla devoluciones por garantía y sus impactos</p>
        </div>
        <Button onClick={() => setOpen(true)}>Nueva devolución</Button>
      </div>

      <DevolucionWizard open={open} onOpenChange={setOpen} />

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
