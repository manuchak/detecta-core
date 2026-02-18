import React from 'react';
import { useNearMissCorrelation } from '@/hooks/security/useNearMissCorrelation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Crosshair, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const SEV_VARIANT: Record<string, 'destructive' | 'default' | 'secondary' | 'outline'> = {
  critica: 'destructive',
  alta: 'destructive',
  media: 'default',
  baja: 'secondary',
};

export function NearMissCorrelation() {
  const { data: nearMisses, isLoading } = useNearMissCorrelation();

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          <Crosshair className="h-4 w-4 text-muted-foreground" />
          Correlación Near-Miss (RRSS ↔ Operaciones)
        </CardTitle>
        <p className="text-xs text-muted-foreground">
          Incidentes en redes sociales dentro de 50km y ±48h de servicios planificados
        </p>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <Skeleton className="h-40 rounded-lg" />
        ) : !nearMisses?.length ? (
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <AlertTriangle className="h-8 w-8 mx-auto mb-1 opacity-30" />
              <p className="text-xs">Sin correlaciones near-miss detectadas</p>
              <p className="text-[10px]">Se requieren datos geocodificados en ambas tablas</p>
            </div>
          </div>
        ) : (
          <div className="max-h-[320px] overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs">Incidente RRSS</TableHead>
                  <TableHead className="text-xs">Severidad</TableHead>
                  <TableHead className="text-xs">Ubicación</TableHead>
                  <TableHead className="text-xs">Servicio</TableHead>
                  <TableHead className="text-xs text-right">Distancia</TableHead>
                  <TableHead className="text-xs text-right">Δ Tiempo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {nearMisses.map((nm, i) => (
                  <TableRow key={`${nm.rrssId}-${nm.servicioId}-${i}`}>
                    <TableCell className="text-xs">
                      <div>
                        <span className="font-medium">{nm.tipoIncidente}</span>
                        {nm.resumenAi && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1 max-w-[200px]">{nm.resumenAi}</p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={SEV_VARIANT[nm.severidad.toLowerCase()] || 'outline'} className="text-[10px]">
                        {nm.severidad}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {nm.ubicacion}
                      {nm.carretera && <span className="block text-[10px]">{nm.carretera}</span>}
                    </TableCell>
                    <TableCell className="text-xs">
                      <div>
                        <span className="font-medium">{nm.clienteNombre || 'Sin cliente'}</span>
                        <span className="block text-[10px] text-muted-foreground">
                          {nm.fechaServicio ? format(new Date(nm.fechaServicio), 'dd MMM yy', { locale: es }) : '—'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {nm.distanciaKm} km
                    </TableCell>
                    <TableCell className="text-xs text-right font-mono">
                      {nm.horasDiferencia}h
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
