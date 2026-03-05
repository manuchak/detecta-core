import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Milestone } from 'lucide-react';
import { format } from 'date-fns';
import { useCasetasReembolso } from '../../../hooks/useCasetasReembolso';

const formatCurrency = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export function CasetasPanel() {
  const { data: casetas = [], isLoading } = useCasetasReembolso();

  const totalCasetas = casetas.reduce((s, c) => s + (Number(c.casetas) || 0), 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-semibold">Casetas por Servicio</h3>
          <p className="text-sm text-muted-foreground">
            Servicios completados con costo de casetas. Los montos se incluyen automáticamente en los cortes semanales.
          </p>
        </div>
        <Card className="p-3">
          <div className="flex items-center gap-2">
            <Milestone className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-muted-foreground">Total Casetas</p>
              <p className="text-lg font-bold">{formatCurrency(totalCasetas)}</p>
            </div>
          </div>
        </Card>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Folio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead className="text-right">Casetas</TableHead>
                <TableHead>Estado</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Cargando...</TableCell></TableRow>
              ) : casetas.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center py-8 text-muted-foreground">Sin servicios con casetas</TableCell></TableRow>
              ) : (
                casetas.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="text-sm font-mono">{c.id_servicio || c.id}</TableCell>
                    <TableCell className="text-sm">{c.cliente || '—'}</TableCell>
                    <TableCell className="text-xs">
                      {c.fecha_servicio ? format(new Date(c.fecha_servicio), 'dd/MM/yy') : '—'}
                    </TableCell>
                    <TableCell className="text-right font-medium">{formatCurrency(Number(c.casetas))}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="text-xs">Completado</Badge>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
