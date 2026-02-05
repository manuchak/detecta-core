/**
 * Tabla de servicios con estado de checklist
 */
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  Eye,
  Phone,
  MapPin,
  Camera,
  AlertTriangle,
  CheckCircle2,
  Clock,
  XCircle,
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import type { ServicioConChecklist, FiltroChecklist } from '@/types/checklist';
import { filtrarServicios } from '@/hooks/useChecklistMonitoreo';

interface ChecklistServicesTableProps {
  servicios: ServicioConChecklist[];
  isLoading: boolean;
  filtro: FiltroChecklist;
  onVerDetalle: (servicio: ServicioConChecklist) => void;
}

const estadoConfig = {
  completo: {
    label: 'Completo',
    icon: CheckCircle2,
    clase: 'bg-success/10 text-success border-success/20',
  },
  pendiente: {
    label: 'Pendiente',
    icon: Clock,
    clase: 'bg-warning/10 text-warning border-warning/20',
  },
  incompleto: {
    label: 'Incompleto',
    icon: AlertTriangle,
    clase: 'bg-orange-500/10 text-orange-500 border-orange-500/20',
  },
  sin_checklist: {
    label: 'Sin Checklist',
    icon: XCircle,
    clase: 'bg-destructive/10 text-destructive border-destructive/20',
  },
};

function ServiceRow({
  servicio,
  onVerDetalle,
}: {
  servicio: ServicioConChecklist;
  onVerDetalle: () => void;
}) {
  const config = estadoConfig[servicio.checklistEstado];
  const Icon = config.icon;
  const esUrgente = servicio.minutosParaCita <= 60 && servicio.minutosParaCita > 0;

  return (
    <div
      className={cn(
        'p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors',
        esUrgente && servicio.checklistEstado === 'sin_checklist' && 'bg-destructive/5'
      )}
    >
      <div className="flex items-start justify-between gap-3">
        {/* Info principal */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium truncate">{servicio.nombreCliente}</span>
            {servicio.tieneAlerta && (
              <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
            )}
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {format(new Date(servicio.fechaHoraCita), 'HH:mm', { locale: es })}
            </span>
            {servicio.origen && (
              <span className="flex items-center gap-1 truncate max-w-[120px]">
                <MapPin className="h-3 w-3" />
                {servicio.origen}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-sm">{servicio.custodioAsignado}</span>
            {servicio.custodioTelefono && (
              <a
                href={`tel:${servicio.custodioTelefono}`}
                className="text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                <Phone className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        {/* Estado y métricas */}
        <div className="flex flex-col items-end gap-2">
          <Badge variant="outline" className={cn('text-xs', config.clase)}>
            <Icon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Camera className="h-3 w-3" />
              {servicio.fotosCount}/4
            </span>
            {servicio.alertasGps > 0 && (
              <span className="text-orange-500">
                {servicio.alertasGps} GPS
              </span>
            )}
          </div>
          <Button
            size="sm"
            variant="ghost"
            className="h-7 px-2"
            onClick={onVerDetalle}
          >
            <Eye className="h-4 w-4 mr-1" />
            Ver
          </Button>
        </div>
      </div>

      {/* Alertas expandidas */}
      {servicio.alertas.length > 0 && (
        <div className="mt-2 pt-2 border-t border-dashed">
          <div className="flex flex-wrap gap-1">
            {servicio.alertas.slice(0, 2).map((alerta, i) => (
              <Badge
                key={i}
                variant="outline"
                className={cn(
                  'text-xs',
                  alerta.severidad === 'critica'
                    ? 'border-destructive/50 text-destructive'
                    : alerta.severidad === 'alta'
                    ? 'border-orange-500/50 text-orange-500'
                    : 'border-warning/50 text-warning'
                )}
              >
                {alerta.descripcion}
              </Badge>
            ))}
            {servicio.alertas.length > 2 && (
              <Badge variant="outline" className="text-xs">
                +{servicio.alertas.length - 2} más
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function ChecklistServicesTable({
  servicios,
  isLoading,
  filtro,
  onVerDetalle,
}: ChecklistServicesTableProps) {
  const [busqueda, setBusqueda] = useState('');

  const serviciosFiltrados = useMemo(() => {
    let resultado = filtrarServicios(servicios, filtro);

    if (busqueda.trim()) {
      const termino = busqueda.toLowerCase();
      resultado = resultado.filter(
        (s) =>
          s.nombreCliente.toLowerCase().includes(termino) ||
          s.custodioAsignado.toLowerCase().includes(termino) ||
          s.idServicio.toLowerCase().includes(termino)
      );
    }

    // Ordenar: sin checklist urgentes primero, luego por hora
    return resultado.sort((a, b) => {
      // Priorizar sin checklist próximos
      const aUrgente =
        a.checklistEstado === 'sin_checklist' && a.minutosParaCita <= 60;
      const bUrgente =
        b.checklistEstado === 'sin_checklist' && b.minutosParaCita <= 60;
      if (aUrgente && !bUrgente) return -1;
      if (!aUrgente && bUrgente) return 1;

      // Luego por alertas
      if (a.tieneAlerta && !b.tieneAlerta) return -1;
      if (!a.tieneAlerta && b.tieneAlerta) return 1;

      // Finalmente por hora
      return (
        new Date(a.fechaHoraCita).getTime() -
        new Date(b.fechaHoraCita).getTime()
      );
    });
  }, [servicios, filtro, busqueda]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-10 w-full mb-4" />
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full mb-2" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Servicios del Turno</span>
          <Badge variant="secondary">{serviciosFiltrados.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cliente o custodio..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <ScrollArea className="h-[500px]">
          {serviciosFiltrados.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No hay servicios que coincidan con los filtros</p>
            </div>
          ) : (
            serviciosFiltrados.map((servicio) => (
              <ServiceRow
                key={servicio.servicioId}
                servicio={servicio}
                onVerDetalle={() => onVerDetalle(servicio)}
              />
            ))
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}