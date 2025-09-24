import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { usePendingServices } from '@/hooks/usePendingServices';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { MultiDateSelector } from '@/components/planeacion/MultiDateSelector';
import { Clock, MapPin, User, Car, Shield, CheckCircle2, AlertCircle, Users, Timer } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function ScheduledServicesTab() {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const { summary, loading, error, refetch } = useScheduledServices(selectedDate);
  const { summary: pendingSummary, loading: pendingLoading, refetch: refetchPending } = usePendingServices();
  
  // Estado para el modal de asignación
  const [assignmentModalOpen, setAssignmentModalOpen] = useState(false);
  const [selectedPendingService, setSelectedPendingService] = useState<any>(null);

  const getStatusBadge = (service: any) => {
    if (service.incluye_armado && !service.armado_asignado) {
      return <Badge className="bg-red-100 text-red-700 border-red-200">Armado Pendiente</Badge>;
    }
    if (service.incluye_armado && service.estado_asignacion === 'confirmado') {
      return <Badge className="bg-emerald-100 text-emerald-700 border-emerald-200">Completamente Confirmado</Badge>;
    }
    if (service.incluye_armado && service.estado_asignacion === 'pendiente') {
      return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Confirmación Pendiente</Badge>;
    }
    if (!service.incluye_armado && service.estado === 'confirmado') {
      return <Badge className="bg-blue-100 text-blue-700 border-blue-200">Confirmado</Badge>;
    }
    if (!service.incluye_armado) {
      return <Badge className="bg-slate-100 text-slate-700 border-slate-200">Solo Custodia</Badge>;
    }
    return <Badge className="bg-gray-100 text-gray-700 border-gray-200">En Proceso</Badge>;
  };

  const getStatusIcon = (service: any) => {
    if (service.incluye_armado && service.estado_asignacion === 'confirmado') {
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" />;
    }
    if (service.incluye_armado && !service.armado_asignado) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    if (service.estado === 'confirmado') {
      return <CheckCircle2 className="h-4 w-4 text-blue-600" />;
    }
    return <Timer className="h-4 w-4 text-amber-600" />;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Date Selector and Summary Cards */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Multi Date Selector */}
        <div className="lg:w-80">
          <MultiDateSelector 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
          />
        </div>

        {/* Summary Cards */}
        <div className="flex-1 grid grid-cols-2 md:grid-cols-5 gap-4">
          {/* Total Services */}
          <Card className="border-slate-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-lg">
                  <Users className="h-5 w-5 text-slate-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary?.total_services || 0}</div>
                  <div className="text-xs text-muted-foreground">Total Servicios</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Assigned Services */}
          <Card className="border-emerald-200 bg-emerald-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-emerald-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-emerald-700">{summary?.assigned_services || 0}</div>
                  <div className="text-xs text-emerald-600 font-medium">Asignados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pending Confirmation */}
          <Card className="border-amber-200 bg-amber-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-amber-100 rounded-lg">
                  <Timer className="h-5 w-5 text-amber-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-amber-700">{summary?.pending_services || 0}</div>
                  <div className="text-xs text-amber-600 font-medium">Pendientes Confirmación</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Confirmed Services */}
          <Card className="border-blue-200 bg-blue-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Shield className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-700">{summary?.confirmed_services || 0}</div>
                  <div className="text-xs text-blue-600 font-medium">Confirmados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Unassigned Services */}
          <Card className="border-red-200 bg-red-50/30">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold text-red-700">{pendingSummary?.total_pending || 0}</div>
                  <div className="text-xs text-red-600 font-medium">Por Asignar</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Services List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>
            Servicios del {format(selectedDate, 'PPP', { locale: es })}
          </CardTitle>
          <Button onClick={refetch} variant="outline" size="sm">
            Actualizar
          </Button>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="text-center py-8 text-red-600">
              {error}
            </div>
          )}

          {!error && summary?.services_data && summary.services_data.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No hay servicios programados para esta fecha
            </div>
          )}

          {!error && summary?.services_data && summary.services_data.length > 0 && (
            <div className="space-y-4">
              {summary.services_data.map((service, index) => (
                <div
                  key={service.id || index}
                  className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Service Header */}
                      <div className="flex items-center gap-3">
                        {getStatusIcon(service)}
                        <div>
                          <h3 className="font-semibold">{service.cliente_nombre}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(service.fecha_hora_cita), 'HH:mm')}
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{service.origen}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{service.destino}</span>
                      </div>

                      {/* Custodian and Vehicle Info */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <span><strong>Custodio:</strong> {service.custodio_nombre}</span>
                        </div>
                        
                        {(service.auto || service.placa) && (
                          <div className="flex items-center gap-2">
                            <Car className="h-4 w-4 text-muted-foreground" />
                            <span>
                              <strong>Vehículo:</strong> {service.auto} 
                              {service.placa && ` (${service.placa})`}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Armed Guard Info */}
                      {service.incluye_armado && (
                        <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-md p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-purple-600" />
                            <span className="font-medium text-purple-800">Servicio con Armado</span>
                          </div>
                          <div className="text-purple-700">
                            {service.armado_asignado 
                              ? `✓ Armado asignado - ${service.estado_asignacion || 'Confirmando'}`
                              : '⚠️ Armado pendiente por asignar'
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Badges */}
                    <div className="flex flex-col gap-2 items-end">
                      {getStatusBadge(service)}
                      <Badge variant="outline" className="text-xs border-slate-300 text-slate-600">
                        {service.estado}
                      </Badge>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Critical Unassigned Services Section */}
      {pendingSummary?.total_pending && pendingSummary.total_pending > 0 && (
        <Card className="border-red-200 bg-gradient-to-br from-red-50 to-orange-50">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-700 flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              Servicios Críticos por Asignar ({pendingSummary.total_pending})
            </CardTitle>
            <Button onClick={refetchPending} variant="outline" size="sm" className="border-red-200">
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSummary.pending_services.map((pendingService) => (
                <div
                  key={pendingService.id}
                  className="border rounded-lg p-4 hover:bg-red-50/50 transition-colors border-red-200 bg-white shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Service Header */}
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <AlertCircle className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-red-900">{pendingService.nombre_cliente}</h3>
                          <div className="flex items-center gap-2 text-sm text-red-600">
                            <span className="font-mono">ID: {pendingService.id_servicio}</span>
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm bg-red-50 p-2 rounded">
                        <MapPin className="h-4 w-4 text-red-600" />
                        <span className="font-medium text-red-800">{pendingService.origen}</span>
                        <span className="text-red-600">→</span>
                        <span className="font-medium text-red-800">{pendingService.destino}</span>
                      </div>

                      {/* Service Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span><strong>Fecha:</strong> {format(new Date(pendingService.fecha_hora_cita), 'PPP', { locale: es })}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span><strong>Tipo:</strong> {pendingService.tipo_servicio}</span>
                        </div>
                      </div>

                      {pendingService.observaciones && (
                        <div className="bg-amber-50 border border-amber-200 rounded-md p-2 text-sm">
                          <strong className="text-amber-800">Observaciones:</strong> 
                          <span className="text-amber-700 ml-1">{pendingService.observaciones}</span>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-col gap-2">
                      <Button
                        size="sm"
                        onClick={() => {
                          setSelectedPendingService(pendingService);
                          setAssignmentModalOpen(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Asignar Urgente
                      </Button>
                      
                      <Badge variant="destructive" className="text-xs justify-center">
                        Sin Custodio
                      </Badge>
                      
                      {pendingService.requiere_armado && (
                        <Badge className="text-xs bg-orange-100 text-orange-700 border-orange-200">
                          + Armado
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Modal de Asignación */}
      <PendingAssignmentModal
        open={assignmentModalOpen}
        onOpenChange={setAssignmentModalOpen}
        service={selectedPendingService}
        onAssignmentComplete={() => {
          refetchPending();
          refetch();
        }}
      />
    </div>
  );
}