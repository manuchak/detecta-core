import React, { useState, useEffect, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RefreshCw, User, Shield, AlertTriangle, X, Trash2, Building2, MapPin, Clock, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useProveedoresArmados } from '@/hooks/useProveedoresArmados';
import { useRegistrarRechazo } from '@/hooks/useCustodioRechazos';

// Modular custodian selection components
import { QuickStats } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/QuickStats';
import { CustodianSearch } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianSearch';
import { CustodianList } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/CustodianList';
import { ConflictSection } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/components/ConflictSection';
import { useCustodiosConProximidad, type CustodioConProximidad } from '@/hooks/useProximidadOperacional';
import type { CustodianCommunicationState, CustodianStepFilters } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/types';
import { DEFAULT_FILTERS } from '@/pages/Planeacion/ServiceCreation/steps/CustodianStep/types';
import ReportUnavailabilityCard from '@/components/custodian/ReportUnavailabilityCard';
import { RejectionTypificationDialog } from './RejectionTypificationDialog';

export interface ServiceForReassignment {
  id: string;
  id_servicio: string;
  nombre_cliente: string;
  origen: string;
  destino: string;
  fecha_hora_cita: string;
  custodio_asignado?: string;
  armado_asignado?: string;
  requiere_armado: boolean;
  estado_planeacion: string;
}

interface ReassignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service: ServiceForReassignment | null;
  assignmentType: 'custodian' | 'armed_guard';
  onReassign: (data: {
    serviceId: string;
    newName: string;
    newId?: string;
    reason: string;
    assignmentType?: 'interno' | 'proveedor';
    providerId?: string;
    puntoEncuentro?: string;
    horaEncuentro?: string;
    tarifaAcordada?: number;
    nombrePersonal?: string;
  }) => Promise<void>;
  onRemove?: (data: {
    serviceId: string;
    assignmentType: 'custodian' | 'armed_guard';
    reason: string;
  }) => Promise<void>;
  isLoading?: boolean;
}

