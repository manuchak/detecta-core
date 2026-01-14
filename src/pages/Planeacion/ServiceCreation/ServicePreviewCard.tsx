import { MapPin, Calendar, Clock, User, Shield, Package } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useServiceCreation } from './hooks/useServiceCreation';

export default function ServicePreviewCard() {
  const { formData, completedSteps } = useServiceCreation();

  // Only show preview when we have some data
  const hasData = formData.cliente || formData.origen || formData.fecha;

  if (!hasData) {
    return (
      <div className="apple-card p-4 border-dashed border-2 border-muted">
        <div className="text-center text-muted-foreground text-sm py-4">
          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
          <p>La vista previa del servicio aparecerá aquí</p>
        </div>
      </div>
    );
  }

  return (
    <div className="apple-card p-4 space-y-3">
      <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Vista Previa
      </h4>

      {/* Service preview card - mimics the actual service card */}
      <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-lg p-3 space-y-2.5 border border-primary/20">
        {/* Client */}
        {formData.cliente && (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-xs font-bold text-primary">
                {formData.cliente.charAt(0).toUpperCase()}
              </span>
            </div>
            <span className="font-medium text-sm truncate">{formData.cliente}</span>
          </div>
        )}

        {/* Route */}
        {(formData.origen || formData.destino) && (
          <div className="flex items-start gap-2 text-xs">
            <MapPin className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              {formData.origen && (
                <div className="truncate">{formData.origen}</div>
              )}
              {formData.destino && (
                <div className="truncate text-muted-foreground">
                  → {formData.destino}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Date and time */}
        {(formData.fecha || formData.hora) && (
          <div className="flex items-center gap-3 text-xs">
            {formData.fecha && (
              <div className="flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formData.fecha}</span>
              </div>
            )}
            {formData.hora && (
              <div className="flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                <span>{formData.hora}</span>
              </div>
            )}
          </div>
        )}

        {/* Custodian */}
        {formData.custodio && (
          <div className="flex items-center gap-2 text-xs">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{formData.custodio}</span>
          </div>
        )}

        {/* Armed guard */}
        {formData.armado && (
          <div className="flex items-center gap-2 text-xs">
            <Shield className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="truncate">{formData.armado}</span>
          </div>
        )}

        {/* Status indicator */}
        <div className="pt-1 border-t border-primary/20">
          <div className={cn(
            "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium",
            completedSteps.length < 2 
              ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
              : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
          )}>
            <span className={cn(
              "w-1.5 h-1.5 rounded-full",
              completedSteps.length < 2 ? "bg-amber-500" : "bg-blue-500"
            )} />
            {completedSteps.length < 2 ? 'En progreso' : 'Casi listo'}
          </div>
        </div>
      </div>
    </div>
  );
}
