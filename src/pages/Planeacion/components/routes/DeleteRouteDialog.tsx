import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { PendingPriceRoute } from '@/hooks/useRoutesWithPendingPrices';
import { Trash2, AlertTriangle, ArrowRight } from 'lucide-react';

interface DeleteRouteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  routes: PendingPriceRoute[];
  onSuccess?: () => void;
}

const DELETE_REASONS = [
  { id: 'cliente_rechazo', label: 'Cliente rechazó/desechó la ruta' },
  { id: 'sin_uso_120d', label: 'Sin servicios en +120 días' },
  { id: 'duplicada', label: 'Ruta duplicada' },
  { id: 'error_captura', label: 'Error de captura' },
  { id: 'otro', label: 'Otro motivo' },
];

export function DeleteRouteDialog({ open, onOpenChange, routes, onSuccess }: DeleteRouteDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [customReason, setCustomReason] = useState('');
  const queryClient = useQueryClient();

  const handleDelete = async () => {
    if (!selectedReason) {
      toast.error('Selecciona un motivo de eliminación');
      return;
    }

    const reason = selectedReason === 'otro' ? customReason : DELETE_REASONS.find(r => r.id === selectedReason)?.label;
    
    if (selectedReason === 'otro' && !customReason.trim()) {
      toast.error('Describe el motivo de eliminación');
      return;
    }

    setIsDeleting(true);
    try {
      // Soft delete: set activo = false instead of hard delete
      const { error } = await supabase
        .from('matriz_precios_rutas')
        .update({ 
          activo: false,
          notas: `[ELIMINADA ${new Date().toLocaleDateString('es-MX')}] ${reason}`
        })
        .in('id', routes.map(r => r.id));

      if (error) throw error;

      toast.success(`${routes.length} ruta${routes.length > 1 ? 's' : ''} eliminada${routes.length > 1 ? 's' : ''} correctamente`);
      
      // Invalidate queries
      queryClient.invalidateQueries({ queryKey: ['routes-pending-prices'] });
      queryClient.invalidateQueries({ queryKey: ['routes-stats'] });
      queryClient.invalidateQueries({ queryKey: ['all-routes'] });
      queryClient.invalidateQueries({ queryKey: ['price-history'] });
      
      onSuccess?.();
      onOpenChange(false);
      setSelectedReason('');
      setCustomReason('');
    } catch (error) {
      console.error('Error deleting routes:', error);
      toast.error('Error al eliminar las rutas');
    } finally {
      setIsDeleting(false);
    }
  };

  const isSingleRoute = routes.length === 1;
  const route = routes[0];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            Eliminar {isSingleRoute ? 'Ruta' : `${routes.length} Rutas`}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                {isSingleRoute 
                  ? 'Esta acción desactivará la ruta del sistema. No se podrá usar para cotizaciones futuras.'
                  : `Esta acción desactivará ${routes.length} rutas del sistema.`
                }
              </p>

              {isSingleRoute && route && (
                <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                  <p className="font-medium text-sm">{route.cliente_nombre}</p>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span className="truncate max-w-[120px]">{route.origen_texto}</span>
                    <ArrowRight className="h-3 w-3 flex-shrink-0" />
                    <span className="truncate max-w-[120px]">{route.destino_texto}</span>
                  </div>
                  <div className="flex gap-2">
                    {route.es_precio_placeholder && (
                      <Badge variant="destructive" className="text-xs">Placeholder</Badge>
                    )}
                    {route.dias_sin_actualizar > 120 && (
                      <Badge variant="outline" className="text-xs">+120 días sin uso</Badge>
                    )}
                  </div>
                </div>
              )}

              {!isSingleRoute && (
                <div className="bg-muted/50 rounded-lg p-3">
                  <div className="flex items-center gap-2 text-warning mb-2">
                    <AlertTriangle className="h-4 w-4" />
                    <span className="text-sm font-medium">Eliminación masiva</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Se eliminarán rutas de {new Set(routes.map(r => r.cliente_nombre)).size} cliente(s) diferentes.
                  </p>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-sm font-medium">Motivo de eliminación:</p>
                <div className="space-y-2">
                  {DELETE_REASONS.map((reason) => (
                    <div key={reason.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={reason.id}
                        checked={selectedReason === reason.id}
                        onCheckedChange={(checked) => {
                          if (checked) setSelectedReason(reason.id);
                        }}
                      />
                      <Label 
                        htmlFor={reason.id} 
                        className="text-sm font-normal cursor-pointer"
                      >
                        {reason.label}
                      </Label>
                    </div>
                  ))}
                </div>

                {selectedReason === 'otro' && (
                  <Textarea
                    placeholder="Describe el motivo..."
                    value={customReason}
                    onChange={(e) => setCustomReason(e.target.value)}
                    className="mt-2"
                    rows={2}
                  />
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancelar</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={isDeleting || !selectedReason}
            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
          >
            {isDeleting ? 'Eliminando...' : 'Eliminar'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