export function ReassignmentModal({
  open,
  onOpenChange,
  service,
  assignmentType,
  onReassign,
  onRemove,
  isLoading = false
}: ReassignmentModalProps) {
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedName, setSelectedName] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [showRemoveConfirm, setShowRemoveConfirm] = useState(false);
  
  // Campos adicionales para proveedores externos
  const [selectedType, setSelectedType] = useState<'interno' | 'proveedor'>('interno');
  const [puntoEncuentro, setPuntoEncuentro] = useState<string>('');
  const [horaEncuentro, setHoraEncuentro] = useState<string>('09:00');
  const [tarifaAcordada, setTarifaAcordada] = useState<string>('');
  const [nombrePersonal, setNombrePersonal] = useState<string>('');
  const [selectedProviderId, setSelectedProviderId] = useState<string>('');

  // NEW: State for modular custodian components
  const [searchTerm, setSearchTerm] = useState('');
  // In reassignment context, show ALL categories by default (including occupied)
  // so planners can find replacement custodians during emergencies (e.g. "Hoy No Circula")
  const REASSIGNMENT_FILTERS: CustodianStepFilters = {
    disponibles: true,
    parcialmenteOcupados: true,
    ocupados: true,
    scoreMinimo: null,
  };
  const [filters, setFilters] = useState<CustodianStepFilters>(REASSIGNMENT_FILTERS);
  const [comunicaciones, setComunicaciones] = useState<Record<string, CustodianCommunicationState>>({});
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  
  // State for unavailability/rejection dialogs
  const [unavailabilityCustodian, setUnavailabilityCustodian] = useState<CustodioConProximidad | null>(null);
  const [showUnavailabilityDialog, setShowUnavailabilityDialog] = useState(false);
  const [rejectionCustodian, setRejectionCustodian] = useState<CustodioConProximidad | null>(null);
  const [showRejectionDialog, setShowRejectionDialog] = useState(false);
  
  // Hook for registering rejections
  const registrarRechazo = useRegistrarRechazo();

  // Hook para proveedores externos
  const { proveedores: proveedoresExternos, loading: loadingProveedores } = useProveedoresArmados();

  // NEW: Create service object for proximity hook
  const servicioNuevo = useMemo(() => {
    if (!service) return undefined;
    return {
      fecha_programada: service.fecha_hora_cita?.split('T')[0] || new Date().toISOString().split('T')[0],
      hora_ventana_inicio: service.fecha_hora_cita?.split('T')[1]?.substring(0, 5) || '09:00',
      origen_texto: service.origen,
      destino_texto: service.destino,
      tipo_servicio: 'custodia' as const,
      incluye_armado: service.requiere_armado,
      requiere_gadgets: false
    };
  }, [service]);

  // NEW: Use proximity hook for custodians with scoring
  const { data: categorized, isLoading: isLoadingCustodians } = useCustodiosConProximidad(
    servicioNuevo,
    { enabled: open && assignmentType === 'custodian' && !!service }
  );

  // NEW: Filtered custodians based on search and filters
  const filteredCustodians = useMemo(() => {
    if (!categorized) return [];
    let result: CustodioConProximidad[] = [];
    
    if (filters.disponibles) result = [...result, ...categorized.disponibles];
    if (filters.parcialmenteOcupados) result = [...result, ...categorized.parcialmenteOcupados];
    if (filters.ocupados) result = [...result, ...categorized.ocupados];
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(c => 
        c.nombre?.toLowerCase().includes(term) ||
        c.telefono?.toLowerCase().includes(term) ||
        c.zona_base?.toLowerCase().includes(term)
      );
    }
    
    return result;
  }, [categorized, searchTerm, filters]);

  // Total count for stats
  const totalCount = useMemo(() => {
    if (!categorized) return 0;
    return (
      categorized.disponibles.length +
      categorized.parcialmenteOcupados.length +
      categorized.ocupados.length +
      categorized.noDisponibles.length
    );
  }, [categorized]);

  // Legacy fetch for armed guards only
  const { data: availableArmados, isLoading: loadingArmados } = useQuery({
    queryKey: ['armados', 'available'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('armados_operativos')
        .select('id, nombre, telefono, estado, disponibilidad, tipo_armado')
        .eq('estado', 'activo')
        .eq('tipo_armado', 'interno')
        .eq('disponibilidad', 'disponible')
        .order('nombre');
      
      if (error) throw error;
      return data || [];
    },
    enabled: open && assignmentType === 'armed_guard' && !!service
  });
  
  // Filtrar proveedores disponibles
  const availableProviders = proveedoresExternos.filter(p => 
    p.activo && 
    p.capacidad_actual < p.capacidad_maxima &&
    p.licencias_vigentes &&
    p.documentos_completos
  );

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setSelectedId('');
      setSelectedName('');
      setReason('');
      setShowRemoveConfirm(false);
      setSelectedType('interno');
      setPuntoEncuentro('');
      setHoraEncuentro('09:00');
      setTarifaAcordada('');
      setNombrePersonal('');
      setSelectedProviderId('');
      // Reset modular component state
      setSearchTerm('');
      setFilters(REASSIGNMENT_FILTERS);
      setComunicaciones({});
      setHighlightedIndex(-1);
    }
  }, [open]);

  // NEW: Handler for custodian selection from modular list
  const handleSelectCustodian = (custodio: CustodioConProximidad) => {
    setSelectedId(custodio.id);
    setSelectedName(custodio.nombre || '');
    setSelectedType('interno');
    
    setComunicaciones(prev => ({
      ...prev,
      [custodio.id]: { status: 'acepta' as const, method: 'whatsapp' }
    }));
  };

  // NEW: Handler for contact actions
  const handleContact = (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => {
    setComunicaciones(prev => ({
      ...prev,
      [custodio.id]: { status: 'contacted' as const, method }
    }));
    
    const phone = custodio.telefono?.replace(/\D/g, '');
    if (method === 'whatsapp' && phone) {
      window.open(`https://wa.me/52${phone}`, '_blank');
    } else if (method === 'llamada' && custodio.telefono) {
      window.open(`tel:${custodio.telefono}`, '_self');
    }
  };

  // NEW: Handler for conflict override
  const handleOverrideSelect = (custodio: CustodioConProximidad) => {
    setSelectedId(custodio.id);
    setSelectedName(custodio.nombre || '');
    setSelectedType('interno');
    toast.info('Custodio con conflicto seleccionado - incluya justificación en la razón');
  };

  // NEW: Handler for filter toggle
  const handleFilterToggle = (key: keyof CustodianStepFilters) => {
    setFilters(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // NEW: Handler for reporting unavailability
  const handleReportUnavailability = (custodio: CustodioConProximidad) => {
    setUnavailabilityCustodian(custodio);
    setShowUnavailabilityDialog(true);
  };

  // NEW: Handler for unavailability submission
  const handleUnavailabilitySubmit = async (data: { tipo: string; motivo?: string; dias: number | null }) => {
    if (!unavailabilityCustodian) return false;
    
    try {
      const fechaFin = data.dias 
        ? new Date(Date.now() + data.dias * 24 * 60 * 60 * 1000).toISOString()
        : null;
      
      // Map UI types to DB-compatible values
      const tipoMapping: Record<string, string> = {
        'emergencia_familiar': 'familiar',
        'falla_mecanica': 'falla_mecanica',
        'enfermedad': 'enfermedad',
        'capacitacion': 'capacitacion',
        'otro': 'otro',
      };
      const tipoDb = tipoMapping[data.tipo] || 'otro';
      const motivoDb = data.motivo?.trim() || tipoDb;

      const { error } = await supabase
        .from('custodio_indisponibilidades')
        .insert({
          custodio_id: unavailabilityCustodian.id,
          tipo_indisponibilidad: tipoDb,
          motivo: motivoDb,
          fecha_inicio: new Date().toISOString(),
          fecha_fin_estimada: fechaFin,
          estado: 'activo',
          severidad: 'media'
        });
      
      if (error) throw error;

      // Invalidate caches so custodian lists refresh
      queryClient.invalidateQueries({ queryKey: ['custodio-indisponibilidades'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-con-proximidad-equitativo'] });
      queryClient.invalidateQueries({ queryKey: ['custodios-operativos-disponibles'] });
      
      toast.success('Indisponibilidad registrada', {
        description: `${unavailabilityCustodian.nombre} marcado como no disponible`
      });
      
      setShowUnavailabilityDialog(false);
      setUnavailabilityCustodian(null);
      return true;
    } catch (error) {
      console.error('Error registering unavailability:', error);
      toast.error('Error al registrar indisponibilidad');
      return false;
    }
  };

  // NEW: Handler for reporting rejection
  const handleReportRejection = (custodio: CustodioConProximidad) => {
    setRejectionCustodian(custodio);
    setShowRejectionDialog(true);
  };

  // NEW: Handler for rejection confirmation
  const handleRejectionConfirm = async (reason: string, unavailabilityDays?: number) => {
    if (!rejectionCustodian) return;
    
    try {
      await registrarRechazo.mutateAsync({
        custodioId: rejectionCustodian.id,
        servicioId: service?.id,
        motivo: reason
      });
      
      // Update local communication state
      setComunicaciones(prev => ({
        ...prev,
        [rejectionCustodian.id]: { 
          status: 'rechaza', 
          razon_rechazo: reason
        }
      }));
      
      setShowRejectionDialog(false);
      setRejectionCustodian(null);
    } catch (error) {
      console.error('Error registering rejection:', error);
    }
  };

  const handleReassign = async () => {
    if (!service || !selectedName.trim() || !reason.trim()) {
      toast.error('Por favor complete todos los campos requeridos');
      return;
    }
    
    // Validaciones adicionales para proveedores
    if (selectedType === 'proveedor') {
      if (!puntoEncuentro.trim()) {
        toast.error('Debe especificar el punto de encuentro');
        return;
      }
      if (!horaEncuentro) {
        toast.error('Debe especificar la hora de encuentro');
        return;
      }
      if (!selectedProviderId) {
        toast.error('Error: No se identificó el proveedor seleccionado');
        return;
      }
    }

    try {
      await onReassign({
        serviceId: service.id,
        newName: selectedName,
        newId: selectedId || undefined,
        reason: reason.trim(),
        assignmentType: selectedType,
        providerId: selectedType === 'proveedor' ? selectedProviderId : undefined,
        puntoEncuentro: selectedType === 'proveedor' ? puntoEncuentro.trim() : undefined,
        horaEncuentro: selectedType === 'proveedor' ? horaEncuentro : undefined,
        tarifaAcordada: selectedType === 'proveedor' && tarifaAcordada ? parseFloat(tarifaAcordada) : undefined,
        nombrePersonal: selectedType === 'proveedor' && nombrePersonal.trim() ? nombrePersonal.trim() : undefined
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error in reassignment:', error);
    }
  };

  const handleRemove = async () => {
    if (!service || !onRemove || !reason.trim()) {
      toast.error('Por favor proporcione una razón para la remoción');
      return;
    }

    try {
      await onRemove({
        serviceId: service.id,
        assignmentType,
        reason: reason.trim()
      });
      onOpenChange(false);
    } catch (error) {
      console.error('Error removing assignment:', error);
    }
  };

  if (!service) return null;

  const currentAssignment = assignmentType === 'custodian' 
    ? service.custodio_asignado 
    : service.armado_asignado;

  const typeLabel = assignmentType === 'custodian' ? 'Custodio' : 'Armado';
  const Icon = assignmentType === 'custodian' ? User : Shield;
  const actionLabel = currentAssignment ? 'Reasignar' : 'Agregar';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[85vh] overflow-hidden flex flex-col z-[60]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" />
            {actionLabel} {typeLabel} - {service.id_servicio}
          </DialogTitle>
        </DialogHeader>

        {/* Two-column layout */}
        <div className="flex-1 overflow-hidden flex gap-6">
          {/* Left Column - Service Context */}
          <div className="w-[260px] flex-shrink-0 space-y-4 overflow-y-auto">
            {/* Compact Service Info */}
            <div className="p-3 rounded-lg bg-muted/30 border text-sm space-y-2">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Building2 className="h-3.5 w-3.5" />
                <span className="text-xs">Cliente</span>
              </div>
              <div className="font-medium truncate">{service.nombre_cliente}</div>
              
              <div className="flex items-center gap-2 text-muted-foreground pt-2">
                <MapPin className="h-3.5 w-3.5" />
                <span className="text-xs">Ruta</span>
              </div>
              <div className="font-medium text-sm">{service.origen} → {service.destino}</div>
              
              <div className="flex items-center gap-2 text-muted-foreground pt-2">
                <Icon className="h-3.5 w-3.5" />
                <span className="text-xs">{typeLabel} Actual</span>
              </div>
              <div className="font-medium">
                {currentAssignment || <span className="text-muted-foreground">Sin asignar</span>}
              </div>
              
              <div className="pt-2 border-t border-border/50">
                <Badge variant="outline" className="text-xs">
                  {service.estado_planeacion}
                </Badge>
              </div>
            </div>

            {/* Reason textarea */}
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-sm">
                {currentAssignment ? 'Razón del cambio' : 'Razón de asignación'} *
              </Label>
              <Textarea
                id="reason"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Describa la razón..."
                rows={3}
                className="resize-none text-sm"
              />
            </div>

            {/* Remove button (if applicable) */}
            {currentAssignment && onRemove && !showRemoveConfirm && (
              <Button 
                variant="ghost" 
                className="w-full text-destructive hover:bg-destructive/10 text-sm"
                onClick={() => setShowRemoveConfirm(true)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Remover asignación
              </Button>
            )}
            
            {/* Remove Confirmation */}
            {showRemoveConfirm && (
              <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="p-3 space-y-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                    <p className="text-sm text-destructive">
                      ¿Remover a "{currentAssignment}"?
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowRemoveConfirm(false)}
                      className="flex-1"
                    >
                      Cancelar
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={handleRemove}
                      disabled={!reason.trim() || isLoading}
                      className="flex-1"
                    >
                      {isLoading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Remover'}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Column - Selection */}
          <div className="flex-1 overflow-hidden flex flex-col space-y-3 min-w-0">
            {assignmentType === 'custodian' ? (
              /* CUSTODIAN SELECTION - MODULAR COMPONENTS */
              <>
                {/* Compact Stats inline */}
                <QuickStats categorized={categorized} isLoading={isLoadingCustodians} variant="compact" />
                
                {/* Search and Filters */}
                <CustodianSearch
                  searchTerm={searchTerm}
                  onSearchChange={setSearchTerm}
                  filters={filters}
                  onFilterToggle={handleFilterToggle}
                  resultsCount={filteredCustodians.length}
                  totalCount={totalCount}
                />
                
                {/* Custodian List with compact cards */}
                <div className="flex-1 overflow-y-auto min-h-0">
                  <CustodianList
                    custodians={filteredCustodians}
                    isLoading={isLoadingCustodians}
                    selectedId={selectedId}
                    highlightedIndex={highlightedIndex}
                    comunicaciones={comunicaciones}
                    onSelect={handleSelectCustodian}
                    onContact={handleContact}
                    onReportUnavailability={handleReportUnavailability}
                    onReportRejection={handleReportRejection}
                    variant="compact"
                  />
                </div>
                
                {/* Conflict Section */}
                {categorized?.noDisponibles && categorized.noDisponibles.length > 0 && (
                  <ConflictSection
                    custodians={categorized.noDisponibles}
                    onOverrideSelect={handleOverrideSelect}
                    forceOpen={filteredCustodians.length === 0}
                  />
                )}
                
                {/* Empty State */}
                {!isLoadingCustodians && filteredCustodians.length === 0 && (!categorized?.noDisponibles || categorized.noDisponibles.length === 0) && (
                  <div className="bg-warning/10 border border-warning/30 rounded-lg p-4">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-warning mt-0.5" />
                      <div>
                        <div className="font-medium text-warning">No hay custodios disponibles</div>
                        <div className="text-warning/80 text-sm">Intente ajustar los filtros.</div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* ARMED GUARDS / PROVIDERS - LEGACY SELECT */
              <div className="space-y-4 overflow-y-auto flex-1">
                {loadingArmados || loadingProveedores ? (
                  <div className="flex items-center gap-2 py-4">
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    <span className="text-muted-foreground">Cargando opciones disponibles...</span>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="assignment-select">Seleccionar Armado o Proveedor *</Label>
                      <Select
                        value={selectedId}
                        onValueChange={(value) => {
                          setSelectedId(value);
                          const isProvider = value.startsWith('provider-');
                          if (isProvider) {
                            const providerId = value.replace('provider-', '');
                            const provider = availableProviders.find(p => p.id === providerId);
                            if (provider) {
                              setSelectedName(provider.nombre_empresa);
                              setSelectedType('proveedor');
                              setSelectedProviderId(providerId);
                              if (provider.tarifa_base_local) {
                                setTarifaAcordada(provider.tarifa_base_local.toString());
                              }
                            }
                          } else {
                            const selected = availableArmados?.find(option => option.id === value);
                            if (selected) {
                              setSelectedName(selected.nombre);
                              setSelectedType('interno');
                              setSelectedProviderId('');
                              setPuntoEncuentro('');
                              setTarifaAcordada('');
                              setNombrePersonal('');
                            }
                          }
                        }}
                      >
                        <SelectTrigger className="bg-background">
                          <SelectValue placeholder="Seleccionar armado o proveedor" />
                        </SelectTrigger>
                        <SelectContent className="bg-background z-[70]" style={{ zoom: 1.428571 }}>
                          {availableArmados && availableArmados.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Armados Internos
                              </SelectLabel>
                              {availableArmados.map((option) => (
                                <SelectItem key={option.id} value={option.id}>
                                  <div className="flex items-center gap-2">
                                    <Shield className="h-3.5 w-3.5" />
                                    <span>{option.nombre}</span>
                                    {option.telefono && (
                                      <span className="text-muted-foreground text-xs">({option.telefono})</span>
                                    )}
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {availableProviders.length > 0 && (
                            <SelectGroup>
                              <SelectLabel className="flex items-center gap-2">
                                <Building2 className="h-4 w-4" />
                                Proveedores Externos
                              </SelectLabel>
                              {availableProviders.map((provider) => (
                                <SelectItem key={`provider-${provider.id}`} value={`provider-${provider.id}`}>
                                  <div className="flex items-center gap-2">
                                    <Building2 className="h-3.5 w-3.5" />
                                    <span>{provider.nombre_empresa}</span>
                                    {provider.tarifa_base_local && (
                                      <Badge variant="outline" className="text-xs ml-1">
                                        ${provider.tarifa_base_local}
                                      </Badge>
                                    )}
                                    <span className="text-muted-foreground text-xs">
                                      ({provider.capacidad_maxima - provider.capacidad_actual} disponibles)
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          )}
                          {(!availableArmados || availableArmados.length === 0) && availableProviders.length === 0 && (
                            <SelectItem value="empty" disabled>
                              No hay armados ni proveedores disponibles
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Provider fields */}
                    {selectedType === 'proveedor' && (
                      <div className="space-y-3 p-3 bg-muted/50 rounded-lg border">
                        <div className="flex items-center gap-2 text-sm font-medium">
                          <Building2 className="h-4 w-4" />
                          <span>Info Proveedor Externo</span>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <Label htmlFor="punto-encuentro" className="text-xs flex items-center gap-1">
                              <MapPin className="h-3 w-3" /> Punto de Encuentro *
                            </Label>
                            <Input
                              id="punto-encuentro"
                              value={puntoEncuentro}
                              onChange={(e) => setPuntoEncuentro(e.target.value)}
                              placeholder="Ej: Oficina Central"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="hora-encuentro" className="text-xs flex items-center gap-1">
                              <Clock className="h-3 w-3" /> Hora *
                            </Label>
                            <Input
                              id="hora-encuentro"
                              type="time"
                              value={horaEncuentro}
                              onChange={(e) => setHoraEncuentro(e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="tarifa-acordada" className="text-xs flex items-center gap-1">
                              <DollarSign className="h-3 w-3" /> Tarifa (MXN)
                            </Label>
                            <Input
                              id="tarifa-acordada"
                              type="number"
                              step="0.01"
                              value={tarifaAcordada}
                              onChange={(e) => setTarifaAcordada(e.target.value)}
                              placeholder="Opcional"
                              className="h-8 text-sm"
                            />
                          </div>
                          <div className="space-y-1">
                            <Label htmlFor="nombre-personal" className="text-xs">Nombre Armado</Label>
                            <Input
                              id="nombre-personal"
                              value={nombrePersonal}
                              onChange={(e) => setNombrePersonal(e.target.value)}
                              placeholder="Opcional"
                              className="h-8 text-sm"
                            />
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Manual Entry Option */}
                    <div className="space-y-2">
                      <Label htmlFor="manual-name" className="text-sm">O ingrese nombre manualmente</Label>
                      <Input
                        id="manual-name"
                        value={selectedName}
                        onChange={(e) => {
                          setSelectedName(e.target.value);
                          setSelectedId('');
                        }}
                        placeholder={`Nombre del ${typeLabel.toLowerCase()}`}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="flex-shrink-0 pt-4 border-t">
          <div className="flex items-center justify-end gap-2 w-full">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              <X className="h-4 w-4 mr-2" />
              Cancelar
            </Button>
            <Button
              onClick={handleReassign}
              disabled={
                !selectedName.trim() || 
                !reason.trim() || 
                (selectedType === 'proveedor' && (!puntoEncuentro.trim() || !horaEncuentro)) ||
                isLoading
              }
              className="bg-primary hover:bg-primary/90"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              {isLoading ? 'Procesando...' : selectedType === 'proveedor' ? 'Asignar Proveedor' : `${actionLabel} ${typeLabel}`}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
      
      {/* Unavailability Dialog */}
      {unavailabilityCustodian && (
        <ReportUnavailabilityCard
          open={showUnavailabilityDialog}
          onOpenChange={(open) => {
            setShowUnavailabilityDialog(open);
            if (!open) setUnavailabilityCustodian(null);
          }}
          onReportUnavailability={handleUnavailabilitySubmit}
          showTriggerButton={false}
        />
      )}
      
      {/* Rejection Dialog */}
      <RejectionTypificationDialog
        isOpen={showRejectionDialog}
        onClose={() => {
          setShowRejectionDialog(false);
          setRejectionCustodian(null);
        }}
        onConfirm={handleRejectionConfirm}
        guardName={rejectionCustodian?.nombre || ''}
      />
    </Dialog>
  );
}
