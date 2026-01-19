import React, { useState, useEffect, useMemo } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AddressAutocomplete } from '@/components/ui/address-autocomplete';
import { Building2, Shield, Search, MapPin, Phone, Users, AlertTriangle, Clock, Zap } from 'lucide-react';
import { useArmedGuardsWithTracking } from '@/hooks/useArmedGuardsWithTracking';
import { useCustodioVehicleData } from '@/hooks/useCustodioVehicleData';
import { ExternalArmedVerificationModal } from './ExternalArmedVerificationModal';
import { ArmedGuardFilters } from './ArmedGuardFilters';
import { useArmedGuardFilters } from '@/hooks/useArmedGuardFilters';
import { toast } from 'sonner';

interface ArmedGuardData {
  armado_id: string;
  armado_nombre: string;
  punto_encuentro: string;
  hora_encuentro: string;
  observaciones?: string;
  tipo_asignacion: 'interno' | 'proveedor';
  proveedor_id?: string;
  personalId?: string;
  nombreCompleto?: string;
  licenciaPortacion?: string;
  verificacionData?: any;
}

interface ServiceData {
  servicio_id?: string;
  origen?: string;
  destino?: string;
  fecha_hora_cita?: string;
  custodio_asignado?: string;
  custodio_id?: string;
}

interface SimplifiedArmedAssignmentProps {
  serviceData: ServiceData;
  onComplete: (data: ArmedGuardData) => void;
  onSkip: () => void;
  onBack: () => void;
  /** Custom label for the back button */
  backLabel?: string;
  /** Whether to show the back button at all */
  showBackButton?: boolean;
}

