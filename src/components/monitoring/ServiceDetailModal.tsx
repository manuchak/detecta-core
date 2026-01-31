import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  User, 
  Shield, 
  MapPin, 
  Clock, 
  FileText,
  Phone,
  CheckCircle2
} from "lucide-react";
import { useServicioDetalle } from "@/hooks/useServicioDetalle";
import { format } from "date-fns";
import { es } from "date-fns/locale";

interface ServiceDetailModalProps {
  serviceId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getStatusBadge = (estado: string) => {
  const statusConfig: Record<string, { label: string; className: string }> = {
    'posicionado': { 
      label: 'Posicionado', 
      className: 'bg-green-100 text-green-800 border-green-200' 
    },
    'en_camino': { 
      label: 'En Camino', 
      className: 'bg-amber-100 text-amber-800 border-amber-200' 
    },
    'por_salir': { 
      label: 'Por Salir', 
      className: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    'pendiente_custodio': { 
      label: 'Pendiente Custodio', 
      className: 'bg-gray-100 text-gray-800 border-gray-200' 
    },
    'asignado': { 
      label: 'Asignado', 
      className: 'bg-blue-100 text-blue-800 border-blue-200' 
    },
    'sin_asignar': { 
      label: 'Sin Asignar', 
      className: 'bg-red-100 text-red-800 border-red-200' 
    },
  };

  const config = statusConfig[estado] || { 
    label: estado, 
    className: 'bg-gray-100 text-gray-800' 
  };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

const formatDateTime = (dateString: string | null) => {
  if (!dateString) return '--';
  try {
    return format(new Date(dateString), "dd/MM/yyyy hh:mm a", { locale: es });
  } catch {
    return dateString;
  }
};

const LoadingSkeleton = () => (
  <div className="space-y-6">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      <Skeleton className="h-24" />
      <Skeleton className="h-24" />
    </div>
    <Skeleton className="h-20" />
    <Skeleton className="h-16" />
    <Skeleton className="h-24" />
  </div>
);

export const ServiceDetailModal = ({ 
  serviceId, 
  open, 
  onOpenChange 
}: ServiceDetailModalProps) => {
  const { data: servicio, isLoading } = useServicioDetalle(serviceId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="flex flex-row items-center justify-between gap-4 pr-8">
          <DialogTitle className="text-lg font-semibold">
            Servicio {servicio?.id_servicio || '...'}
          </DialogTitle>
          {servicio && getStatusBadge(servicio.estado_planeacion)}
        </DialogHeader>

        {isLoading ? (
          <LoadingSkeleton />
        ) : servicio ? (
          <div className="space-y-5 mt-2">
            {/* Cliente y Personal */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Cliente */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Cliente
                  </span>
                </div>
                <p className="font-semibold text-foreground">
                  {servicio.nombre_cliente || 'No especificado'}
                </p>
                {servicio.id_interno_cliente && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Ref: {servicio.id_interno_cliente}
                  </p>
                )}
                {servicio.telefono_cliente && (
                  <div className="flex items-center gap-1.5 mt-2 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5" />
                    {servicio.telefono_cliente}
                  </div>
                )}
              </div>

              {/* Personal Asignado */}
              <div className="rounded-lg border bg-muted/30 p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Personal Asignado
                  </span>
                </div>
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-muted-foreground">Custodio:</span>
                    <p className="font-medium text-foreground">
                      {servicio.custodio_asignado || 'Sin asignar'}
                    </p>
                  </div>
                  {servicio.requiere_armado && (
                    <div>
                      <span className="text-xs text-muted-foreground">Armado:</span>
                      <p className="font-medium text-foreground">
                        {servicio.armado_asignado || 'Sin asignar'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Ruta */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Ruta
                </span>
              </div>
              <div className="rounded-lg border bg-muted/30 p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground">Origen</span>
                    <p className="font-medium text-foreground">{servicio.origen}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-red-500 mt-1.5 shrink-0" />
                  <div>
                    <span className="text-xs text-muted-foreground">Destino</span>
                    <p className="font-medium text-foreground">{servicio.destino}</p>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Fecha y Hora + Configuración */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Fecha y Hora
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Cita:</span>
                    <span className="font-medium">{formatDateTime(servicio.fecha_hora_cita)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Inicio real:</span>
                    <span className="font-medium">{formatDateTime(servicio.hora_inicio_real)}</span>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
                  <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                    Configuración
                  </span>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium capitalize">{servicio.tipo_servicio}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Requiere armado:</span>
                    <span className="font-medium">{servicio.requiere_armado ? 'Sí' : 'No'}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Observaciones */}
            {servicio.observaciones && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      Observaciones
                    </span>
                  </div>
                  <div className="rounded-lg border bg-muted/30 p-4">
                    <p className="text-sm text-foreground whitespace-pre-wrap">
                      {servicio.observaciones}
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
        ) : (
          <p className="text-muted-foreground text-center py-8">
            No se encontró información del servicio.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ServiceDetailModal;
