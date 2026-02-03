/**
 * CustodianCard - Memoized card for performance
 * OPTIMIZED: Removed per-card vehicle fetch, uses pre-fetched data
 * ENHANCED: Added rejection persistence, service history display, and Lucide icons
 * FIX: Added isMounted guard for animation to prevent memory leak
 * V2: Added ServiceHistoryBadges for enhanced visibility (days without service, type, 15d metrics)
 */

import { memo, useRef, useEffect, useCallback } from 'react';
import { 
  Phone, 
  MessageCircle, 
  ArrowRight, 
  Check, 
  Car, 
  AlertTriangle, 
  CalendarX2, 
  XCircle, 
  Circle,
  Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodianCommunicationState } from '../types';
import { ServiceHistoryBadges } from './ServiceHistoryBadges';

interface CustodianCardProps {
  custodio: CustodioConProximidad;
  selected: boolean;
  highlighted?: boolean;
  comunicacion?: CustodianCommunicationState;
  onSelect: () => void;
  onContact: (method: 'whatsapp' | 'llamada') => void;
  onReportUnavailability?: () => void;
  onReportRejection?: () => void;
  disabled?: boolean;
  style?: React.CSSProperties;
  tipoServicioActual?: 'local' | 'foraneo';
  variant?: 'default' | 'compact';
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
  tipoServicioActual,
  variant = 'default',
}: CustodianCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const isMountedRef = useRef(true);
  
  // Track mount state to prevent memory leak
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);
  
  const hasAccepted = comunicacion?.status === 'acepta';
  const hasRejected = comunicacion?.status === 'rechaza';
  const isContacted = comunicacion && comunicacion.status !== 'pending';

  // Vehicle data - use pre-fetched from RPC instead of individual hook
  const vehicleInfo = custodio.vehiculo_info || null;

  // Availability status with Lucide icons
  const availabilityStatus = custodio.categoria_disponibilidad || 'disponible';
  const getAvailabilityIcon = () => {
    switch (availabilityStatus) {
      case 'disponible': 
        return <Circle className="h-3.5 w-3.5 fill-success text-success" />;
      case 'parcialmente_ocupado': 
        return <Circle className="h-3.5 w-3.5 fill-warning text-warning" />;
      case 'ocupado': 
        return <Circle className="h-3.5 w-3.5 fill-chart-4 text-chart-4" />;
      case 'no_disponible': 
        return <Circle className="h-3.5 w-3.5 fill-destructive text-destructive" />;
      default: 
        return <Circle className="h-3.5 w-3.5 fill-muted text-muted-foreground" />;
    }
  };

  const scorePercentage = Math.round(custodio.score_total || 0);

  // Equity/workload badge with Lucide icons
  const getEquidadBadge = () => {
    const balance = custodio.datos_equidad?.balance_recommendation;
    if (!balance) return null;
    
    if (balance === 'ideal') {
      return (
        <Badge variant="outline" className="equity-badge-priorizar text-xs gap-1">
          <Target className="h-3 w-3" />
          Priorizar
        </Badge>
      );
    }
    if (balance === 'evitar') {
      return (
        <Badge variant="outline" className="equity-badge-alta-carga text-xs gap-1">
          <AlertTriangle className="h-3 w-3" />
          Alta carga
        </Badge>
      );
    }
    return null;
  };

  // Service history metrics - enhanced with new fields
  const serviciosHoy = custodio.datos_equidad?.servicios_hoy || 0;
  const diasSinAsignar = custodio.datos_equidad?.dias_sin_asignar ?? null;
  const fechaUltimoServicio = (custodio as any).fecha_ultimo_servicio || custodio.ultima_actividad || null;
  const tipoUltimoServicio = (custodio as any).tipo_ultimo_servicio || null;
  const preferenciaTipoServicio = (custodio as any).preferencia_tipo_servicio || 'indistinto';
  const serviciosLocales15d = (custodio as any).servicios_locales_15d || 0;
  const serviciosForaneos15d = (custodio as any).servicios_foraneos_15d || 0;

  // Animated rejection handler with mount guard to prevent memory leak
  const handleRejectWithAnimation = useCallback(async () => {
    if (cardRef.current) {
      cardRef.current.classList.add('animate-fade-out-left');
      await new Promise(resolve => setTimeout(resolve, 300));
    }
    // Only call callback if still mounted
    if (isMountedRef.current) {
      onReportRejection?.();
    }
  }, [onReportRejection]);

  // ========== COMPACT VARIANT ==========
  if (variant === 'compact') {
    return (
      <div style={style}>
        <div
          ref={cardRef}
          className={`
            flex items-center gap-3 p-3 rounded-lg border bg-card transition-all duration-200
            hover:bg-accent/50 hover:border-accent
            ${highlighted ? 'ring-2 ring-primary ring-offset-1' : ''}
            ${selected ? 'ring-2 ring-primary/50 border-primary/30 bg-primary/5' : ''}
            ${hasRejected ? 'opacity-50' : ''}
            ${disabled ? 'opacity-60' : ''}
          `}
        >
          {/* Info Section - Left */}
          <div className="flex-1 min-w-0">
            {/* Row 1: Name + Score + Equity Badge */}
            <div className="flex items-center gap-2 flex-wrap">
              {getAvailabilityIcon()}
              <span className="font-medium truncate text-sm">{custodio.nombre}</span>
              <span className="text-xs text-muted-foreground">{scorePercentage}%</span>
              {getEquidadBadge()}
              {hasAccepted && (
                <Badge className="text-[10px] bg-success/10 text-success border-success/30">
                  <Check className="h-2.5 w-2.5 mr-0.5" /> Asignado
                </Badge>
              )}
            </div>
            
            {/* Row 2: Phone + Vehicle + Service History */}
            <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
              <span className="flex items-center gap-1">
                <Phone className="h-3 w-3" />
                {custodio.telefono}
              </span>
              {vehicleInfo && (
                <span className="flex items-center gap-1">
                  <Car className="h-3 w-3" />
                  {vehicleInfo}
                </span>
              )}
              <ServiceHistoryBadges
                diasSinServicio={diasSinAsignar}
                tipoUltimoServicio={tipoUltimoServicio}
                fechaUltimoServicio={fechaUltimoServicio}
                serviciosLocales15d={serviciosLocales15d}
                serviciosForaneos15d={serviciosForaneos15d}
                preferenciaTipoServicio={preferenciaTipoServicio}
                tipoServicioActual={tipoServicioActual}
                compact
              />
            </div>
          </div>
          
          {/* Actions Section - Right */}
          <div className="flex items-center gap-1 flex-shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onContact('whatsapp'); }}
              disabled={disabled || hasRejected}
            >
              <MessageCircle className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={(e) => { e.stopPropagation(); onContact('llamada'); }}
              disabled={disabled || hasRejected}
            >
              <Phone className="h-3.5 w-3.5" />
            </Button>
            
            {onReportUnavailability && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-warning hover:bg-warning/10"
                onClick={(e) => { e.stopPropagation(); onReportUnavailability(); }}
                disabled={disabled || hasRejected}
              >
                <CalendarX2 className="h-3.5 w-3.5" />
              </Button>
            )}
            
            {onReportRejection && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                onClick={(e) => { e.stopPropagation(); handleRejectWithAnimation(); }}
                disabled={disabled || hasRejected}
              >
                <XCircle className="h-3.5 w-3.5" />
              </Button>
            )}
            
            {!hasAccepted && (
              <Button
                size="sm"
                className="h-7 text-xs ml-1"
                onClick={(e) => { e.stopPropagation(); onSelect(); }}
                disabled={disabled || hasRejected}
              >
                Asignar
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ========== DEFAULT VARIANT ==========
  return (
    <div style={style}>
      <div
        ref={cardRef}
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
            ${hasAccepted ? 'bg-success/10 text-success' : ''}
            ${hasRejected ? 'bg-destructive/10 text-destructive' : ''}
            ${!hasAccepted && !hasRejected ? 'bg-warning/10 text-warning' : ''}
          `}>
            {hasAccepted && <span className="flex items-center gap-1"><Check className="h-3 w-3" /> Aceptó</span>}
            {hasRejected && <span className="flex items-center gap-1"><XCircle className="h-3 w-3" /> Rechazó</span>}
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
              {getAvailabilityIcon()}
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

          {/* Enhanced Service History Row with new badges */}
          <div className="mt-3">
            <ServiceHistoryBadges
              diasSinServicio={diasSinAsignar}
              tipoUltimoServicio={tipoUltimoServicio}
              fechaUltimoServicio={fechaUltimoServicio}
              serviciosLocales15d={serviciosLocales15d}
              serviciosForaneos15d={serviciosForaneos15d}
              preferenciaTipoServicio={preferenciaTipoServicio}
              tipoServicioActual={tipoServicioActual}
            />
            {serviciosHoy > 0 && (
              <div className="mt-1.5 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">{serviciosHoy}</span> servicios hoy
              </div>
            )}
          </div>

          {/* Availability status */}
          {!disabled && !hasRejected && (
            <div className="mt-2 flex items-center gap-1.5">
              <span className="apple-text-caption text-success flex items-center gap-1">
                <Check className="h-3 w-3" /> Sin conflictos
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
                    className="h-8 w-8 text-muted-foreground hover:text-warning hover:bg-warning/10"
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

          {/* Rejection button with animation */}
          {onReportRejection && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRejectWithAnimation();
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
