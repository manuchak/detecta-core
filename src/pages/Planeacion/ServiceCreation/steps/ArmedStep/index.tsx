import { useState, useEffect, useMemo, useCallback } from 'react';
import { Shield, ArrowLeft, ArrowRight, Search, MapPin, Clock, Star, Phone, AlertTriangle, CheckCircle, Building2, User, Sparkles, Ban, Filter, RefreshCw, Plus, X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { useServiceCreation, type ArmadoSeleccionado } from '../../hooks/useServiceCreation';
import { useArmedGuardsWithTracking, type ArmedGuard, type ArmedProvider } from '@/hooks/useArmedGuardsWithTracking';
import { ExternalArmedVerificationModal } from '@/components/planeacion/ExternalArmedVerificationModal';
import { MeetingPointSection } from './components/MeetingPointSection';

/**
 * ArmedStep - Fourth step in service creation
 * Supports multi-armado selection (1..N armed guards per service)
 */
export default function ArmedStep() {
  const { formData, updateFormData, nextStep, previousStep, markStepCompleted } = useServiceCreation();
  
  const cantidadRequeridos = formData.cantidadArmadosRequeridos || 1;
  
  // Filter state for 90-day activity (UI toggle)
  const [soloConActividad90Dias, setSoloConActividad90Dias] = useState(false);
  
  // Load armed guards with service context
  const { armedGuards, providers, loading, error, refetch } = useArmedGuardsWithTracking({
    zona_base: formData.origen,
    tipo_servicio: formData.tipoServicio as 'local' | 'foraneo' | 'alta_seguridad',
    incluye_armado: formData.requiereArmado,
    fecha_programada: formData.fecha,
    hora_ventana_inicio: formData.hora,
    soloConActividad90Dias
  });

  // Multi-selection state: array of selected armados
  const [selectedArmados, setSelectedArmados] = useState<ArmadoSeleccionado[]>(
    formData.armados && formData.armados.length > 0 ? formData.armados : []
  );
  
  // Local state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'internos' | 'proveedores'>('internos');
  
  // External provider verification modal
  const [verificationModalOpen, setVerificationModalOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<ArmedProvider | null>(null);

  // Calculate suggested meeting time (30 min before appointment)
  const suggestedTime = useMemo(() => {
    if (!formData.hora) return '';
    const [hours, minutes] = formData.hora.split(':').map(Number);
    const meetingDate = new Date();
    meetingDate.setHours(hours, minutes - 30, 0);
    return `${String(meetingDate.getHours()).padStart(2, '0')}:${String(meetingDate.getMinutes()).padStart(2, '0')}`;
  }, [formData.hora]);

  // IDs of already-selected armados (to prevent double-select)
  const selectedIds = useMemo(() => new Set(selectedArmados.map(a => a.id)), [selectedArmados]);

  // Filter guards by search query
  const filteredGuards = useMemo(() => {
    if (!searchQuery.trim()) return armedGuards;
    const query = searchQuery.toLowerCase();
    return armedGuards.filter(guard => 
      guard.nombre.toLowerCase().includes(query) ||
      guard.zona_base?.toLowerCase().includes(query)
    );
  }, [armedGuards, searchQuery]);

  // Filter providers by search query
  const filteredProviders = useMemo(() => {
    if (!searchQuery.trim()) return providers;
    const query = searchQuery.toLowerCase();
    return providers.filter(provider => 
      provider.nombre_empresa.toLowerCase().includes(query) ||
      provider.contacto_principal.toLowerCase().includes(query)
    );
  }, [providers, searchQuery]);

  // Handle adding an internal guard
  const handleSelectInternalGuard = (guard: ArmedGuard) => {
    if (selectedIds.has(guard.id)) return; // Already selected
    if (selectedArmados.length >= cantidadRequeridos) return; // Max reached
    
    const newArmado: ArmadoSeleccionado = {
      nombre: guard.nombre,
      id: guard.id,
      tipo: 'interno',
      puntoEncuentro: '',
      horaEncuentro: suggestedTime,
    };
    setSelectedArmados(prev => [...prev, newArmado]);
  };

  // Handle provider selection - opens verification modal
  const handleSelectProvider = (provider: ArmedProvider) => {
    if (selectedArmados.length >= cantidadRequeridos) return;
    setSelectedProvider(provider);
    setVerificationModalOpen(true);
  };

  // Handle provider verification confirm
  const handleProviderVerified = (personalData: {
    personalId: string;
    nombreCompleto: string;
    licenciaPortacion?: string;
    verificacionData: any;
  }) => {
    if (selectedProvider && !selectedIds.has(personalData.personalId)) {
      const newArmado: ArmadoSeleccionado = {
        nombre: personalData.nombreCompleto,
        id: personalData.personalId,
        tipo: 'proveedor',
        proveedorId: selectedProvider.id,
        puntoEncuentro: '',
        horaEncuentro: suggestedTime,
      };
      setSelectedArmados(prev => [...prev, newArmado]);
      setVerificationModalOpen(false);
    }
  };

  // Remove an armado from selection
  const handleRemoveArmado = (id: string) => {
    setSelectedArmados(prev => prev.filter(a => a.id !== id));
  };

  // Update meeting point for a specific armado
  const handleUpdateArmadoPunto = useCallback((id: string, value: string) => {
    setSelectedArmados(prev => prev.map(a => a.id === id ? { ...a, puntoEncuentro: value } : a));
  }, []);

  // Update meeting time for a specific armado
  const handleUpdateArmadoHora = useCallback((id: string, value: string) => {
    setSelectedArmados(prev => prev.map(a => a.id === id ? { ...a, horaEncuentro: value } : a));
  }, []);

  // Check if all selected armados have meeting points filled
  const allMeetingPointsFilled = useMemo(() => {
    return selectedArmados.every(a => a.puntoEncuentro && a.horaEncuentro);
  }, [selectedArmados]);

  const canContinue = selectedArmados.length >= cantidadRequeridos && allMeetingPointsFilled;

  // Handle continue - sync to formData
  const handleContinue = () => {
    // Build legacy scalar aliases from first armado
    const first = selectedArmados[0];
    updateFormData({
      armados: selectedArmados,
      // Legacy scalar compat
      armado: first?.nombre || '',
      armadoId: first?.id || '',
      tipoAsignacionArmado: first?.tipo || null,
      proveedorArmadoId: first?.proveedorId || null,
      puntoEncuentro: first?.puntoEncuentro || '',
      horaEncuentro: first?.horaEncuentro || '',
    });
    markStepCompleted('armed');
    nextStep();
  };

  // Availability badge component
  const AvailabilityBadge = ({ guard }: { guard: ArmedGuard }) => {
    const availability = guard.disponibilidad;
    if (availability === 'disponible') {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          Disponible
        </Badge>
      );
    }
    if (availability === 'ocupado') {
      return (
        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800">
          <AlertTriangle className="h-3 w-3 mr-1" />
          Ocupado
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800">
        <Ban className="h-3 w-3 mr-1" />
        No disponible
      </Badge>
    );
  };

  // Guard card component
  const GuardCard = ({ guard }: { guard: ArmedGuard }) => {
    const isSelected = selectedIds.has(guard.id);
    const isNewGuard = guard.es_lead_virtual || guard.numero_servicios === 0;
    const isFull = selectedArmados.length >= cantidadRequeridos;
    
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-primary/50",
          isSelected && "ring-2 ring-primary border-primary bg-primary/5",
          !isSelected && isFull && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !isSelected && !isFull && handleSelectInternalGuard(guard)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center shrink-0",
              isSelected ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
            )}>
              {isSelected ? <Check className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{guard.nombre}</span>
                {isNewGuard && (
                  <Badge variant="secondary" className="text-[10px] gap-1">
                    <Sparkles className="h-2.5 w-2.5" />
                    Nuevo
                  </Badge>
                )}
                {isSelected && (
                  <Badge className="text-[10px] gap-1">
                    <Check className="h-2.5 w-2.5" />
                    Seleccionado
                  </Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                {guard.zona_base && (
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {guard.zona_base}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {guard.rating_promedio?.toFixed(1) || 'N/A'}
                </span>
                <span>{guard.numero_servicios} servicios</span>
              </div>
              
              <div className="flex items-center justify-between">
                <AvailabilityBadge guard={guard} />
                {guard.telefono && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-xs"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(`tel:${guard.telefono}`);
                    }}
                  >
                    <Phone className="h-3 w-3 mr-1" />
                    Contactar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  // Provider card component
  const ProviderCard = ({ provider }: { provider: ArmedProvider }) => {
    const isFull = selectedArmados.length >= cantidadRequeridos;
    return (
      <Card 
        className={cn(
          "cursor-pointer transition-all hover:border-primary/50",
          isFull && "opacity-50 cursor-not-allowed"
        )}
        onClick={() => !isFull && handleSelectProvider(provider)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/30 flex items-center justify-center shrink-0">
              <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
            
            <div className="flex-1 min-w-0 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium truncate">{provider.nombre_empresa}</span>
                {provider.disponibilidad_24h && (
                  <Badge variant="secondary" className="text-[10px]">24h</Badge>
                )}
              </div>
              
              <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <User className="h-3 w-3" />
                  {provider.contacto_principal}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {provider.rating_proveedor?.toFixed(1) || 'N/A'}
                </span>
                <span>{provider.servicios_completados} servicios</span>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex flex-wrap gap-1">
                  {provider.zonas_cobertura?.slice(0, 2).map((zona, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">
                      {zona}
                    </Badge>
                  ))}
                  {(provider.zonas_cobertura?.length || 0) > 2 && (
                    <Badge variant="outline" className="text-[10px]">
                      +{provider.zonas_cobertura!.length - 2}
                    </Badge>
                  )}
                </div>
                {provider.tarifa_por_servicio && (
                  <span className="text-sm font-medium text-muted-foreground">
                    ${provider.tarifa_por_servicio.toLocaleString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with counter */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Asignar Elemento{cantidadRequeridos > 1 ? 's' : ''} Armado{cantidadRequeridos > 1 ? 's' : ''}
          </h2>
          <Badge 
            variant={selectedArmados.length >= cantidadRequeridos ? 'default' : 'secondary'}
            className="text-sm"
          >
            {selectedArmados.length}/{cantidadRequeridos} asignados
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {cantidadRequeridos > 1 
            ? `Selecciona ${cantidadRequeridos} guardias armados y define sus puntos de encuentro`
            : 'Selecciona el guardia armado y define el punto de encuentro'}
        </p>
      </div>

      {/* Selected armados chips */}
      {selectedArmados.length > 0 && (
        <div className="flex flex-wrap gap-2 p-3 rounded-lg bg-primary/5 border border-primary/20">
          {selectedArmados.map((armado, idx) => (
            <Badge key={armado.id} variant="outline" className="gap-1.5 py-1.5 pl-2.5 pr-1.5">
              <Shield className="h-3 w-3" />
              <span className="font-medium">{armado.nombre}</span>
              <span className="text-muted-foreground capitalize">({armado.tipo})</span>
              <button
                onClick={() => handleRemoveArmado(armado.id)}
                className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {/* Search and filters */}
      {selectedArmados.length < cantidadRequeridos && (
        <>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar por nombre, zona o proveedor..."
                  className="pl-10"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="outline" size="icon" onClick={refetch} disabled={loading}>
                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
              </Button>
            </div>
            <div className="flex items-center gap-2">
              <Badge
                variant={soloConActividad90Dias ? 'default' : 'outline'}
                className="cursor-pointer transition-all"
                onClick={() => setSoloConActividad90Dias(!soloConActividad90Dias)}
              >
                {soloConActividad90Dias ? '✓ ' : ''}Activos (90 días)
              </Badge>
              <span className="text-xs text-muted-foreground">
                {soloConActividad90Dias 
                  ? 'Mostrando solo armados con servicios recientes' 
                  : 'Mostrando todos los armados'}
              </span>
            </div>
          </div>

          {/* Tabs for internal vs external */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'internos' | 'proveedores')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="internos" className="gap-2">
                <User className="h-4 w-4" />
                Internos ({filteredGuards.length})
              </TabsTrigger>
              <TabsTrigger value="proveedores" className="gap-2">
                <Building2 className="h-4 w-4" />
                Proveedores ({filteredProviders.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="internos" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : error ? (
                <div className="p-4 rounded-lg bg-destructive/10 text-destructive text-center">
                  <AlertTriangle className="h-5 w-5 mx-auto mb-2" />
                  <p className="text-sm">{error}</p>
                  <Button variant="outline" size="sm" className="mt-2" onClick={refetch}>
                    Reintentar
                  </Button>
                </div>
              ) : filteredGuards.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Shield className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay elementos armados disponibles</p>
                  <p className="text-sm mt-1">Prueba ajustando los filtros o busca en proveedores externos</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {filteredGuards.map(guard => (
                      <GuardCard key={guard.id} guard={guard} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>

            <TabsContent value="proveedores" className="mt-4">
              {loading ? (
                <div className="space-y-3">
                  {[1, 2].map(i => (
                    <Skeleton key={i} className="h-24 w-full" />
                  ))}
                </div>
              ) : filteredProviders.length === 0 ? (
                <div className="p-8 text-center text-muted-foreground">
                  <Building2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                  <p className="font-medium">No hay proveedores disponibles</p>
                  <p className="text-sm mt-1">No se encontraron proveedores para esta zona</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-3">
                    {filteredProviders.map(provider => (
                      <ProviderCard key={provider.id} provider={provider} />
                    ))}
                  </div>
                </ScrollArea>
              )}
            </TabsContent>
          </Tabs>
        </>
      )}

      {/* Meeting point sections - one per selected armado */}
      {selectedArmados.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-sm font-medium text-muted-foreground">
            Puntos de encuentro
          </h3>
          {selectedArmados.map((armado, idx) => (
            <div key={armado.id} className="space-y-1">
              {cantidadRequeridos > 1 && (
                <p className="text-xs font-medium text-muted-foreground pl-1">
                  Armado {idx + 1}: {armado.nombre} ({armado.tipo})
                </p>
              )}
              <MeetingPointSection
                puntoEncuentro={armado.puntoEncuentro}
                horaEncuentro={armado.horaEncuentro}
                horaCita={formData.hora}
                armadoInternoId={armado.tipo === 'interno' ? armado.id : undefined}
                proveedorId={armado.proveedorId}
                onPuntoEncuentroChange={(v) => handleUpdateArmadoPunto(armado.id, v)}
                onHoraEncuentroChange={(v) => handleUpdateArmadoHora(armado.id, v)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Footer navigation */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button
          variant="outline"
          onClick={previousStep}
          className="gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          className="gap-2"
          disabled={!canContinue}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>

      {/* External provider verification modal */}
      {selectedProvider && (
        <ExternalArmedVerificationModal
          open={verificationModalOpen}
          onOpenChange={setVerificationModalOpen}
          proveedorId={selectedProvider.id}
          proveedorNombre={selectedProvider.nombre_empresa}
          servicioId={formData.servicioId || ''}
          onConfirm={handleProviderVerified}
        />
      )}
    </div>
  );
}
