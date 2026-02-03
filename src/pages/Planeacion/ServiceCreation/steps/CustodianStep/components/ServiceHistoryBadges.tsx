/**
 * ServiceHistoryBadges - Displays service history metrics on CustodianCard
 * Shows: days without service, last service type, 15-day activity metrics
 */

import { memo } from 'react';
import { Calendar, Home, Plane, BarChart3, HelpCircle, AlertTriangle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { differenceInDays } from 'date-fns';

export interface ServiceHistoryBadgesProps {
  diasSinServicio: number | null;
  tipoUltimoServicio: 'local' | 'foraneo' | null;
  fechaUltimoServicio: string | null;
  serviciosLocales15d: number;
  serviciosForaneos15d: number;
  preferenciaTipoServicio?: 'local' | 'foraneo' | 'indistinto';
  tipoServicioActual?: 'local' | 'foraneo';
}

/**
 * Get color class based on days without service
 * 0-3 días: Verde (activo)
 * 4-7 días: Amarillo (alerta)
 * 8-14 días: Naranja (atención)
 * 15+ días: Rojo (crítico)
 */
function getDaysColorClass(days: number | null): string {
  if (days === null) return 'text-muted-foreground';
  if (days <= 3) return 'text-success';
  if (days <= 7) return 'text-warning';
  if (days <= 14) return 'text-orange-500';
  return 'text-destructive';
}

function getDaysBgClass(days: number | null): string {
  if (days === null) return 'bg-muted/50';
  if (days <= 3) return 'bg-success/10';
  if (days <= 7) return 'bg-warning/10';
  if (days <= 14) return 'bg-orange-500/10';
  return 'bg-destructive/10';
}

function ServiceHistoryBadgesComponent({
  diasSinServicio,
  tipoUltimoServicio,
  fechaUltimoServicio,
  serviciosLocales15d,
  serviciosForaneos15d,
  preferenciaTipoServicio = 'indistinto',
  tipoServicioActual
}: ServiceHistoryBadgesProps) {
  // Calculate days since last service if not provided
  const calculatedDays = diasSinServicio ?? (
    fechaUltimoServicio 
      ? differenceInDays(new Date(), new Date(fechaUltimoServicio))
      : null
  );

  const formatFechaCorta = (fecha: string | null) => {
    if (!fecha) return null;
    return new Date(fecha).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' });
  };

  // Check for preference mismatch
  const hasMismatch = preferenciaTipoServicio !== 'indistinto' && 
                      tipoServicioActual && 
                      preferenciaTipoServicio !== tipoServicioActual;

  const totalServicios15d = serviciosLocales15d + serviciosForaneos15d;

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {/* Days without service */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${getDaysBgClass(calculatedDays)} ${getDaysColorClass(calculatedDays)}`}>
              <Calendar className="h-3 w-3" />
              <span className="font-medium">
                {calculatedDays !== null ? `${calculatedDays}d` : '-'}
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Días sin servicio</p>
            <p className="text-xs text-muted-foreground">
              {calculatedDays !== null 
                ? calculatedDays === 0 
                  ? 'Tuvo servicio hoy'
                  : `${calculatedDays} días desde el último servicio`
                : 'Sin datos de último servicio'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Last service type */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md ${
              tipoUltimoServicio === 'local' 
                ? 'bg-blue-500/10 text-blue-600' 
                : tipoUltimoServicio === 'foraneo' 
                  ? 'bg-emerald-500/10 text-emerald-600' 
                  : 'bg-muted/50 text-muted-foreground'
            }`}>
              {tipoUltimoServicio === 'local' ? (
                <Home className="h-3 w-3" />
              ) : tipoUltimoServicio === 'foraneo' ? (
                <Plane className="h-3 w-3" />
              ) : (
                <HelpCircle className="h-3 w-3" />
              )}
              <span className="font-medium uppercase">
                {tipoUltimoServicio ? tipoUltimoServicio.substring(0, 3) : '-'}
              </span>
              {fechaUltimoServicio && (
                <span className="text-[10px] opacity-70">
                  ({formatFechaCorta(fechaUltimoServicio)})
                </span>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Último servicio</p>
            <p className="text-xs text-muted-foreground">
              {tipoUltimoServicio 
                ? `Tipo: ${tipoUltimoServicio === 'local' ? 'Local (< 100km)' : 'Foráneo (> 100km)'}`
                : 'Sin datos del tipo de servicio'}
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* 15-day activity */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-md bg-muted/50 text-muted-foreground`}>
              <BarChart3 className="h-3 w-3" />
              <span className="font-medium">
                15d: {serviciosLocales15d}L / {serviciosForaneos15d}F
              </span>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            <p className="font-medium">Últimos 15 días</p>
            <div className="text-xs text-muted-foreground space-y-1 mt-1">
              <p>• {serviciosLocales15d} servicios locales</p>
              <p>• {serviciosForaneos15d} servicios foráneos</p>
              <p className="pt-1 border-t border-border/50">
                Total: {totalServicios15d} servicios
              </p>
            </div>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Preference badge - only show if not 'indistinto' */}
      {preferenciaTipoServicio !== 'indistinto' && (
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge 
                variant="outline" 
                className={`gap-1 text-[10px] px-1.5 py-0.5 ${
                  hasMismatch 
                    ? 'border-warning text-warning bg-warning/10'
                    : preferenciaTipoServicio === 'local'
                      ? 'border-blue-500 text-blue-600'
                      : 'border-emerald-500 text-emerald-600'
                }`}
              >
                {hasMismatch && <AlertTriangle className="h-2.5 w-2.5" />}
                {preferenciaTipoServicio === 'local' ? (
                  <><Home className="h-2.5 w-2.5" /> Pref. Local</>
                ) : (
                  <><Plane className="h-2.5 w-2.5" /> Pref. Foráneo</>
                )}
              </Badge>
            </TooltipTrigger>
            <TooltipContent>
              <p className="font-medium">Preferencia de servicio</p>
              <p className="text-xs text-muted-foreground">
                {preferenciaTipoServicio === 'local' 
                  ? 'Prefiere servicios locales (< 100km)'
                  : 'Prefiere servicios foráneos (> 100km)'}
              </p>
              {hasMismatch && (
                <p className="text-xs text-warning mt-1">
                  ⚠️ Este servicio es {tipoServicioActual}, no coincide con su preferencia
                </p>
              )}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      )}
    </div>
  );
}

export const ServiceHistoryBadges = memo(ServiceHistoryBadgesComponent);
