/**
 * RouteSummary - Compact summary of route data for ServiceStep
 */

import { Building2, MapPin, Ruler } from 'lucide-react';
import { PricingResultData } from '../../../hooks/useServiceCreation';

interface RouteSummaryProps {
  pricingResult: PricingResultData | null;
  clienteNombre?: string;
}

export function RouteSummary({ pricingResult, clienteNombre }: RouteSummaryProps) {
  if (!pricingResult) return null;

  const formatCurrency = (value: number | null) => {
    if (!value) return '—';
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div className="p-3 rounded-lg bg-muted/50 border flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
      {/* Client */}
      <div className="flex items-center gap-1.5">
        <Building2 className="h-4 w-4 text-muted-foreground" />
        <span className="font-medium">
          {clienteNombre || pricingResult.cliente_nombre}
        </span>
      </div>

      {/* Route */}
      <div className="flex items-center gap-1.5">
        <MapPin className="h-4 w-4 text-muted-foreground" />
        <span>
          {pricingResult.origen_texto} → {pricingResult.destino_texto}
        </span>
      </div>

      {/* Distance */}
      {pricingResult.distancia_km && (
        <div className="flex items-center gap-1.5">
          <Ruler className="h-4 w-4 text-muted-foreground" />
          <span>{Math.round(pricingResult.distancia_km)} km</span>
        </div>
      )}

      {/* Price */}
      {pricingResult.precio_sugerido && (
        <div className="ml-auto font-medium text-primary">
          {formatCurrency(pricingResult.precio_sugerido)}
        </div>
      )}
    </div>
  );
}
