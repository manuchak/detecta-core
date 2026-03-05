import { useStaleServiceCleanup } from '@/hooks/useStaleServiceCleanup';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const StaleServiceCleanup = () => {
  const { staleServices, isLoading, refetch, closeAll, isClosing } = useStaleServiceCleanup();

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Badge variant={staleServices.length > 0 ? "destructive" : "secondary"} className="text-base px-3 py-1">
            {staleServices.length} servicios estancados
          </Badge>
          {staleServices.length > 0 && (
            <p className="text-sm text-muted-foreground">
              Servicios iniciados hace &gt;48h sin actividad reciente
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            <RefreshCw className="h-4 w-4 mr-1" />
            Actualizar
          </Button>
          {staleServices.length > 0 && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm" disabled={isClosing}>
                  <Trash2 className="h-4 w-4 mr-1" />
                  Cerrar todos ({staleServices.length})
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-destructive" />
                    Confirmar cierre masivo
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    Se marcarán <strong>{staleServices.length} servicios</strong> como completados
                    y se insertará un evento "fin_servicio" automático. Esta acción no se puede deshacer.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => closeAll()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                    Sí, cerrar todos
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>

      {staleServices.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p className="text-lg font-medium">Sin servicios estancados</p>
          <p className="text-sm">Todos los servicios activos tienen actividad reciente</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID Servicio</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Custodio</TableHead>
                <TableHead>Inicio Real</TableHead>
                <TableHead>Última Actividad</TableHead>
                <TableHead>Inactivo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {staleServices.map((svc) => (
                <TableRow key={svc.id}>
                  <TableCell className="font-mono text-xs">{svc.id_servicio}</TableCell>
                  <TableCell>{svc.nombre_cliente || '—'}</TableCell>
                  <TableCell>{svc.custodio_asignado || '—'}</TableCell>
                  <TableCell className="text-xs">
                    {new Date(svc.hora_inicio_real).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell className="text-xs">
                    {new Date(svc.ultima_actividad).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs">
                      {formatDistanceToNow(new Date(svc.ultima_actividad), { locale: es, addSuffix: false })}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default StaleServiceCleanup;
