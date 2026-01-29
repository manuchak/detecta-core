import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { History, ArrowRight, TrendingUp, TrendingDown } from 'lucide-react';
import { usePriceHistory, PriceHistoryEntry } from '@/hooks/usePriceHistory';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';

const fieldLabels: Record<string, string> = {
  valor_bruto: 'Precio Cliente',
  precio_custodio: 'Pago Custodio',
  costo_operativo: 'Costo Operativo'
};

export function PriceHistoryTable() {
  const { data: history = [], isPending, error } = usePriceHistory(100);

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <History className="h-5 w-5" />
            Historial de Cambios
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Error al cargar el historial
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <History className="h-5 w-5" />
          Historial de Cambios de Precios
        </CardTitle>
        <CardDescription>
          Registro de todas las modificaciones de precios en rutas
        </CardDescription>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <History className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aún no hay cambios registrados</p>
            <p className="text-sm">Los cambios de precio aparecerán aquí automáticamente</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Cliente / Ruta</TableHead>
                <TableHead>Campo</TableHead>
                <TableHead className="text-right">Anterior</TableHead>
                <TableHead className="text-center"></TableHead>
                <TableHead className="text-right">Nuevo</TableHead>
                <TableHead className="text-right">Cambio</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((entry) => {
                const cambio = (entry.valor_nuevo || 0) - (entry.valor_anterior || 0);
                const porcentajeCambio = entry.valor_anterior 
                  ? ((cambio / entry.valor_anterior) * 100) 
                  : 0;
                const esIncremento = cambio >= 0;

                return (
                  <TableRow key={entry.id}>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatDistanceToNow(new Date(entry.created_at), { 
                        addSuffix: true, 
                        locale: es 
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-sm">{entry.cliente_nombre || 'Cliente desconocido'}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                        {entry.origen_texto?.slice(0, 20) || '—'} 
                        <ArrowRight className="h-3 w-3" /> 
                        {entry.destino_texto?.slice(0, 20) || '—'}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {fieldLabels[entry.campo_modificado] || entry.campo_modificado}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      ${entry.valor_anterior?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-center">
                      <ArrowRight className="h-4 w-4 text-muted-foreground mx-auto" />
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium">
                      ${entry.valor_nuevo?.toLocaleString() || '0'}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        {esIncremento ? (
                          <TrendingUp className="h-4 w-4 text-green-600" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-red-600" />
                        )}
                        <Badge variant={esIncremento ? 'default' : 'destructive'} className="text-xs">
                          {esIncremento ? '+' : ''}{porcentajeCambio.toFixed(1)}%
                        </Badge>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
