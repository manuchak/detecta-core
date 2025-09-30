import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Shield, Clock, MapPin, AlertTriangle, CheckCircle2, Search, Eye, EyeOff } from 'lucide-react';
import { useArmedGuardsWithTracking } from '@/hooks/useArmedGuardsWithTracking';
import { toast } from 'sonner';
import { UniversalSearchBar } from '@/components/planeacion/search/UniversalSearchBar';
import { SearchResultsInfo } from '@/components/planeacion/search/SearchResultsInfo';

interface ArmedGuardData {
  armado_id: string;
  armado_nombre: string;
  punto_encuentro: string;
  hora_encuentro: string;
  observaciones?: string;
  tipo_asignacion: 'interno' | 'proveedor';
  proveedor_id?: string;
}

interface ServiceData {
  servicio_id?: string;
  origen?: string;
  destino?: string;
  fecha_hora_cita?: string;
  custodio_asignado?: string;
  custodio_id?: string;
}

interface ArmedGuardAssignmentStepProps {
  serviceData: ServiceData;
  onComplete: (data: ArmedGuardData) => void;
  onSkip: () => void;
  onBack: () => void;
}

export function ArmedGuardAssignmentStep({ 
  serviceData, 
  onComplete, 
  onSkip, 
  onBack 
}: ArmedGuardAssignmentStepProps) {
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [assignmentType, setAssignmentType] = useState<'interno' | 'proveedor'>('interno');
  const [meetingPoint, setMeetingPoint] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [observations, setObservations] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAllAvailable, setShowAllAvailable] = useState(true);
  const [activeFilters, setActiveFilters] = useState<Record<string, boolean>>({
    disponibles: true,
    conExperiencia: false
  });

  // Prepare filters for armed guards - conditionally apply zone filtering
  const serviceFilters = (serviceData.fecha_hora_cita && !showAllAvailable) ? {
    zona_base: serviceData.origen || '',
    fecha_programada: serviceData.fecha_hora_cita.split('T')[0],
    tipo_servicio: 'local', // Map custodia_armada to local service type
    incluye_armado: true
  } : undefined;

  const { armedGuards, providers, loading, error } = useArmedGuardsWithTracking(serviceFilters);

  // Set default meeting time based on service time
  useEffect(() => {
    if (serviceData.fecha_hora_cita && !meetingTime) {
      const serviceTime = new Date(serviceData.fecha_hora_cita);
      serviceTime.setMinutes(serviceTime.getMinutes() - 30); // 30 minutes before service
      setMeetingTime(serviceTime.toTimeString().slice(0, 5));
    }
  }, [serviceData.fecha_hora_cita]);

  // Filter guards/providers based on search term and filters
  const filteredGuards = armedGuards.filter(guard => {
    const matchesSearch = guard.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      guard.zona_base?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilters = 
      (!activeFilters.disponibles || guard.disponibilidad === 'disponible') &&
      (!activeFilters.conExperiencia || (guard.experiencia_anos || 0) >= 3);
    
    return matchesSearch && matchesFilters;
  });

  const filteredProviders = providers.filter(provider => {
    const matchesSearch = provider.nombre_empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (provider.zonas_cobertura && provider.zonas_cobertura.some(zona => 
        zona.toLowerCase().includes(searchTerm.toLowerCase())
      ));
    
    const matchesFilters = !activeFilters.disponibles || provider.activo;
    
    return matchesSearch && matchesFilters;
  });

  const handleComplete = () => {
    const selectedId = assignmentType === 'interno' ? selectedGuard : selectedProvider;
    const selectedName = assignmentType === 'interno' 
      ? armedGuards.find(g => g.id === selectedGuard)?.nombre
      : providers.find(p => p.id === selectedProvider)?.nombre_empresa;

    if (!selectedId || !selectedName) {
      toast.error('Debe seleccionar un armado');
      return;
    }

    if (!meetingPoint.trim()) {
      toast.error('Debe especificar el punto de encuentro');
      return;
    }

    if (!meetingTime.trim()) {
      toast.error('Debe especificar la hora de encuentro');
      return;
    }

    const assignmentData: ArmedGuardData = {
      armado_id: selectedId,
      armado_nombre: selectedName,
      punto_encuentro: meetingPoint,
      hora_encuentro: meetingTime,
      observaciones: observations,
      tipo_asignacion: assignmentType,
      proveedor_id: assignmentType === 'proveedor' ? selectedId : undefined
    };

    onComplete(assignmentData);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Asignación de Armado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
              <p className="text-muted-foreground">Buscando armados disponibles...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Error al cargar armados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground mb-4">{error}</p>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onBack}>Volver</Button>
            <Button onClick={onSkip}>Continuar sin armado</Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Service Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Asignación de Armado
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/50 rounded-lg p-4">
            <h3 className="font-semibold mb-2">Servicio Asignado</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span><strong>Ruta:</strong> {serviceData.origen} → {serviceData.destino}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span><strong>Fecha:</strong> {serviceData.fecha_hora_cita}</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <span><strong>Custodio:</strong> {serviceData.custodio_asignado}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Assignment Type Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex gap-4 mb-4">
            <Button
              variant={assignmentType === 'interno' ? 'default' : 'outline'}
              onClick={() => {
                setAssignmentType('interno');
                setSelectedGuard(null);
                setSelectedProvider(null);
              }}
              className="flex-1"
            >
              Armado Interno
            </Button>
            <Button
              variant={assignmentType === 'proveedor' ? 'default' : 'outline'}
              onClick={() => {
                setAssignmentType('proveedor');
                setSelectedGuard(null);
                setSelectedProvider(null);
              }}
              className="flex-1"
            >
              Proveedor Externo
            </Button>
          </div>

          {/* Search and Filters */}
          <UniversalSearchBar
            placeholder={`Buscar ${assignmentType === 'interno' ? 'armados' : 'proveedores'} por nombre o zona...`}
            value={searchTerm}
            onChange={setSearchTerm}
            filters={[
              {
                id: 'disponibles',
                label: assignmentType === 'interno' ? 'Disponibles' : 'Activos',
                value: 'disponibles',
                active: activeFilters.disponibles,
                variant: 'success'
              },
              ...(assignmentType === 'interno' ? [{
                id: 'conExperiencia',
                label: '≥ 3 años exp.',
                value: 'conExperiencia',
                active: activeFilters.conExperiencia,
                variant: 'default' as const
              }] : [])
            ]}
            onFilterToggle={(filterId) => {
              setActiveFilters(prev => ({
                ...prev,
                [filterId]: !prev[filterId]
              }));
            }}
            onClearAll={() => {
              setSearchTerm('');
              setActiveFilters({
                disponibles: true,
                conExperiencia: false
              });
            }}
            resultsCount={assignmentType === 'interno' ? filteredGuards.length : filteredProviders.length}
            totalCount={assignmentType === 'interno' ? armedGuards.length : providers.length}
            className="mb-4"
          />

          {showAllAvailable && (
            <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-lg text-sm mb-3">
              <Eye className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Mostrando todos los {assignmentType === 'interno' ? 'armados' : 'proveedores'} disponibles
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setShowAllAvailable(false)}
                className="ml-auto h-6 px-2"
              >
                <EyeOff className="h-3 w-3" />
                Solo zona actual
              </Button>
            </div>
          )}

          {/* Guards/Providers List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {assignmentType === 'interno' ? (
              filteredGuards.length === 0 ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">
                    {!showAllAvailable ? 
                      `No hay armados internos disponibles en la zona: ${serviceData.origen}` :
                      'No hay armados internos disponibles'
                    }
                  </p>
                  {!showAllAvailable && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllAvailable(true)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Mostrar todos los disponibles
                    </Button>
                  )}
                </div>
              ) : (
                filteredGuards.map((guard) => (
                  <div
                    key={guard.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedGuard === guard.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedGuard(guard.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{guard.nombre}</div>
                        <div className="text-sm text-muted-foreground">
                          {guard.zona_base && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Zona: {guard.zona_base}
                              {showAllAvailable && guard.zona_base !== serviceData.origen && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  Zona diferente
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>
                        {guard.experiencia_anos && (
                          <div className="text-sm text-muted-foreground">
                            {guard.experiencia_anos} años de experiencia
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={guard.disponibilidad === 'disponible' ? 'success' : 'secondary'}>
                          {guard.disponibilidad === 'disponible' ? 'Disponible' : 'Ocupado'}
                        </Badge>
                        {guard.rating_promedio > 0 && (
                          <div className="text-sm text-muted-foreground">
                            ⭐ {guard.rating_promedio.toFixed(1)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            ) : (
              filteredProviders.length === 0 ? (
                <div className="text-center py-6">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground mb-3">
                    {!showAllAvailable ? 
                      `No hay proveedores que cubran la zona: ${serviceData.origen}` :
                      'No hay proveedores disponibles'
                    }
                  </p>
                  {!showAllAvailable && (
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setShowAllAvailable(true)}
                      className="flex items-center gap-2"
                    >
                      <Eye className="h-4 w-4" />
                      Mostrar todos los disponibles
                    </Button>
                  )}
                </div>
              ) : (
                filteredProviders.map((provider) => (
                  <div
                    key={provider.id}
                    className={`border rounded-lg p-3 cursor-pointer transition-colors ${
                      selectedProvider === provider.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedProvider(provider.id)}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium">{provider.nombre_empresa}</div>
                        <div className="text-sm text-muted-foreground">
                          {provider.zonas_cobertura && provider.zonas_cobertura.length > 0 && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              Cobertura: {provider.zonas_cobertura.join(', ')}
                              {showAllAvailable && !provider.zonas_cobertura.includes(serviceData.origen || '') && (
                                <Badge variant="secondary" className="ml-1 text-xs">
                                  Zona no cubierta
                                </Badge>
                              )}
                            </span>
                          )}
                        </div>
                        {provider.tarifa_por_servicio && (
                          <div className="text-sm text-muted-foreground">
                            Tarifa: ${provider.tarifa_por_servicio}/servicio
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge variant={provider.activo ? 'success' : 'secondary'}>
                          {provider.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                        {provider.tiempo_respuesta_promedio !== undefined && (
                          <div className="text-sm text-muted-foreground">
                            Respuesta: {provider.tiempo_respuesta_promedio}min
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Meeting Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detalles del Encuentro</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="meetingPoint">Punto de Encuentro *</Label>
              <AddressAutocomplete
                value={meetingPoint}
                onChange={(value) => setMeetingPoint(value)}
                placeholder="Buscar punto de encuentro..."
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="meetingTime">Hora de Encuentro *</Label>
              <Input
                id="meetingTime"
                type="time"
                value={meetingTime}
                onChange={(e) => setMeetingTime(e.target.value)}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="observations">Observaciones Adicionales</Label>
            <Textarea
              id="observations"
              placeholder="Instrucciones especiales, equipamiento requerido..."
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>
          Atrás
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onSkip}>
            Continuar sin armado
          </Button>
          <Button 
            onClick={handleComplete}
            disabled={
              (assignmentType === 'interno' ? !selectedGuard : !selectedProvider) ||
              !meetingPoint.trim() ||
              !meetingTime.trim()
            }
            className="flex items-center gap-2"
          >
            <CheckCircle2 className="h-4 w-4" />
            Confirmar Asignación
          </Button>
        </div>
      </div>
    </div>
  );
}