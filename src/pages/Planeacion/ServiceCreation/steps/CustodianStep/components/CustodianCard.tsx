/**
 * CustodianCard - Memoized card for performance
 * OPTIMIZED: Removed per-card vehicle fetch, uses pre-fetched data
 * ENHANCED: Added rejection persistence and service history display
 */

import { memo } from 'react';
import { Phone, MessageCircle, ArrowRight, Check, Car, AlertTriangle, CalendarX2, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodianCommunicationState } from '../types';

interface CustodianCardProps {
  custodio: CustodioConProximidad;
  selected: boolean;
  highlighted?: boolean;
  comunicacion?: CustodianCommunicationState;
  onSelect: () => void;
  onContact: (method: 'whatsapp' | 'llamada') => void;
  onReportUnavailability?: () => void;
  onReportRejection?: () => void; // 🆕 Persistir rechazo
  disabled?: boolean;
  style?: React.CSSProperties; // For react-window virtualization
}

function CustodianCardComponent({
  custodio,
  selected,
  highlighted = false,
  comunicacion,
  onSelect,
  onContact,
  onReportUnavailability,
  onReportRejection,
  disabled = false,
  style,
}: CustodianCardProps) {
  const hasAccepted = comunicacion?.status === 'acepta';
  const hasRejected = comunicacion?.status === 'rechaza';
  const isContacted = comunicacion && comunicacion.status !== 'pending';

  // Vehicle data - use pre-fetched from RPC instead of individual hook
  const vehicleInfo = custodio.vehiculo_info || null;

  // Availability status
  const availabilityStatus = custodio.categoria_disponibilidad || 'disponible';
  const getAvailabilityIcon = () => {
    switch (availabilityStatus) {
      case 'disponible': return '🟢';
      case 'parcialmente_ocupado': return '🟡';
      case 'ocupado': return '🟠';
      case 'no_disponible': return '🔴';
      default: return '⚪';
    }
  };

  const scorePercentage = Math.round(custodio.score_total || 0);

  // 🆕 Equity/workload badge based on balance_recommendation
  const getEquidadBadge = () => {
    const balance = custodio.datos_equidad?.balance_recommendation;
    if (!balance) return null;
    
    if (balance === 'ideal') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300 text-xs dark:bg-green-900/30 dark:text-green-400 dark:border-green-700">
          🎯 Priorizar
        </Badge>
      );
    }
    if (balance === 'evitar') {
      return (
        <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300 text-xs dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-700">
          ⚠️ Alta carga
        </Badge>
      );
    }
    return null;
  };

  // 🆕 Service history metrics
  const serviciosHoy = custodio.datos_equidad?.servicios_hoy || 0;
  const diasSinAsignar = custodio.datos_equidad?.dias_sin_asignar;
  const fechaUltimo = custodio.ultima_actividad 
    ? new Date(custodio.ultima_actividad).toLocaleDateString('es-MX', { day: 'numeric', month: 'short' })
    : null;

  return (
    <div style={style}>
      <div
        className={`
          apple-card overflow-hidden transition-all duration-200 mx-1
          ${highlighted ? 'ring-2 ring-primary ring-offset-2' : ''}
          ${selected ? 'ring-2 ring-primary/50 border-primary/30' : ''}
          ${hasRejected ? 'opacity-50' : ''}
          ${disabled ? 'opacity-60' : ''}
        `}
      >
        {/* Communication status badge (overlay) */}
        {isContacted && (
          <div className={`
            absolute -top-2 -right-2 z-10 px-2 py-0.5 rounded-full text-xs font-medium
            ${hasAccepted ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300' : ''}
            ${hasRejected ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300' : ''}
            ${!hasAccepted && !hasRejected ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300' : ''}
          `}>
            {hasAccepted && '✓ Aceptó'}
            {hasRejected && '✗ Rechazó'}
            {comunicacion?.status === 'contactar_despues' && '⏰ Llamar después'}
            {comunicacion?.status === 'sin_respuesta' && '📵 Sin respuesta'}
          </div>
        )}

        {/* ===== INFO ZONE ===== */}
        <div className="p-4">
          {/* Header: Name + Score + Equity Badge */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="apple-text-headline truncate text-foreground font-medium">
                  {custodio.nombre}
                </h4>
                {getEquidadBadge()}
              </div>
            </div>
            <div className="flex items-center gap-1.5 ml-3">
              <span className="text-sm">{getAvailabilityIcon()}</span>
              <span className="apple-text-footnote font-medium text-muted-foreground">
                {scorePercentage}% compat.
              </span>
            </div>
          </div>

          {/* Info Row: Phone + Vehicle */}
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span>{custodio.telefono}</span>
            </div>
            
            {vehicleInfo && (
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <Car className="h-3.5 w-3.5" />
                <span>{vehicleInfo}</span>
              </div>
            )}
          </div>

          {/* 🆕 Service History Row */}
          <div className="mt-2 flex items-center gap-3 text-xs text-muted-foreground">
            {serviciosHoy > 0 && (
              <div className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                <span><strong className="text-foreground">{serviciosHoy}</strong> hoy</span>
              </div>
            )}
            {fechaUltimo && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                <span>Último: <strong className="text-foreground">{fechaUltimo}</strong></span>
              </div>
            )}
            {diasSinAsignar !== undefined && diasSinAsignar > 3 && (
              <span className="text-amber-600">⏰ {diasSinAsignar}d sin asignar</span>
            )}
          </div>

          {/* Availability status */}
          {!disabled && !hasRejected && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="apple-text-caption text-success">
                ✅ Sin conflictos
              </span>
            </div>
          )}
          
          {/* Unavailable reason */}
          {disabled && custodio.razon_no_disponible && (
            <div className="mt-3 flex items-start gap-2 p-2 bg-destructive/5 border border-destructive/20 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive mt-0.5" />
              <span className="apple-text-caption text-destructive">
                {custodio.razon_no_disponible}
              </span>
            </div>
          )}
        </div>

        {/* ===== SEPARATOR ===== */}
        <div className="border-t border-border/50" />

        {/* ===== ACTIONS ZONE ===== */}
        <div className={`
          px-4 py-3 bg-muted/30 flex items-center gap-2
          ${hasRejected ? 'opacity-50 pointer-events-none' : ''}
        `}>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onContact('whatsapp');
            }}
            disabled={disabled || hasRejected}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            WhatsApp
          </Button>

          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground hover:text-foreground"
            onClick={(e) => {
              e.stopPropagation();
              onContact('llamada');
            }}
            disabled={disabled || hasRejected}
          >
            <Phone className="h-3.5 w-3.5" />
            Llamar
          </Button>

          {/* Unavailability button */}
          {onReportUnavailability && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-orange-600 hover:bg-orange-100 dark:hover:text-orange-400 dark:hover:bg-orange-900/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReportUnavailability();
                    }}
                    disabled={disabled || hasRejected}
                  >
                    <CalendarX2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">Reportar indisponibilidad</p>
                  <p className="text-xs text-muted-foreground">
                    Si el custodio indica que no estará disponible
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {/* 🆕 Rejection button - persists to DB */}
          {onReportRejection && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-red-100 dark:hover:text-red-400 dark:hover:bg-red-900/50"
                    onClick={(e) => {
                      e.stopPropagation();
                      onReportRejection();
                    }}
                    disabled={disabled || hasRejected}
                  >
                    <XCircle className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-medium">Registrar rechazo</p>
                  <p className="text-xs text-muted-foreground">
                    No mostrará este custodio por 7 días
                  </p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {hasAccepted ? (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-success/10 text-success text-xs font-medium">
              <Check className="h-3 w-3" />
              Asignado
            </div>
          ) : (
            <Button
              variant="default"
              size="sm"
              className="gap-1.5 ml-auto"
              onClick={(e) => {
                e.stopPropagation();
                onSelect();
              }}
              disabled={disabled || hasRejected}
            >
              Asignar
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

// Memoized export - only re-renders when relevant props change
export const CustodianCard = memo(CustodianCardComponent, (prevProps, nextProps) => {
  return (
    prevProps.custodio.id === nextProps.custodio.id &&
    prevProps.selected === nextProps.selected &&
    prevProps.highlighted === nextProps.highlighted &&
    prevProps.disabled === nextProps.disabled &&
    prevProps.comunicacion?.status === nextProps.comunicacion?.status
  );
});
