import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { ServicioFacturacion } from '../hooks/useServiciosFacturacion';
import { formatCurrency } from '@/utils/formatUtils';
import { formatCDMXTime } from '@/utils/cdmxTimezone';
import { formatTiempoRetrasoDisplay, parsePostgresInterval } from '@/utils/timeUtils';
import {
  FileText,
  MapPin,
  Clock,
  User,
  Shield,
  Truck,
  Navigation,
  DollarSign,
  Radio,
  Calendar,
  Phone,
  Car,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

interface ServicioDetalleDialogProps {
  servicio: ServicioFacturacion | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServicioDetalleDialog({
  servicio,
  open,
  onOpenChange,
}: ServicioDetalleDialogProps) {
  if (!servicio) return null;

  const formatDateTime = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return formatCDMXTime(dateStr, 'dd/MM/yyyy HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatTimeOnly = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      return formatCDMXTime(dateStr, 'HH:mm');
    } catch {
      return dateStr;
    }
  };

  const formatDuracion = (duracion: string | null) => {
    if (!duracion) return '-';
    const match = duracion.match(/^(-?)(\d+):(\d+):(\d+)/);
    if (!match) return duracion;
    
    const [, negativo, horas, minutos] = match;
    const h = parseInt(horas);
    const m = parseInt(minutos);
    
    if (h === 0 && m === 0) return '< 1m';
    if (h > 0) return `${negativo}${h}h ${m}m`;
    return `${negativo}${m}m`;
  };

  const getEstadoBadgeVariant = (estado: string) => {
    switch (estado) {
      case 'Finalizado': return 'default';
      case 'En ruta': return 'secondary';
      case 'En Espera': return 'outline';
      case 'Cancelado':
      case 'Cancelado por cliente': return 'destructive';
      default: return 'outline';
    }
  };

  const getRetrasoStyle = (retraso: string | null) => {
    if (!retraso) return '';
    const tiempo = parsePostgresInterval(retraso);
    if (!tiempo) return '';
    
    const totalMinutos = tiempo.horas * 60 + tiempo.minutos;
    
    if (tiempo.esNegativo || totalMinutos === 0) {
      return 'text-primary';
    } else if (totalMinutos > 30) {
      return 'text-destructive';
    } else if (totalMinutos > 15) {
      return 'text-warning';
    }
    return '';
  };

  const getMargenStyle = (porcentaje: number | null) => {
    if (porcentaje === null) return '';
    if (porcentaje >= 40) return 'text-primary';
    if (porcentaje < 20) return 'text-destructive';
    return '';
  };

  const SectionHeader = ({ icon: Icon, title }: { icon: React.ElementType; title: string }) => (
    <div className="flex items-center gap-2 mb-2">
      <Icon className="h-4 w-4 text-primary" />
      <h3 className="font-semibold text-sm text-foreground">{title}</h3>
    </div>
  );

  const InfoItem = ({ label, value, className = '' }: { label: string; value: React.ReactNode; className?: string }) => (
    <div className="space-y-0.5">
      <p className="text-[10px] text-muted-foreground uppercase tracking-wide">{label}</p>
      <p className={`text-sm ${className}`}>{value || '-'}</p>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              {servicio.folio_saphiro}
            </DialogTitle>
            <Badge variant={getEstadoBadgeVariant(servicio.estado)} className="text-xs">
              {servicio.estado}
            </Badge>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[calc(90vh-100px)]">
          <div className="px-6 pb-6 space-y-4">
            {/* Identificación */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={FileText} title="Identificación" />
                <div className="grid grid-cols-4 gap-4">
                  <InfoItem label="Folio Saphiro" value={servicio.folio_saphiro} className="font-mono font-medium" />
                  <InfoItem label="Ref. Cliente" value={servicio.referencia_cliente} />
                  <InfoItem label="Folio Cliente" value={servicio.folio_cliente} />
                  <InfoItem label="ID Interno" value={servicio.id_interno_cliente} />
                </div>
              </CardContent>
            </Card>

            {/* Cliente y Ruta */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={MapPin} title="Cliente y Ruta" />
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <InfoItem label="Cliente" value={servicio.nombre_cliente} className="font-medium" />
                  <InfoItem label="Ruta" value={servicio.ruta} className="font-medium" />
                  <div className="flex gap-2">
                    <InfoItem 
                      label="Local/Foráneo" 
                      value={
                        <Badge variant="outline" className="text-xs">
                          {servicio.local_foraneo}
                        </Badge>
                      } 
                    />
                    <InfoItem 
                      label="Tipo Servicio" 
                      value={
                        <Badge variant="secondary" className="text-xs">
                          {servicio.tipo_servicio}
                        </Badge>
                      } 
                    />
                  </div>
                </div>
                <Separator className="my-3" />
                <div className="grid grid-cols-2 gap-4">
                  <InfoItem label="Origen" value={servicio.origen} />
                  <InfoItem label="Destino" value={servicio.destino} />
                </div>
              </CardContent>
            </Card>

            {/* Timeline Planeación */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={Calendar} title="Timeline Planeación" />
                <div className="grid grid-cols-4 gap-4">
                  <InfoItem label="Fecha Recepción" value={formatDateTime(servicio.fecha_recepcion)} />
                  <InfoItem label="Fecha Asignación" value={formatDateTime(servicio.fecha_asignacion)} />
                  <InfoItem label="Asignación Armado" value={formatDateTime(servicio.fecha_asignacion_armado)} />
                  <InfoItem 
                    label="Estado Planeación" 
                    value={
                      servicio.estado_planeacion ? (
                        <Badge variant="outline" className="text-xs">
                          {servicio.estado_planeacion}
                        </Badge>
                      ) : '-'
                    } 
                  />
                </div>
              </CardContent>
            </Card>

            {/* Timeline Operativo */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={Clock} title="Timeline Operativo" />
                <div className="grid grid-cols-7 gap-3 text-center">
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Fecha Cita</p>
                    <p className="text-sm font-medium">{formatDateTime(servicio.fecha_hora_cita)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Presentación</p>
                    <p className="text-sm font-mono">{formatTimeOnly(servicio.hora_presentacion)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Inicio</p>
                    <p className="text-sm font-mono">{formatTimeOnly(servicio.hora_inicio_custodia)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Arribo</p>
                    <p className="text-sm font-mono">{formatTimeOnly(servicio.hora_arribo)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Fin</p>
                    <p className="text-sm font-mono">{formatTimeOnly(servicio.hora_finalizacion)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Duración</p>
                    <p className="text-sm font-medium">{formatDuracion(servicio.duracion_calculada)}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-[10px] text-muted-foreground uppercase">Retraso</p>
                    <p className={`text-sm font-medium ${getRetrasoStyle(servicio.tiempo_retraso)}`}>
                      {formatTiempoRetrasoDisplay(servicio.tiempo_retraso)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Personal - Custodio y Armado */}
            <div className="grid grid-cols-2 gap-4">
              {/* Custodio */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <SectionHeader icon={User} title="Personal Custodio" />
                  <div className="space-y-3">
                    <InfoItem label="Nombre" value={servicio.nombre_custodio} className="font-medium" />
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <InfoItem label="Teléfono" value={servicio.telefono_custodio} />
                      </div>
                      <div className="flex items-center gap-2">
                        <Car className="h-3 w-3 text-muted-foreground" />
                        <InfoItem label="Vehículo" value={servicio.vehiculo_custodio} />
                      </div>
                    </div>
                    <InfoItem label="Placa" value={servicio.placa_custodio} />
                  </div>
                </CardContent>
              </Card>

              {/* Armado */}
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <SectionHeader icon={Shield} title="Personal Armado" />
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <InfoItem label="Nombre" value={servicio.nombre_armado} className="font-medium" />
                      {servicio.tipo_asignacion_armado === 'proveedor' && (
                        <Badge variant="outline" className="text-[10px]">Externo</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2">
                        <Phone className="h-3 w-3 text-muted-foreground" />
                        <InfoItem label="Teléfono" value={servicio.telefono_armado} />
                      </div>
                      <InfoItem 
                        label="Tipo Asignación" 
                        value={
                          servicio.tipo_asignacion_armado ? (
                            <Badge variant="secondary" className="text-xs capitalize">
                              {servicio.tipo_asignacion_armado}
                            </Badge>
                          ) : '-'
                        } 
                      />
                    </div>
                    <InfoItem label="Proveedor" value={servicio.proveedor} />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Transporte */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={Truck} title="Transporte" />
                <div className="grid grid-cols-5 gap-4">
                  <InfoItem label="Tipo Unidad" value={servicio.tipo_unidad} />
                  <InfoItem label="Tipo Carga" value={servicio.tipo_carga} />
                  <InfoItem label="Operador" value={servicio.nombre_operador_transporte} />
                  <InfoItem label="Tel. Operador" value={servicio.telefono_operador} />
                  <InfoItem label="Placa Carga" value={servicio.placa_carga} />
                </div>
              </CardContent>
            </Card>

            {/* Kilometraje */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={Navigation} title="Kilometraje" />
                <div className="grid grid-cols-5 gap-4">
                  <InfoItem 
                    label="Km Teórico" 
                    value={servicio.km_teorico != null ? `${servicio.km_teorico} km` : '-'} 
                  />
                  <InfoItem 
                    label="Km Recorridos" 
                    value={servicio.km_recorridos != null ? `${servicio.km_recorridos} km` : '-'}
                    className="font-medium"
                  />
                  <InfoItem 
                    label="Desviación" 
                    value={
                      servicio.desviacion_km != null ? (
                        <span className={Math.abs(servicio.desviacion_km) > 20 ? 'text-warning flex items-center gap-1' : ''}>
                          {Math.abs(servicio.desviacion_km) > 20 && <AlertTriangle className="h-3 w-3" />}
                          {servicio.desviacion_km}%
                        </span>
                      ) : '-'
                    }
                  />
                  <InfoItem label="Km Extras" value={servicio.km_extras} />
                  <InfoItem 
                    label="Km Auditado" 
                    value={
                      servicio.km_auditado ? (
                        <span className="flex items-center gap-1 text-primary">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Sí
                        </span>
                      ) : 'No'
                    }
                  />
                </div>
              </CardContent>
            </Card>

            {/* Financiero */}
            <Card className="border-border/50 bg-muted/30">
              <CardContent className="p-4">
                <SectionHeader icon={DollarSign} title="Financiero" />
                <div className="grid grid-cols-5 gap-4">
                  <InfoItem 
                    label="Cobro Cliente" 
                    value={formatCurrency(servicio.cobro_cliente)}
                    className="font-semibold text-base"
                  />
                  <InfoItem 
                    label="Costo Custodio" 
                    value={formatCurrency(servicio.costo_custodio)}
                    className="text-muted-foreground"
                  />
                  <InfoItem 
                    label="Casetas" 
                    value={servicio.casetas || '-'}
                  />
                  <InfoItem 
                    label="Margen Bruto" 
                    value={formatCurrency(servicio.margen_bruto)}
                    className={`font-semibold ${servicio.margen_bruto >= 0 ? 'text-primary' : 'text-destructive'}`}
                  />
                  <InfoItem 
                    label="% Margen" 
                    value={servicio.porcentaje_margen != null ? `${servicio.porcentaje_margen}%` : '-'}
                    className={`font-semibold ${getMargenStyle(servicio.porcentaje_margen)}`}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Tracking y Origen */}
            <Card className="border-border/50">
              <CardContent className="p-4">
                <SectionHeader icon={Radio} title="Tracking y Origen" />
                <div className="grid grid-cols-4 gap-4">
                  <InfoItem label="Gadget" value={servicio.gadget} />
                  <InfoItem label="Tipo Gadget" value={servicio.tipo_gadget} />
                  <InfoItem 
                    label="Creado Vía" 
                    value={
                      <Badge variant="outline" className="text-xs">
                        {servicio.creado_via || 'Manual'}
                      </Badge>
                    }
                  />
                  <InfoItem label="Creado Por" value={servicio.creado_por} />
                </div>
              </CardContent>
            </Card>

            {/* Comentarios */}
            {servicio.comentarios_adicionales && (
              <Card className="border-border/50">
                <CardContent className="p-4">
                  <SectionHeader icon={FileText} title="Comentarios" />
                  <p className="text-sm text-muted-foreground">{servicio.comentarios_adicionales}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
