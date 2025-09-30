import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
  Calendar, Clock, MapPin, User, Shield, DollarSign, Car,
  FileText, Info, Database, CheckCircle2, AlertCircle
} from 'lucide-react';
import type { ServiceQueryResult } from '@/hooks/useServiceQuery';

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
          <TabsList className="apple-tabs-minimal">
            <TabsTrigger value="general" className="apple-tab">General</TabsTrigger>
            <TabsTrigger value="service" className="apple-tab">Servicio</TabsTrigger>
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

          {/* Tab: Planeación */}
          <TabsContent value="planning" className="apple-content-spacing">
            <div className="space-y-1">
              {service.nombre_custodio && (
                <DetailRow
                  icon={User}
                  label="Custodio Asignado"
                  value={service.nombre_custodio}
                />
              )}
              <DetailRow
                icon={Shield}
                label="Requiere Armado"
                value={service.incluye_armado || service.armado_asignado ? 'Sí' : 'No'}
              />
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
              {service.cobro_cliente !== undefined && service.costo_custodio !== undefined && 
               service.cobro_cliente !== null && service.costo_custodio !== null && (
                <DetailRow
                  icon={DollarSign}
                  label="Margen"
                  value={`$${(service.cobro_cliente - service.costo_custodio).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
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
