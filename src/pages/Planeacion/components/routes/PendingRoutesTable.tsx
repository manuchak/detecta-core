import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, Clock, Edit, Calculator, ArrowRight } from 'lucide-react';
import { useRoutesWithPendingPrices, PendingPriceRoute } from '@/hooks/useRoutesWithPendingPrices';
import { QuickPriceEditModal } from './QuickPriceEditModal';
import { BulkPriceAdjustModal } from './BulkPriceAdjustModal';

export function PendingRoutesTable() {
  const { data: routes = [], isPending, error } = useRoutesWithPendingPrices();
  const [selectedRoutes, setSelectedRoutes] = useState<Set<string>>(new Set());
  const [editingRoute, setEditingRoute] = useState<PendingPriceRoute | null>(null);
  const [showBulkAdjust, setShowBulkAdjust] = useState(false);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedRoutes(new Set(routes.map(r => r.id)));
    } else {
      setSelectedRoutes(new Set());
    }
  };

  const handleSelectRoute = (routeId: string, checked: boolean) => {
    const newSelected = new Set(selectedRoutes);
    if (checked) {
      newSelected.add(routeId);
    } else {
      newSelected.delete(routeId);
    }
    setSelectedRoutes(newSelected);
  };

  const selectedRoutesData = routes.filter(r => selectedRoutes.has(r.id));

  if (isPending) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Rutas con Precios Pendientes</CardTitle>
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
          <CardTitle>Rutas con Precios Pendientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            Error al cargar las rutas
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-warning" />
                Rutas con Precios Pendientes
                <Badge variant="destructive">{routes.length}</Badge>
              </CardTitle>
              <CardDescription>
                Rutas con precio placeholder ($1-$10) o margen negativo que requieren actualización
              </CardDescription>
            </div>
            {selectedRoutes.size > 0 && (
              <Button 
                onClick={() => setShowBulkAdjust(true)}
                className="gap-2"
              >
                <Calculator className="h-4 w-4" />
                Ajuste Masivo ({selectedRoutes.size})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {routes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <div className="text-4xl mb-4">🎉</div>
              <p className="font-medium">¡Excelente!</p>
              <p className="text-sm">No hay rutas con precios pendientes de actualización</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox 
                      checked={selectedRoutes.size === routes.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Ruta</TableHead>
                  <TableHead className="text-right">Precio</TableHead>
                  <TableHead className="text-right">Custodio</TableHead>
                  <TableHead className="text-center">Estado</TableHead>
                  <TableHead className="text-center">Días</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {routes.map((route) => (
                  <TableRow key={route.id} className={route.tiene_margen_negativo ? 'bg-destructive/5' : ''}>
                    <TableCell>
                      <Checkbox 
                        checked={selectedRoutes.has(route.id)}
                        onCheckedChange={(checked) => handleSelectRoute(route.id, !!checked)}
                      />
                    </TableCell>
                    <TableCell className="font-medium">{route.cliente_nombre}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-sm">
                        <span className="truncate max-w-[100px]">{route.origen_texto}</span>
                        <ArrowRight className="h-3 w-3 flex-shrink-0" />
                        <span className="truncate max-w-[100px]">{route.destino_texto}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      <span className={route.es_precio_placeholder ? 'text-destructive font-bold' : ''}>
                        ${route.valor_bruto.toLocaleString()}
                      </span>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      ${route.precio_custodio.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-center">
                      {route.es_precio_placeholder && (
                        <Badge variant="destructive" className="text-xs">
                          Placeholder
                        </Badge>
                      )}
                      {route.tiene_margen_negativo && !route.es_precio_placeholder && (
                        <Badge variant="outline" className="text-xs border-destructive text-destructive">
                          Margen -
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1 text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        <span className="text-xs">{route.dias_sin_actualizar}d</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingRoute(route)}
                        className="gap-1"
                      >
                        <Edit className="h-3 w-3" />
                        Editar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <QuickPriceEditModal
        open={!!editingRoute}
        onOpenChange={(open) => !open && setEditingRoute(null)}
        route={editingRoute}
        onSuccess={() => setSelectedRoutes(new Set())}
      />

      <BulkPriceAdjustModal
        open={showBulkAdjust}
        onOpenChange={setShowBulkAdjust}
        selectedRoutes={selectedRoutesData}
        onSuccess={() => setSelectedRoutes(new Set())}
      />
    </>
  );
}
