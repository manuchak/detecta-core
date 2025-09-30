import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { format, differenceInMinutes } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar, Clock, MapPin, User, Shield, DollarSign, Car,
  FileText, Info, Database, CheckCircle2, AlertCircle, Phone,
  Timer, Navigation, TrendingUp, Package, Users
} from 'lucide-react';
import type { ServiceQueryResult } from '@/hooks/useServiceQuery';
import { formatTiempoRetrasoDisplay } from '@/utils/timeUtils';

interface ServiceDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceQueryResult | null;
}

export function ServiceDetailsModal({ open, onOpenChange, service }: ServiceDetailsModalProps) {
  if (!service) return null;

  const DetailRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number | undefined }) => {
    if (!value && value !== 0) return null;
    
    return (
      <div className="flex items-start space-x-3 py-3 border-b border-border/30">
        <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
        <div className="flex-1 min-w-0">
          <div className="apple-text-caption text-muted-foreground mb-0.5">
            {label}
          </div>
          <div className="apple-text-body font-medium text-foreground break-words">
            {value}
          </div>
        </div>
      </div>
    );
  };

  const StatusBadge = () => {
    const estado = service.estado?.toLowerCase() || '';
    let bgColor = 'bg-gray-100';
    let textColor = 'text-gray-700';
    let icon = AlertCircle;

    if (estado.includes('finalizado') || estado.includes('completado')) {
      bgColor = 'bg-green-100';
      textColor = 'text-green-700';
      icon = CheckCircle2;
    } else if (estado.includes('confirmado')) {
      bgColor = 'bg-blue-100';
      textColor = 'text-blue-700';
      icon = CheckCircle2;
    } else if (estado.includes('cancelado')) {
      bgColor = 'bg-red-100';
      textColor = 'text-red-700';
      icon = AlertCircle;
    }

    const Icon = icon;

    return (
      <div className={`inline-flex items-center space-x-2 px-3 py-1.5 rounded-lg ${bgColor}`}>
        <Icon className={`w-4 h-4 ${textColor}`} />
        <span className={`apple-text-caption font-medium ${textColor}`}>
          {service.estado}
        </span>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="apple-text-largetitle">
                {service.id_servicio}
              </DialogTitle>
              <p className="apple-text-body text-muted-foreground mt-1">
                {service.nombre_cliente}
              </p>
            </div>
            <StatusBadge />
          </div>
        </DialogHeader>

        <Tabs defaultValue="general" className="mt-4">
          <TabsList className="apple-tabs-minimal grid grid-cols-6 w-full">
            <TabsTrigger value="general" className="apple-tab">General</TabsTrigger>
            <TabsTrigger value="timeline" className="apple-tab">Cronología</TabsTrigger>
            <TabsTrigger value="execution" className="apple-tab">Ejecución</TabsTrigger>
            <TabsTrigger value="contacts" className="apple-tab">Contactos</TabsTrigger>
            <TabsTrigger value="planning" className="apple-tab">Planeación</TabsTrigger>
            <TabsTrigger value="costs" className="apple-tab">Costos</TabsTrigger>
          </TabsList>

          {/* Tab: Información General */}
          <TabsContent value="general" className="apple-content-spacing">
            <div className="space-y-1">
              <DetailRow
                icon={FileText}
                label="ID de Servicio"
                value={service.id_servicio}
              />
              <DetailRow
                icon={User}
                label="Cliente"
                value={service.nombre_cliente}
              />
              {service.empresa_cliente && (
                <DetailRow
                  icon={Info}
                  label="Empresa"
                  value={service.empresa_cliente}
                />
              )}
              {service.telefono_cliente && (
                <DetailRow
                  icon={Info}
                  label="Teléfono"
                  value={service.telefono_cliente}
                />
              )}
              {service.email_cliente && (
                <DetailRow
                  icon={Info}
                  label="Email"
                  value={service.email_cliente}
                />
              )}
              <DetailRow
                icon={Calendar}
                label="Fecha"
                value={format(new Date(service.fecha_hora_cita), 'PPP', { locale: es })}
              />
              <DetailRow
                icon={Clock}
                label="Hora"
                value={format(new Date(service.fecha_hora_cita), 'HH:mm')}
              />
              <DetailRow
                icon={Info}
                label="Tipo de Servicio"
                value={service.tipo_servicio}
              />
              <DetailRow
                icon={Database}
                label="Origen de Datos"
                value={service.fuente_tabla === 'servicios_custodia' ? 'Servicio Ejecutado' : 'Servicio Planificado'}
              />
            </div>
          </TabsContent>

          {/* Tab: Detalles del Servicio */}
          <TabsContent value="service" className="apple-content-spacing">
            <div className="space-y-1">
              <DetailRow
                icon={MapPin}
                label="Origen"
                value={service.origen}
              />
              <DetailRow
                icon={MapPin}
                label="Destino"
                value={service.destino}
              />
              {service.km_recorridos && (
                <DetailRow
                  icon={Car}
                  label="Kilómetros Recorridos"
                  value={`${service.km_recorridos} km`}
                />
              )}
              {service.auto && (
                <DetailRow
                  icon={Car}
                  label="Vehículo"
                  value={service.auto}
                />
              )}
              {service.placa && (
                <DetailRow
                  icon={Car}
                  label="Placas"
                  value={service.placa}
                />
              )}
              {service.observaciones && (
                <DetailRow
                  icon={FileText}
                  label="Observaciones"
                  value={service.observaciones}
                />
              )}
            </div>
          </TabsContent>

          {/* Tab: Cronología - Timeline del Servicio */}
          <TabsContent value="timeline" className="apple-content-spacing">
            {!service.created_at && !service.fecha_hora_asignacion && !service.fecha_asignacion && 
             !service.fecha_comunicacion && !service.fecha_respuesta && !service.hora_inicio_custodia && 
             !service.hora_finalizacion ? (
              <div className="apple-empty-state py-12">
                <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <div className="apple-text-headline text-muted-foreground mb-2">
                  Sin información temporal
                </div>
                <div className="apple-text-body text-muted-foreground">
                  No hay datos de cronología disponibles para este servicio
                </div>
              </div>
            ) : (
              <div className="space-y-4">
              {/* Timeline Visual */}
              <div className="relative pl-8 space-y-6">
                {service.created_at && (
                  <TimelineItem
                    icon={FileText}
                    label="Servicio Creado"
                    timestamp={service.created_at}
                    color="blue"
                  />
                )}
                {(service.fecha_hora_asignacion || service.fecha_asignacion) && (
                  <TimelineItem
                    icon={User}
                    label="Custodio Asignado"
                    timestamp={service.fecha_hora_asignacion || service.fecha_asignacion}
                    color="purple"
                    detail={service.nombre_custodio}
                  />
                )}
                {service.fecha_comunicacion && (
                  <TimelineItem
                    icon={Phone}
                    label="Comunicación Enviada"
                    timestamp={service.fecha_comunicacion}
                    color="cyan"
                  />
                )}
                {service.fecha_respuesta && (
                  <TimelineItem
                    icon={CheckCircle2}
                    label="Respuesta Recibida"
                    timestamp={service.fecha_respuesta}
                    color="green"
                  />
                )}
                {service.hora_inicio_custodia && (
                  <TimelineItem
                    icon={Navigation}
                    label="Servicio Iniciado"
                    timestamp={service.hora_inicio_custodia}
                    color="orange"
                  />
                )}
                {service.hora_salida_origen && (
                  <TimelineItem
                    icon={MapPin}
                    label="Salida de Origen"
                    timestamp={service.hora_salida_origen}
                    color="yellow"
                  />
                )}
                {service.hora_llegada_destino && (
                  <TimelineItem
                    icon={MapPin}
                    label="Llegada a Destino"
                    timestamp={service.hora_llegada_destino}
                    color="teal"
                  />
                )}
                {service.hora_finalizacion && (
                  <TimelineItem
                    icon={CheckCircle2}
                    label="Servicio Finalizado"
                    timestamp={service.hora_finalizacion}
                    color="green"
                  />
                )}
              </div>

              {/* Métricas de Tiempo */}
              <div className="mt-6 pt-6 border-t border-border/30">
                <h4 className="apple-text-headline mb-4">Métricas de Tiempo</h4>
                <div className="grid grid-cols-2 gap-4">
                  {service.tiempo_respuesta && (
                    <MetricCard
                      icon={Timer}
                      label="Tiempo de Respuesta"
                      value={formatTiempoRetrasoDisplay(service.tiempo_respuesta)}
                    />
                  )}
                  {service.duracion_servicio && (
                    <MetricCard
                      icon={Clock}
                      label="Duración del Servicio"
                      value={formatTiempoRetrasoDisplay(service.duracion_servicio)}
                    />
                  )}
                  {service.tiempo_punto_origen && (
                    <MetricCard
                      icon={MapPin}
                      label="Tiempo en Origen"
                      value={formatTiempoRetrasoDisplay(service.tiempo_punto_origen)}
                    />
                  )}
                  {service.tiempo_punto_destino && (
                    <MetricCard
                      icon={MapPin}
                      label="Tiempo en Destino"
                      value={formatTiempoRetrasoDisplay(service.tiempo_punto_destino)}
                    />
                  )}
                </div>
              </div>
              </div>
            )}
          </TabsContent>

          {/* Tab: Ejecución */}
          <TabsContent value="execution" className="apple-content-spacing">
            <div className="space-y-1">
              <DetailRow
                icon={MapPin}
                label="Origen"
                value={service.origen}
              />
              <DetailRow
                icon={MapPin}
                label="Destino"
                value={service.destino}
              />
              {service.km_recorridos && (
                <DetailRow
                  icon={TrendingUp}
                  label="Kilómetros Recorridos"
                  value={`${service.km_recorridos} km`}
                />
              )}
              {service.km_teoricos && (
                <DetailRow
                  icon={Navigation}
                  label="Kilómetros Teóricos"
                  value={`${service.km_teoricos} km`}
                />
              )}
              {service.km_recorridos && service.km_teoricos && (
                <DetailRow
                  icon={TrendingUp}
                  label="Eficiencia de Ruta"
                  value={`${((service.km_teoricos / service.km_recorridos) * 100).toFixed(1)}%`}
                />
              )}
              {service.auto && (
                <DetailRow
                  icon={Car}
                  label="Vehículo"
                  value={service.auto}
                />
              )}
              {service.placa && (
                <DetailRow
                  icon={Car}
                  label="Placas"
                  value={service.placa}
                />
              )}
              {service.duracion_estimada && (
                <DetailRow
                  icon={Clock}
                  label="Duración Estimada"
                  value={`${service.duracion_estimada} horas`}
                />
              )}
              {service.observaciones && (
                <DetailRow
                  icon={FileText}
                  label="Observaciones"
                  value={service.observaciones}
                />
              )}
            </div>
          </TabsContent>

          {/* Tab: Contactos */}
          <TabsContent value="contacts" className="apple-content-spacing">
            <div className="space-y-6">
              {/* Custodio */}
              {service.nombre_custodio && (
                <div className="space-y-1">
                  <h4 className="apple-text-headline mb-3 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Custodio
                  </h4>
                  <DetailRow
                    icon={User}
                    label="Nombre"
                    value={service.nombre_custodio}
                  />
                  {service.telefono_custodio && (
                    <DetailRow
                      icon={Phone}
                      label="Teléfono"
                      value={service.telefono_custodio}
                    />
                  )}
                </div>
              )}

              {/* Operador */}
              {service.nombre_operador && (
                <div className="space-y-1 pt-4 border-t border-border/30">
                  <h4 className="apple-text-headline mb-3 flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Operador
                  </h4>
                  <DetailRow
                    icon={User}
                    label="Nombre"
                    value={service.nombre_operador}
                  />
                  {service.telefono_operador && (
                    <DetailRow
                      icon={Phone}
                      label="Teléfono"
                      value={service.telefono_operador}
                    />
                  )}
                </div>
              )}

              {/* Contacto de Emergencia */}
              {service.contacto_emergencia_nombre && (
                <div className="space-y-1 pt-4 border-t border-border/30">
                  <h4 className="apple-text-headline mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-red-500" />
                    Contacto de Emergencia
                  </h4>
                  <DetailRow
                    icon={User}
                    label="Nombre"
                    value={service.contacto_emergencia_nombre}
                  />
                  {service.contacto_emergencia_telefono && (
                    <DetailRow
                      icon={Phone}
                      label="Teléfono"
                      value={service.contacto_emergencia_telefono}
                    />
                  )}
                </div>
              )}

              {/* Armado */}
              {(service.armado_nombre || service.incluye_armado) && (
                <div className="space-y-1 pt-4 border-t border-border/30">
                  <h4 className="apple-text-headline mb-3 flex items-center gap-2">
                    <Shield className="h-4 w-4" />
                    Armado
                  </h4>
                  {service.armado_nombre && (
                    <DetailRow
                      icon={User}
                      label="Nombre"
                      value={service.armado_nombre}
                    />
                  )}
                  <DetailRow
                    icon={Shield}
                    label="Armado Asignado"
                    value={service.incluye_armado || service.armado_asignado ? 'Sí' : 'No'}
                  />
                  {service.proveedor_armado && (
                    <DetailRow
                      icon={Package}
                      label="Proveedor"
                      value={service.proveedor_armado}
                    />
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          {/* Tab: Planeación */}
          <TabsContent value="planning" className="apple-content-spacing">
            <div className="space-y-1">
              {service.estado_planeacion && (
                <DetailRow
                  icon={Info}
                  label="Estado de Planeación"
                  value={service.estado_planeacion}
                />
              )}
              {service.created_at && (
                <DetailRow
                  icon={Calendar}
                  label="Fecha de Creación"
                  value={format(new Date(service.created_at), 'PPP HH:mm', { locale: es })}
                />
              )}
              {service.fecha_asignacion && (
                <DetailRow
                  icon={Calendar}
                  label="Fecha de Asignación"
                  value={format(new Date(service.fecha_asignacion), 'PPP HH:mm', { locale: es })}
                />
              )}
              {service.updated_at && (
                <DetailRow
                  icon={Clock}
                  label="Última Actualización"
                  value={format(new Date(service.updated_at), 'PPP HH:mm', { locale: es })}
                />
              )}
              <DetailRow
                icon={Database}
                label="Origen de Datos"
                value={service.fuente_tabla === 'servicios_custodia' ? 'Servicio Ejecutado' : 'Servicio Planificado'}
              />
            </div>
          </TabsContent>

          {/* Tab: Costos */}
          <TabsContent value="costs" className="apple-content-spacing">
            <div className="space-y-1">
              {service.cobro_cliente !== undefined && service.cobro_cliente !== null && (
                <DetailRow
                  icon={DollarSign}
                  label="Cobro al Cliente"
                  value={`$${service.cobro_cliente.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              )}
              {service.costo_custodio !== undefined && service.costo_custodio !== null && (
                <DetailRow
                  icon={DollarSign}
                  label="Costo Custodio"
                  value={`$${service.costo_custodio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              )}
              {service.costo_armado !== undefined && service.costo_armado !== null && (
                <DetailRow
                  icon={Shield}
                  label="Costo Armado"
                  value={`$${service.costo_armado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              )}
              {service.tarifa_proveedor_armado !== undefined && service.tarifa_proveedor_armado !== null && (
                <DetailRow
                  icon={Package}
                  label="Tarifa Proveedor Armado"
                  value={`$${service.tarifa_proveedor_armado.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
              )}
              {service.cobro_cliente !== undefined && service.costo_custodio !== undefined && 
               service.cobro_cliente !== null && service.costo_custodio !== null && (
                <>
                  <div className="pt-4 mt-4 border-t border-border/30">
                    <DetailRow
                      icon={TrendingUp}
                      label="Margen Bruto"
                      value={`$${(service.cobro_cliente - service.costo_custodio - (service.costo_armado || 0)).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <DetailRow
                      icon={TrendingUp}
                      label="% Margen"
                      value={`${(((service.cobro_cliente - service.costo_custodio - (service.costo_armado || 0)) / service.cobro_cliente) * 100).toFixed(1)}%`}
                    />
                  </div>
                </>
              )}
            </div>

            {(!service.cobro_cliente && !service.costo_custodio) && (
              <div className="apple-empty-state py-8">
                <DollarSign className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                <div className="apple-text-body text-muted-foreground">
                  No hay información de costos disponible
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Componente auxiliar para Timeline Items
function TimelineItem({ 
  icon: Icon, 
  label, 
  timestamp, 
  color = 'gray',
  detail 
}: { 
  icon: any; 
  label: string; 
  timestamp: string; 
  color?: string;
  detail?: string;
}) {
  const colorClasses = {
    blue: 'bg-blue-500',
    purple: 'bg-purple-500',
    cyan: 'bg-cyan-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    yellow: 'bg-yellow-500',
    teal: 'bg-teal-500',
    red: 'bg-red-500',
    gray: 'bg-gray-500'
  };

  return (
    <div className="relative">
      <div className="absolute -left-8 top-0">
        <div className={`w-6 h-6 rounded-full ${colorClasses[color]} flex items-center justify-center`}>
          <Icon className="w-3 h-3 text-white" />
        </div>
      </div>
      <div className="absolute -left-7 top-6 bottom-0 w-0.5 bg-border/30" />
      <div>
        <div className="apple-text-body font-medium">{label}</div>
        <div className="apple-text-caption text-muted-foreground">
          {format(new Date(timestamp), 'PPP HH:mm:ss', { locale: es })}
        </div>
        {detail && (
          <Badge variant="secondary" className="mt-1">
            {detail}
          </Badge>
        )}
      </div>
    </div>
  );
}

// Componente auxiliar para Metric Cards
function MetricCard({ 
  icon: Icon, 
  label, 
  value 
}: { 
  icon: any; 
  label: string; 
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg bg-accent/20 border border-border/30">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        <span className="apple-text-caption text-muted-foreground">{label}</span>
      </div>
      <div className="apple-text-title font-semibold">{value}</div>
    </div>
  );
}
