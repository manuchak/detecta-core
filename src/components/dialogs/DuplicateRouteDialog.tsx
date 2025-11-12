import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';

interface DuplicateRouteDialogProps {
  open: boolean;
  existingRoute: {
    id: string;
    cliente_nombre: string;
    destino_texto: string;
    valor_bruto: number;
    precio_custodio: number;
    distancia_km: number;
    activo: boolean;
  };
  newData: {
    destino_texto: string;
    valor_bruto: number;
    precio_custodio: number;
    distancia_km: number;
  };
  onConfirm: () => void;
  onCancel: () => void;
}

export function DuplicateRouteDialog({
  open,
  existingRoute,
  newData,
  onConfirm,
  onCancel,
}: DuplicateRouteDialogProps) {
  const hasDifferences = 
    existingRoute.valor_bruto !== newData.valor_bruto ||
    existingRoute.precio_custodio !== newData.precio_custodio ||
    existingRoute.distancia_km !== newData.distancia_km;

  return (
    <AlertDialog open={open}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>⚠️ Ruta Duplicada Detectada</AlertDialogTitle>
          <AlertDialogDescription>
            Ya existe una ruta para <strong>{existingRoute.cliente_nombre}</strong> con destino{' '}
            <strong>{existingRoute.destino_texto}</strong>.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          {hasDifferences ? (
            <>
              <p className="text-sm text-muted-foreground">
                ¿Deseas actualizar la ruta existente con los nuevos valores?
              </p>
              
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="space-y-2">
                    <div className="font-medium text-muted-foreground">Ruta Existente</div>
                    <div className="space-y-1 p-3 rounded-lg bg-muted/50 border">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Bruto:</span>
                        <span className="font-medium">${existingRoute.valor_bruto.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Custodio:</span>
                        <span className="font-medium">${existingRoute.precio_custodio.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distancia:</span>
                        <span className="font-medium">{existingRoute.distancia_km} km</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="font-medium text-muted-foreground">Nuevos Valores</div>
                    <div className="space-y-1 p-3 rounded-lg bg-primary/10 border border-primary/20">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Valor Bruto:</span>
                        <span className="font-medium">${newData.valor_bruto.toFixed(2)}</span>
                        {existingRoute.valor_bruto !== newData.valor_bruto && (
                          <Badge variant="secondary" className="ml-1">
                            {newData.valor_bruto > existingRoute.valor_bruto ? '↑' : '↓'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Precio Custodio:</span>
                        <span className="font-medium">${newData.precio_custodio.toFixed(2)}</span>
                        {existingRoute.precio_custodio !== newData.precio_custodio && (
                          <Badge variant="secondary" className="ml-1">
                            {newData.precio_custodio > existingRoute.precio_custodio ? '↑' : '↓'}
                          </Badge>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Distancia:</span>
                        <span className="font-medium">{newData.distancia_km} km</span>
                        {existingRoute.distancia_km !== newData.distancia_km && (
                          <Badge variant="secondary" className="ml-1">
                            {newData.distancia_km > existingRoute.distancia_km ? '↑' : '↓'}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Los valores son idénticos a la ruta existente. No es necesario actualizarla.
            </p>
          )}

          {!existingRoute.activo && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-sm text-amber-800 dark:text-amber-200">
                ⚠️ Nota: La ruta existente está <strong>inactiva</strong>. Al actualizar se reactivará automáticamente.
              </p>
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancelar
          </AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>
            {hasDifferences ? 'Actualizar Ruta' : 'Continuar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