export function SimplifiedArmedAssignment({
  serviceData,
  onComplete,
  onSkip,
  onBack,
  backLabel = 'Volver',
  showBackButton = true
}: SimplifiedArmedAssignmentProps) {
  const [activeTab, setActiveTab] = useState<'externos' | 'internos'>('externos');
  const [globalSearch, setGlobalSearch] = useState('');
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [selectedGuard, setSelectedGuard] = useState<string | null>(null);
  const [showExternalModal, setShowExternalModal] = useState(false);
  const [meetingPoint, setMeetingPoint] = useState('');
  const [meetingTime, setMeetingTime] = useState('');
  const [observaciones, setObservaciones] = useState('');

  // Extract service context for armed guard filtering
  const serviceContext = useMemo(() => {
    // Parse date/time from fecha_hora_cita
    let fechaProgramada: string | undefined;
    let horaVentanaInicio: string | undefined;
    
    if (serviceData.fecha_hora_cita) {
      const dateObj = new Date(serviceData.fecha_hora_cita);
      fechaProgramada = dateObj.toISOString().split('T')[0];
      horaVentanaInicio = dateObj.toTimeString().slice(0, 5);
    }
    
    return {
      zona_base: serviceData.origen,
      fecha_programada: fechaProgramada,
      hora_ventana_inicio: horaVentanaInicio,
      soloConActividad90Dias: false // Mostrar todos para asignación manual
    };
  }, [serviceData.origen, serviceData.fecha_hora_cita]);

  const { armedGuards, providers, loading, error, refetch } = useArmedGuardsWithTracking(serviceContext);
  const { isHybridCustodian } = useCustodioVehicleData(serviceData.custodio_asignado || undefined);
  const custodioIsHybrid = isHybridCustodian();

  // Use filter hook for internal guards
  const {
    filterConfig,
    filteredGuards: filteredAndSortedGuards,
    updateFilter,
    resetFilters,
    availableZones,
    totalCount,
    filteredCount,
  } = useArmedGuardFilters(armedGuards);

  // Set default meeting time
  useEffect(() => {
    if (serviceData.fecha_hora_cita && !meetingTime) {
      const serviceTime = new Date(serviceData.fecha_hora_cita);
      serviceTime.setMinutes(serviceTime.getMinutes() - 30);
      setMeetingTime(serviceTime.toTimeString().slice(0, 5));
    }
  }, [serviceData.fecha_hora_cita, meetingTime]);

  // Filter providers based on global search
  const filteredProviders = useMemo(() => 
    providers.filter(p =>
      p.nombre_empresa.toLowerCase().includes(globalSearch.toLowerCase()) ||
      p.zonas_cobertura?.some(z => z.toLowerCase().includes(globalSearch.toLowerCase()))
    ),
    [providers, globalSearch]
  );

  // Apply global search on top of filtered guards
  const searchedGuards = useMemo(() =>
    filteredAndSortedGuards.filter(g =>
      g.nombre.toLowerCase().includes(globalSearch.toLowerCase()) ||
      g.zona_base?.toLowerCase().includes(globalSearch.toLowerCase()) ||
      g.telefono?.toLowerCase().includes(globalSearch.toLowerCase())
    ),
    [filteredAndSortedGuards, globalSearch]
  );

  const handleInternalAssignment = (guard: any) => {
    setSelectedGuard(guard.id);
  };

  const handleConfirmInternal = () => {
    const guard = searchedGuards.find(g => g.id === selectedGuard);
    if (!guard) {
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

    onComplete({
      armado_id: guard.id,
      armado_nombre: guard.nombre,
      punto_encuentro: meetingPoint,
      hora_encuentro: meetingTime,
      tipo_asignacion: 'interno',
      observaciones: observaciones.trim() || undefined
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
          <p className="text-muted-foreground">Cargando opciones de armado...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error al cargar armados</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {/* Hybrid custodian warning */}
      {custodioIsHybrid && (
        <Alert className="border-warning bg-warning/5">
          <AlertTriangle className="h-4 w-4 text-warning" />
          <AlertTitle className="text-warning">Custodio híbrido detectado</AlertTitle>
          <AlertDescription>
            El custodio asignado ({serviceData.custodio_asignado}) ya cuenta con porte de arma.
            Solo asigna un armado adicional si el cliente lo solicita explícitamente.
          </AlertDescription>
        </Alert>
      )}

      {/* Global Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar proveedor o armado..."
          value={globalSearch}
          onChange={(e) => setGlobalSearch(e.target.value)}
          className="pl-10 border-border/50 focus:border-corporate-blue focus:ring-corporate-blue/20 transition-all duration-200"
        />
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'externos' | 'internos')}>
        <TabsList className="grid w-full grid-cols-2 bg-background/95 backdrop-blur-apple supports-[backdrop-filter]:bg-background/80 shadow-apple-soft border border-border/50">
          <TabsTrigger value="externos" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200">
            <Building2 className="h-4 w-4" />
            Proveedores Externos
            {filteredProviders.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {filteredProviders.length}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="internos" className="flex items-center gap-2 data-[state=active]:bg-corporate-blue data-[state=active]:text-white data-[state=active]:font-semibold data-[state=active]:shadow-sm text-muted-foreground transition-all duration-200">
            <Shield className="h-4 w-4" />
            Armados Internos
            {searchedGuards.length > 0 && (
              <Badge variant="secondary" className="ml-2">
                {searchedGuards.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        {/* Tab 1: External Providers */}
        <TabsContent value="externos" className="space-y-3 mt-4">
          {filteredProviders.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <AlertTriangle className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No se encontraron proveedores</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {filteredProviders.map((provider) => (
                <Card
                  key={provider.id}
                  className="p-4 hover:border-corporate-blue/30 hover:shadow-apple-soft transition-all duration-200 cursor-pointer shadow-sm"
                >
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                      <div className="font-semibold text-lg flex items-center gap-2">
                        <Building2 className="h-5 w-5 text-primary" />
                        {provider.nombre_empresa}
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-3 w-3" />
                          Cobertura: {provider.zonas_cobertura?.join(', ') || 'Nacional'}
                        </div>
                        <div className="flex items-center gap-2">
                          <Phone className="h-3 w-3" />
                          {provider.telefono_contacto}
                        </div>
                        <div className="flex items-center gap-2">
                          <Users className="h-3 w-3" />
                          {provider.servicios_completados || 0} servicios completados
                        </div>
                      </div>
                    </div>
                    <Button
                      onClick={() => {
                        setSelectedProvider(provider);
                        setShowExternalModal(true);
                      }}
                      className="bg-corporate-blue hover:bg-corporate-blue/90 transition-all duration-200"
                    >
                      Asignar Personal →
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Tab 2: Internal Guards */}
        <TabsContent value="internos" className="space-y-3 mt-4">
          {/* Filters Component */}
          <ArmedGuardFilters
            filterConfig={filterConfig}
            onFilterChange={updateFilter}
            onReset={resetFilters}
            resultsCount={searchedGuards.length}
            totalCount={totalCount}
            availableZones={availableZones}
          />

        {searchedGuards.length === 0 ? (
            <div className="text-center py-12">
              <Shield className="h-16 w-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-lg font-medium">No se encontraron armados internos</p>
              <p className="text-sm text-muted-foreground mt-2">
                {totalCount === 0 
                  ? 'No tienes permisos para ver armados internos o no hay armados registrados.'
                  : 'Intenta ajustar los filtros o buscar por zona.'}
              </p>
              <div className="flex gap-2 justify-center mt-4">
                <Button variant="outline" onClick={resetFilters}>
                  Limpiar Filtros
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    refetch();
                  }}
                >
                  Recargar Lista
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {searchedGuards.slice(0, 20).map((guard) => (
                  <Card
                    key={guard.id}
                    className={`p-4 cursor-pointer transition-all duration-200 ${
                      selectedGuard === guard.id
                        ? 'border-corporate-blue bg-corporate-blue/5 shadow-apple-raised'
                        : 'hover:border-corporate-blue/30 hover:shadow-apple-soft'
                    }`}
                    onClick={() => handleInternalAssignment(guard)}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          <Shield className="h-4 w-4" />
                          {guard.nombre}
                          
                          {/* Top Performer Badge */}
                          {guard.productivityScore && guard.productivityScore > 150 && (
                            <Badge variant="default" className="bg-amber-500 text-white font-semibold border-0 shadow-sm hover:bg-amber-600 transition-colors">
                              <Zap className="h-3 w-3 mr-1" />
                              Top Performer
                            </Badge>
                          )}
                          
                          {/* Virtual Lead Badge - Nuevo candidato aprobado */}
                          {guard.es_lead_virtual && (
                            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 font-medium text-xs">
                              ✨ Nuevo
                            </Badge>
                          )}
                          
                          {/* Availability Badge */}
                          <Badge
                            variant="default"
                            className={guard.disponibilidad === 'disponible' ? 'bg-green-600 text-white font-medium text-xs' : 'bg-muted text-muted-foreground font-medium text-xs'}
                          >
                            {guard.disponibilidad === 'disponible' ? '✓ Disponible' : 'Ocupado'}
                          </Badge>
                        </div>
                        
                        <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground flex-wrap">
                          {guard.rating_promedio > 0 && (
                            <span className="flex items-center gap-1">
                              ⭐ <strong className="text-foreground">{guard.rating_promedio.toFixed(1)}</strong>
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            📊 <strong className="text-foreground">{guard.numero_servicios}</strong> servicios
                          </span>
                          {guard.experiencia_anos > 0 && (
                            <span className="flex items-center gap-1">
                              🎯 <strong className="text-foreground">{guard.experiencia_anos}</strong> años exp.
                            </span>
                          )}
                        </div>
                        
                        <div className="text-sm text-muted-foreground mt-1">
                          📱 {guard.telefono} | 📍 {guard.zona_base}
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {searchedGuards.length > 20 && (
                <p className="text-center text-sm text-muted-foreground">
                  Mostrando 20 de {searchedGuards.length} resultados. Usa los filtros para refinar.
                </p>
              )}

              {/* Meeting details for internal assignment */}
              {selectedGuard && (
                <Card className="p-4 space-y-4 border-primary">
                  <h3 className="font-semibold">Detalles del encuentro</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="meeting-point">Punto de Encuentro *</Label>
                    <AddressAutocomplete
                      value={meetingPoint}
                      onChange={setMeetingPoint}
                      placeholder="Ingresa la dirección del punto de encuentro"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="meeting-time">Hora de Encuentro *</Label>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <Input
                        id="meeting-time"
                        type="time"
                        value={meetingTime}
                        onChange={(e) => setMeetingTime(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observaciones">Observaciones del abordo (opcional)</Label>
                    <Textarea
                      id="observaciones"
                      value={observaciones}
                      onChange={(e) => setObservaciones(e.target.value)}
                      placeholder="Instrucciones especiales del cliente: código de vestimenta, protocolos de seguridad, documentos requeridos, contacto al llegar..."
                      className="min-h-[80px]"
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">
                      {observaciones.length}/500 caracteres
                    </p>
                  </div>

                  <Button onClick={handleConfirmInternal} className="w-full">
                    Confirmar Asignación
                  </Button>
                </Card>
              )}
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-2 pt-4 border-t">
        {showBackButton && (
          <Button variant="outline" onClick={onBack}>
            {backLabel}
          </Button>
        )}
        <Button variant="ghost" onClick={onSkip}>
          Continuar sin armado
        </Button>
      </div>

      {/* External Assignment Modal */}
      {selectedProvider && (
        <ExternalArmedVerificationModal
          open={showExternalModal}
          onOpenChange={setShowExternalModal}
          proveedorId={selectedProvider.id}
          proveedorNombre={selectedProvider.nombre_empresa}
          servicioId={serviceData.servicio_id || ''}
          onConfirm={(data) => {
            // Set default meeting point to service origin if not specified
            const defaultMeetingPoint = meetingPoint || serviceData.origen || '';
            const defaultMeetingTime = meetingTime || '09:00';

            onComplete({
              tipo_asignacion: 'proveedor',
              proveedor_id: selectedProvider.id,
              armado_id: data.personalId,
              armado_nombre: data.nombreCompleto,
              punto_encuentro: defaultMeetingPoint,
              hora_encuentro: defaultMeetingTime,
              personalId: data.personalId,
              nombreCompleto: data.nombreCompleto,
              licenciaPortacion: data.licenciaPortacion,
              verificacionData: data.verificacionData,
              observaciones: observaciones.trim() || undefined
            });
            setShowExternalModal(false);
          }}
        />
      )}
    </div>
  );
}
