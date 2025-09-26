import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Phone, Car, AlertTriangle } from "lucide-react";
import type { CustodioEnriquecido } from "@/hooks/useCustodiosWithTracking";
import { useCustodioVehicleData } from "@/hooks/useCustodioVehicleData";

interface CustodioPerformanceCardProps {
  custodio: CustodioEnriquecido;
  onSelect?: (custodio: CustodioEnriquecido) => void;
  selected?: boolean;
  compact?: boolean;
  disabled?: boolean;
  availabilityStatus?: 'disponible' | 'parcialmente_ocupado' | 'ocupado' | 'no_disponible';
  unavailableReason?: string;
}

export const CustodioPerformanceCard = ({ 
  custodio, 
  onSelect, 
  selected = false,
  compact = false,
  disabled = false,
  availabilityStatus = 'disponible',
  unavailableReason
}: CustodioPerformanceCardProps) => {
  // Hook para obtener datos del vehículo
  const { formatVehicleInfo, loading: vehicleLoading } = useCustodioVehicleData(custodio.nombre);

  const getAvailabilityIndicator = () => {
    switch (availabilityStatus) {
      case 'disponible':
        return { color: 'success', label: 'Disponibles', icon: '🟢' };
      case 'parcialmente_ocupado':
        return { color: 'warning', label: 'Parcialmente ocupados', icon: '🟡' };
      case 'ocupado':
        return { color: 'warning', label: 'Ocupados', icon: '🟠' };
      case 'no_disponible':
        return { color: 'destructive', label: 'No disponibles', icon: '🔴' };
      default:
        return { color: 'muted', label: 'Sin información', icon: '⚪' };
    }
  };

  const availabilityInfo = getAvailabilityIndicator();
  const vehicleInfo = formatVehicleInfo();
  const scorePercentage = Math.round((custodio.score_total || 0) * 10);

  if (compact) {
    return (
      <div 
        className={`
          apple-card p-4 apple-hover-lift apple-press-scale transition-all duration-200
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${selected ? 'ring-2 ring-primary/50 border-primary/30 bg-primary/5' : ''}
        `}
        onClick={() => !disabled && onSelect?.(custodio)}
      >
        {/* Header: Nombre + Estado */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h4 className="apple-text-headline truncate text-foreground">
              {custodio.nombre}
            </h4>
          </div>
          <div className="flex items-center gap-1.5 ml-3">
            <span className="text-sm">{availabilityInfo.icon}</span>
            <span className="apple-text-footnote font-medium text-muted-foreground">
              {scorePercentage}%
            </span>
          </div>
        </div>

        {/* Info Row: Teléfono + Vehículo */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="apple-text-subheadline text-muted-foreground">
              {custodio.telefono}
            </span>
          </div>
          
          {vehicleInfo && !vehicleLoading && (
            <div className="flex items-center gap-1.5">
              <Car className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="apple-text-subheadline text-muted-foreground">
                {vehicleInfo}
              </span>
            </div>
          )}
        </div>

        {/* Status: Sin conflictos */}
        {!disabled && (
          <div className="mt-2 flex items-center gap-1.5">
            <div className={`w-1.5 h-1.5 rounded-full bg-${availabilityInfo.color}`} />
            <span className="apple-text-caption text-success">
              ✅ Sin conflictos
            </span>
          </div>
        )}
        
        {/* Mostrar razón si no está disponible */}
        {disabled && unavailableReason && (
          <div className="mt-3 flex items-start gap-2 p-2 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5" />
            <span className="apple-text-caption text-destructive">
              {unavailableReason}
            </span>
          </div>
        )}
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div 
        className={`
          apple-card p-6 apple-hover-lift apple-press-scale transition-all duration-200
          ${disabled ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}
          ${selected ? 'ring-2 ring-primary/50 border-primary/30 bg-primary/5' : ''}
        `}
        onClick={() => !disabled && onSelect?.(custodio)}
      >
        {/* Header: Nombre + Score */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1 min-w-0">
            <h3 className="apple-text-title truncate text-foreground">
              {custodio.nombre}
            </h3>
          </div>
          <div className="flex items-center gap-2 ml-4">
            <span className="text-lg">{availabilityInfo.icon}</span>
            <div className="text-right">
              <div className="apple-text-largetitle font-bold text-primary">
                {scorePercentage}%
              </div>
              <div className="apple-text-caption text-muted-foreground -mt-1">
                Compatibilidad
              </div>
            </div>
          </div>
        </div>

        {/* Info Row: Teléfono + Vehículo */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Phone className="h-4 w-4 text-muted-foreground" />
            <span className="apple-text-body text-muted-foreground">
              {custodio.telefono}
            </span>
          </div>
          
          {vehicleInfo && !vehicleLoading && (
            <div className="flex items-center gap-2">
              <Car className="h-4 w-4 text-muted-foreground" />
              <span className="apple-text-body text-muted-foreground">
                {vehicleInfo}
              </span>
            </div>
          )}
        </div>

        {/* Status */}
        {!disabled && (
          <div className="flex items-center gap-2 mb-4">
            <div className={`w-2 h-2 rounded-full bg-${availabilityInfo.color}`} />
            <span className="apple-text-callout text-success">
              ✅ Sin conflictos
            </span>
          </div>
        )}

        {/* Métricas compactas */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-left">
            <div className="apple-text-headline font-semibold">
              {Math.round(custodio.tasa_aceptacion || 0)}%
            </div>
            <div className="apple-text-caption text-muted-foreground">
              Aceptación
            </div>
          </div>
          <div className="text-right">
            <div className="apple-text-headline font-semibold">
              {Math.round(custodio.tasa_respuesta || 0)}%
            </div>
            <div className="apple-text-caption text-muted-foreground">
              Respuesta
            </div>
          </div>
        </div>

        {/* Información de ubicación si existe */}
        {custodio.zona_base && (
          <div className="apple-text-caption text-muted-foreground mb-2">
            📍 {custodio.zona_base}
          </div>
        )}
        
        {/* Mostrar razón si no está disponible */}
        {disabled && unavailableReason && (
          <div className="mt-4 flex items-start gap-3 p-3 bg-destructive/5 border border-destructive/20 rounded-lg">
            <AlertTriangle className="h-4 w-4 text-destructive mt-1" />
            <div>
              <div className="apple-text-callout font-medium text-destructive">
                No disponible
              </div>
              <div className="apple-text-caption text-destructive/80 mt-1">
                {unavailableReason}
              </div>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
};