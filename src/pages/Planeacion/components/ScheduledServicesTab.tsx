import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useScheduledServices } from '@/hooks/useScheduledServices';
import { usePendingServices } from '@/hooks/usePendingServices';
import { PendingAssignmentModal } from '@/components/planeacion/PendingAssignmentModal';
import { Calendar as CalendarIcon, Clock, MapPin, User, Car, Shield, CheckCircle2, AlertCircle, Calendar as CalendarIcon2 } from 'lucide-react';
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
      return <Badge variant="destructive">Armado Pendiente</Badge>;
    }
    if (service.incluye_armado && service.estado_asignacion === 'confirmado') {
      return <Badge variant="success">Confirmado</Badge>;
    }
    if (service.incluye_armado && service.estado_asignacion === 'pendiente') {
      return <Badge variant="secondary">Pendiente Confirmación</Badge>;
    }
    if (!service.incluye_armado) {
      return <Badge variant="outline">Solo Custodia</Badge>;
    }
    return <Badge variant="secondary">En Proceso</Badge>;
  };

  const getStatusIcon = (service: any) => {
    if (service.incluye_armado && service.estado_asignacion === 'confirmado') {
      return <CheckCircle2 className="h-4 w-4 text-green-600" />;
    }
    if (service.incluye_armado && !service.armado_asignado) {
      return <AlertCircle className="h-4 w-4 text-red-600" />;
    }
    return <Clock className="h-4 w-4 text-blue-600" />;
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
        {/* Date Selector */}
        <Card className="lg:w-80">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarIcon2 className="h-5 w-5" />
              Seleccionar Fecha
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {format(selectedDate, 'PPP', { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={(date) => date && setSelectedDate(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </CardContent>
        </Card>

        {/* Summary Cards */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <CalendarIcon className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary?.total_services || 0}</div>
                  <div className="text-sm text-muted-foreground">Total</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary?.assigned_services || 0}</div>
                  <div className="text-sm text-muted-foreground">Asignados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-orange-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary?.pending_services || 0}</div>
                  <div className="text-sm text-muted-foreground">Pendientes</div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Shield className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{summary?.confirmed_services || 0}</div>
                  <div className="text-sm text-muted-foreground">Confirmados</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Nueva tarjeta para pendientes por asignar */}
          <Card className="border-orange-200">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <div className="text-2xl font-bold">{pendingSummary?.total_pending || 0}</div>
                  <div className="text-sm text-muted-foreground">Por Asignar</div>
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
                        <div className="bg-accent/30 rounded-md p-3 text-sm">
                          <div className="flex items-center gap-2 mb-1">
                            <Shield className="h-4 w-4 text-primary" />
                            <span className="font-medium">Servicio con Armado</span>
                          </div>
                          <div className="text-muted-foreground">
                            {service.armado_asignado 
                              ? `Estado: ${service.estado_asignacion || 'Asignado'}`
                              : 'Armado pendiente por asignar'
                            }
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Status Badge */}
                    <div className="flex flex-col gap-2">
                      {getStatusBadge(service)}
                      <Badge variant="outline" className="text-xs">
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

      {/* Pending Services Section */}
      {pendingSummary?.total_pending && pendingSummary.total_pending > 0 && (
        <Card className="border-orange-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-orange-700">
              Servicios Pendientes por Asignar ({pendingSummary.total_pending})
            </CardTitle>
            <Button onClick={refetchPending} variant="outline" size="sm">
              Actualizar
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pendingSummary.pending_services.map((pendingService) => (
                <div
                  key={pendingService.id}
                  className="border rounded-lg p-4 hover:bg-orange-50/50 transition-colors border-orange-200"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 space-y-3">
                      {/* Service Header */}
                      <div className="flex items-center gap-3">
                        <Clock className="h-4 w-4 text-orange-600" />
                        <div>
                          <h3 className="font-semibold">{pendingService.nombre_cliente}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <span>ID: {pendingService.id_servicio}</span>
                          </div>
                        </div>
                      </div>

                      {/* Route */}
                      <div className="flex items-center gap-2 text-sm">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{pendingService.origen}</span>
                        <span className="text-muted-foreground">→</span>
                        <span className="font-medium">{pendingService.destino}</span>
                      </div>

                      {/* Service Details */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span><strong>Fecha:</strong> {format(new Date(pendingService.fecha_hora_cita), 'PPP', { locale: es })}</span>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-muted-foreground" />
                          <span><strong>Tipo:</strong> {pendingService.tipo_servicio}</span>
                        </div>
                      </div>

                      {pendingService.observaciones && (
                        <div className="bg-muted/50 rounded-md p-2 text-sm">
                          <strong>Observaciones:</strong> {pendingService.observaciones}
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
                        className="bg-orange-600 hover:bg-orange-700"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Asignar Custodio
                      </Button>
                      
                      <Badge variant="outline" className="text-xs border-orange-200 text-orange-700">
                        Sin Asignar
                      </Badge>
                      
                      {pendingService.requiere_armado && (
                        <Badge variant="secondary" className="text-xs">
                          Con Armado
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