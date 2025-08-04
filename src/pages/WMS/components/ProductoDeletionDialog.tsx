import { useState } from 'react';
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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Archive, 
  Power, 
  Trash2, 
  AlertTriangle,
  Info,
  Archive as ArchiveIcon,
  XCircle
} from 'lucide-react';
import { ProductoInventario } from '@/types/wms';
import { useProductoActions } from '@/hooks/useProductoActions';

interface ProductoDeletionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  producto: ProductoInventario | null;
}

export const ProductoDeletionDialog = ({ 
  open, 
  onOpenChange, 
  producto 
}: ProductoDeletionDialogProps) => {
  const [selectedAction, setSelectedAction] = useState<'inactive' | 'delete' | 'archive' | null>(null);
  const [motivo, setMotivo] = useState('');
  
  const { marcarInactivo, eliminarProducto, archivarProducto } = useProductoActions();

  const handleAction = async () => {
    if (!producto || !selectedAction) return;

    try {
      switch (selectedAction) {
        case 'inactive':
          await marcarInactivo.mutateAsync({ 
            id: producto.id, 
            motivo: motivo || 'Marcado como inactivo desde interfaz' 
          });
          break;
        case 'delete':
          await eliminarProducto.mutateAsync(producto.id);
          break;
        case 'archive':
          await archivarProducto.mutateAsync({ 
            id: producto.id, 
            motivo: motivo || 'Producto archivado por obsolescencia' 
          });
          break;
      }
      onOpenChange(false);
      setSelectedAction(null);
      setMotivo('');
    } catch (error) {
      // El error ya se maneja en el hook
    }
  };

  const actionConfig = {
    inactive: {
      title: 'Marcar como Inactivo',
      description: 'El producto se desactivará pero mantendrá todo su historial de movimientos y datos.',
      icon: Power,
      color: 'warning',
      buttonText: 'Marcar como Inactivo',
      buttonVariant: 'secondary' as const
    },
    delete: {
      title: 'Eliminar Permanentemente',
      description: 'El producto se eliminará permanentemente del sistema. Esta acción NO se puede deshacer.',
      icon: Trash2,
      color: 'destructive',
      buttonText: 'Eliminar Permanentemente',
      buttonVariant: 'destructive' as const
    },
    archive: {
      title: 'Archivar Producto',
      description: 'El producto se archivará como obsoleto pero conservará todo su historial para auditoría.',
      icon: ArchiveIcon,
      color: 'secondary',
      buttonText: 'Archivar Producto',
      buttonVariant: 'outline' as const
    }
  };

  if (!selectedAction) {
    return (
      <AlertDialog open={open} onOpenChange={onOpenChange}>
        <AlertDialogContent className="max-w-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              ¿Qué deseas hacer con este producto?
            </AlertDialogTitle>
            <AlertDialogDescription>
              Selecciona una de las siguientes opciones para <strong>{producto?.nombre}</strong>:
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            {/* Opción 1: Marcar como inactivo */}
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedAction('inactive')}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-warning/10 text-warning">
                  <Power className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Opción 1: Marcar como Inactivo
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Recomendado para productos temporalmente fuera de uso que pueden reactivarse.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      Reversible
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Mantiene historial
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Opción 2: Eliminar permanentemente */}
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedAction('delete')}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-destructive/10 text-destructive">
                  <Trash2 className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Opción 2: Eliminar Permanentemente
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Solo disponible para productos sin movimientos de inventario ni números de serie.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="destructive" className="text-xs">
                      <XCircle className="h-3 w-3 mr-1" />
                      Irreversible
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Sin restricciones
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Opción 3: Archivar */}
            <div 
              className="p-4 border rounded-lg cursor-pointer hover:bg-accent/50 transition-colors"
              onClick={() => setSelectedAction('archive')}
            >
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary-foreground">
                  <Archive className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-1">
                    Opción 3: Archivar como Obsoleto
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    Ideal para productos descontinuados que necesitan mantener su historial completo.
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary" className="text-xs">
                      <Info className="h-3 w-3 mr-1" />
                      Auditable
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Historial completo
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  const config = actionConfig[selectedAction];
  const Icon = config.icon;

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2">
            <Icon className={`h-5 w-5 ${
              config.color === 'destructive' ? 'text-destructive' :
              config.color === 'warning' ? 'text-warning' : 'text-primary'
            }`} />
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {config.description}
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-4 py-4">
          <div className="p-3 rounded-lg bg-muted/50">
            <p className="text-sm font-medium">Producto seleccionado:</p>
            <p className="text-sm text-muted-foreground">{producto?.nombre}</p>
            <p className="text-xs text-muted-foreground font-mono">{producto?.codigo_producto}</p>
          </div>

          {selectedAction !== 'delete' && (
            <div className="space-y-2">
              <Label htmlFor="motivo">Motivo (opcional)</Label>
              <Textarea
                id="motivo"
                placeholder="Describe el motivo de esta acción..."
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                className="min-h-[80px]"
              />
            </div>
          )}
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel onClick={() => setSelectedAction(null)}>
            Volver
          </AlertDialogCancel>
          <AlertDialogAction 
            onClick={handleAction}
            className={config.buttonVariant === 'destructive' ? 'bg-destructive hover:bg-destructive/90' : ''}
            disabled={marcarInactivo.isPending || eliminarProducto.isPending || archivarProducto.isPending}
          >
            {(marcarInactivo.isPending || eliminarProducto.isPending || archivarProducto.isPending) 
              ? 'Procesando...' 
              : config.buttonText
            }
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};