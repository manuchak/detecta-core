/**
 * Panel de alertas activas de checklists que requieren atención
 */
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  AlertTriangle,
  Clock,
  MapPinOff,
  Camera,
  Car,
  Phone,
  MessageCircle,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ServicioConChecklist, TipoAlertaChecklist } from '@/types/checklist';

interface ChecklistAlertPanelProps {
  servicios: ServicioConChecklist[];
  onVerDetalle: (servicio: ServicioConChecklist) => void;
}

const alertaIconos: Record<TipoAlertaChecklist, typeof AlertTriangle> = {
  sin_checklist_urgente: Clock,
  gps_fuera_rango: MapPinOff,
  gps_sin_datos: MapPinOff,
  item_critico_fallido: Car,
  fotos_incompletas: Camera,
};

const alertaColores: Record<TipoAlertaChecklist, string> = {
  sin_checklist_urgente: 'text-destructive bg-destructive/10',
  gps_fuera_rango: 'text-orange-600 bg-orange-500/10',
  gps_sin_datos: 'text-warning bg-warning/10',
  item_critico_fallido: 'text-destructive bg-destructive/10',
  fotos_incompletas: 'text-warning bg-warning/10',
};

export function ChecklistAlertPanel({
  servicios,
  onVerDetalle,
}: ChecklistAlertPanelProps) {
  // Filtrar solo servicios con alertas y ordenar por severidad
  const serviciosConAlertas = servicios
    .filter((s) => s.tieneAlerta)
    .sort((a, b) => {
      // Ordenar por severidad de la primera alerta
      const severidadOrden = { critica: 0, alta: 1, media: 2 };
      const aSeveridad = a.alertas[0]?.severidad || 'media';
      const bSeveridad = b.alertas[0]?.severidad || 'media';
      return severidadOrden[aSeveridad] - severidadOrden[bSeveridad];
    });

  if (serviciosConAlertas.length === 0) {
    return null;
  }

  return (
    <Card className="border-orange-500/30">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          Alertas Activas
          <Badge variant="destructive" className="ml-auto">
            {serviciosConAlertas.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="max-h-[300px]">
          <div className="divide-y">
            {serviciosConAlertas.map((servicio) => (
              <div
                key={servicio.servicioId}
                className="p-3 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">
                      {servicio.nombreCliente}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {servicio.custodioAsignado}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    {servicio.custodioTelefono && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        asChild
                      >
                        <a
                          href={`https://wa.me/52${servicio.custodioTelefono}`}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          <MessageCircle className="h-4 w-4 text-success" />
                        </a>
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => onVerDetalle(servicio)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1 mt-2">
                  {servicio.alertas.map((alerta, i) => {
                    const Icon = alertaIconos[alerta.tipo];
                    return (
                      <Badge
                        key={i}
                        variant="outline"
                        className={cn(
                          'text-xs py-0.5',
                          alertaColores[alerta.tipo]
                        )}
                      >
                        <Icon className="h-3 w-3 mr-1" />
                        {alerta.descripcion}
                      </Badge>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}