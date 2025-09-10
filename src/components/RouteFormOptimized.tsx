import { memo } from 'react';
import { RouteManagementForm } from '@/pages/Planeacion/components/RouteManagementForm';

interface RouteData {
  id?: string;
  cliente_nombre: string;
  destino_texto: string;
  origen_texto: string;
  tipo_servicio: string;
  tipo_viaje: string;
  dias_operacion: string;
  valor_bruto: number;
  precio_custodio: number;
  costo_operativo: number;
  costo_custodio: number;
  costo_maximo_casetas: number;
  pago_custodio_sin_arma: number;
  distancia_km: number;
  porcentaje_utilidad: number;
  fecha_vigencia: string;
  activo: boolean;
  observaciones: string;
  clave: string;
}

interface RouteFormOptimizedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingRoute?: RouteData | null;
  onRouteUpdated: () => void;
  hasPermission?: boolean;
}

// Componente memoizado que solo se re-renderiza cuando cambian las props relevantes
export const RouteFormOptimized = memo(({ 
  open, 
  onOpenChange, 
  editingRoute, 
  onRouteUpdated, 
  hasPermission = false 
}: RouteFormOptimizedProps) => {
  // Solo renderizar el formulario cuando el modal esté abierto
  if (!open) {
    return null;
  }

  return (
    <RouteManagementForm
      open={open}
      onOpenChange={onOpenChange}
      editingRoute={editingRoute}
      onRouteUpdated={onRouteUpdated}
    />
  );
}, (prevProps, nextProps) => {
  // Custom comparison para evitar re-renders innecesarios
  return (
    prevProps.open === nextProps.open &&
    prevProps.hasPermission === nextProps.hasPermission &&
    prevProps.editingRoute?.id === nextProps.editingRoute?.id &&
    prevProps.onOpenChange === nextProps.onOpenChange &&
    prevProps.onRouteUpdated === nextProps.onRouteUpdated
  );
});

RouteFormOptimized.displayName = 'RouteFormOptimized';