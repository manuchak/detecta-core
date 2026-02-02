/**
 * CustodianStep - Phase 3 of Service Creation
 * Modular custodian selection with search, filters, and communication tracking
 * Includes keyboard shortcuts for faster navigation
 * 
 * CRITICAL FIX: Now handles the case where ALL custodians are in conflict,
 * showing them prominently instead of displaying "empty list" to the planner.
 * 
 * ENHANCED: Now filters out rejected custodians (persisted for 7 days)
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { User, ArrowLeft, ArrowRight, Keyboard, RefreshCw, ShieldAlert, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useCustodiosConProximidad } from '@/hooks/useProximidadOperacional';
import { useCustodianStepLogic } from './hooks/useCustodianStepLogic';
import { useCustodioIndisponibilidades } from '@/hooks/useCustodioIndisponibilidades';
import { useRechazosVigentes, useRegistrarRechazo } from '@/hooks/useCustodioRechazos';
import { useAuth } from '@/contexts/AuthContext';
import { addDays } from 'date-fns';

// Components
import { CustodianSearch } from './components/CustodianSearch';
import { QuickStats } from './components/QuickStats';
import { CustodianList } from './components/CustodianList';
import { ConflictSection } from './components/ConflictSection';
import { SelectedCustodianSummary } from './components/SelectedCustodianSummary';
import { NoCustodiansAlert } from './components/NoCustodiansAlert';
import ReportUnavailabilityCard from '@/components/custodian/ReportUnavailabilityCard';

// Dialogs (reuse existing)
import { CustodianContactDialog } from '@/pages/Planeacion/components/dialogs/CustodianContactDialog';
import { ConflictOverrideModal } from '@/pages/Planeacion/components/dialogs/ConflictOverrideModal';

import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';

export default function CustodianStep() {
  const { formData, updateFormData, nextStep, previousStep, markStepCompleted, draftId, isHydrated } = useServiceCreation();
  const { userRole } = useAuth();
  
  // Main hook for state management
  const { state, actions, servicioNuevo } = useCustodianStepLogic({
    formData,
    updateFormData,
    draftId,
  });
  
  // Unavailability hook
  const { crearIndisponibilidad } = useCustodioIndisponibilidades();
  
  // 🆕 Rejection hooks
  const { data: rechazadosIds = [] } = useRechazosVigentes();
  const { mutateAsync: registrarRechazo } = useRegistrarRechazo();
  
  // ✅ Double-check: hydrated AND critical service data exists
  const isReadyToQuery = isHydrated && servicioNuevo && 
    Boolean(servicioNuevo.fecha_programada) && 
    Boolean(servicioNuevo.hora_ventana_inicio);
  
  const queryableServicio = isReadyToQuery ? servicioNuevo : undefined;
  
  // Fetch custodians with proximity scoring (blocked until ready)
  const { data: categorized, isLoading, error, refetch: refetchCustodians } = useCustodiosConProximidad(
    queryableServicio,
    { enabled: isReadyToQuery }
  );
  
  // Filter custodians locally (instant) - also excludes rejected
  const filteredCustodians = useMemo(() => {
    const baseFiltered = actions.filterCustodians(categorized);
    // 🆕 Exclude custodians with active rejections
    return baseFiltered.filter(c => !rechazadosIds.includes(c.id));
  }, [categorized, actions, rechazadosIds]);
  
  // Get selected custodian details
  const selectedCustodian = useMemo(() => {
    if (!state.selectedCustodianId || !categorized) return null;
    const allCustodians = [
      ...(categorized.disponibles || []),
      ...(categorized.parcialmenteOcupados || []),
      ...(categorized.ocupados || []),
      ...(categorized.noDisponibles || []),
    ];
    return allCustodians.find(c => c.id === state.selectedCustodianId);
  }, [state.selectedCustodianId, categorized]);
  
  // Total count for stats (excludes noDisponibles)
  const totalCount = useMemo(() => {
    if (!categorized) return 0;
    return (categorized.disponibles?.length || 0) + 
           (categorized.parcialmenteOcupados?.length || 0) + 
           (categorized.ocupados?.length || 0);
  }, [categorized]);

  // CRITICAL: Detect "all in conflict" scenario
  const allInConflict = useMemo(() => {
    if (!categorized) return false;
    const disponiblesCount = totalCount;
    const conflictCount = categorized.noDisponibles?.length || 0;
    return disponiblesCount === 0 && conflictCount > 0;
  }, [categorized, totalCount]);

  // Counts for diagnostic alert
  const custodianCounts = useMemo(() => ({
    disponibles: categorized?.disponibles?.length || 0,
    parcialmenteOcupados: categorized?.parcialmenteOcupados?.length || 0,
    ocupados: categorized?.ocupados?.length || 0,
    noDisponibles: categorized?.noDisponibles?.length || 0,
  }), [categorized]);

  // Check if filters are actively hiding results
  const hasActiveFilters = useMemo(() => {
    return state.searchTerm.trim() !== '' || 
           !state.filters.disponibles || 
           !state.filters.parcialmenteOcupados;
  }, [state.searchTerm, state.filters]);

  // Ref for keyboard navigation and conflict section
  const containerRef = useRef<HTMLDivElement>(null);
  const conflictSectionRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

  // Handler to scroll to conflict section
  const scrollToConflicts = useCallback(() => {
    conflictSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  // Handler to reset filters
  const resetFilters = useCallback(() => {
    actions.setSearchTerm('');
    if (!state.filters.disponibles) actions.toggleFilter('disponibles');
    if (!state.filters.parcialmenteOcupados) actions.toggleFilter('parcialmenteOcupados');
  }, [actions, state.filters]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't capture if user is typing in input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          actions.setHighlightedIndex(
            Math.min(state.highlightedIndex + 1, filteredCustodians.length - 1)
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          actions.setHighlightedIndex(Math.max(state.highlightedIndex - 1, 0));
          break;
        case 'Enter':
          if (state.highlightedIndex >= 0 && filteredCustodians[state.highlightedIndex]) {
            e.preventDefault();
            actions.selectCustodian(filteredCustodians[state.highlightedIndex]);
          }
          break;
        case 'w':
        case 'W':
          if (state.highlightedIndex >= 0 && filteredCustodians[state.highlightedIndex]) {
            e.preventDefault();
            handleContact(filteredCustodians[state.highlightedIndex], 'whatsapp');
          }
          break;
        case 'l':
        case 'L':
          if (state.highlightedIndex >= 0 && filteredCustodians[state.highlightedIndex]) {
            e.preventDefault();
            handleContact(filteredCustodians[state.highlightedIndex], 'llamada');
          }
          break;
        case '?':
          setShowShortcuts(prev => !prev);
          break;
        case 'Escape':
          if (showShortcuts) setShowShortcuts(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.highlightedIndex, filteredCustodians, actions, showShortcuts]);
  
  // Dialog states
  const [contactDialogOpen, setContactDialogOpen] = useState(false);
  const [contactCustodian, setContactCustodian] = useState<CustodioConProximidad | null>(null);
  const [contactMethod, setContactMethod] = useState<'whatsapp' | 'llamada'>('whatsapp');
  const [overrideModalOpen, setOverrideModalOpen] = useState(false);
  const [overrideCustodian, setOverrideCustodian] = useState<CustodioConProximidad | null>(null);
  
  // Unavailability dialog state
  const [unavailabilityDialogOpen, setUnavailabilityDialogOpen] = useState(false);
  const [unavailabilityCustodian, setUnavailabilityCustodian] = useState<CustodioConProximidad | null>(null);
  
  // Handle contact button click
  const handleContact = (custodio: CustodioConProximidad, method: 'whatsapp' | 'llamada') => {
    setContactCustodian(custodio);
    setContactMethod(method);
    setContactDialogOpen(true);
  };
  
  // Handle contact result
  const handleContactResult = (result: any) => {
    if (contactCustodian) {
      actions.updateComunicacion(contactCustodian.id, {
        status: result.status,
        method: contactMethod,
        razon_rechazo: result.razon_rechazo,
        categoria_rechazo: result.categoria_rechazo,
        contactar_en: result.contactar_en,
      });
    }
    setContactDialogOpen(false);
    setContactCustodian(null);
  };
  
  // Handle override selection
  const handleOverrideSelect = (custodio: CustodioConProximidad) => {
    setOverrideCustodian(custodio);
    setOverrideModalOpen(true);
  };
  
  // Handle override confirmation
  const handleOverrideConfirm = (motivo: string, detalles?: string) => {
    if (overrideCustodian) {
      actions.selectCustodian(overrideCustodian);
      actions.updateComunicacion(overrideCustodian.id, {
        status: 'acepta',
        method: 'whatsapp',
      });
    }
    setOverrideModalOpen(false);
    setOverrideCustodian(null);
  };
  
  // Handle unavailability report
  const handleReportUnavailability = (custodio: CustodioConProximidad) => {
    setUnavailabilityCustodian(custodio);
    setUnavailabilityDialogOpen(true);
  };
  
  // Handle unavailability submission
  const handleUnavailabilitySubmit = async (data: {
    tipo: string;
    motivo: string;
    dias: number;
  }) => {
    if (!unavailabilityCustodian) return false;
    
    try {
      await crearIndisponibilidad.mutateAsync({
        custodio_id: unavailabilityCustodian.id,
        tipo_indisponibilidad: data.tipo as any,
        motivo: data.motivo,
        fecha_fin_estimada: addDays(new Date(), data.dias).toISOString(),
        severidad: 'media',
        requiere_seguimiento: true,
      });
      
      // Refresh custodian list
      refetchCustodians();
      
      setUnavailabilityDialogOpen(false);
      setUnavailabilityCustodian(null);
      return true;
    } catch (error) {
      console.error('Error reporting unavailability:', error);
      return false;
    }
  };
  
  // 🆕 Handle rejection (persists to DB for 7 days)
  const handleReportRejection = async (custodio: CustodioConProximidad) => {
    try {
      await registrarRechazo({
        custodioId: custodio.id,
        servicioId: draftId || undefined,
        motivo: 'Rechazó durante asignación',
      });
      // List will auto-refresh due to query invalidation
    } catch (error) {
      console.error('Error registering rejection:', error);
    }
  };
  
  // Continue to next step
  const handleContinue = () => {
    markStepCompleted('custodian');
    nextStep();
  };

  // Loading state while hydrating draft data
  if (!isHydrated) {
    return (
      <div className="space-y-6" ref={containerRef}>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Asignar Custodio
          </h2>
          <p className="text-muted-foreground">Cargando datos del servicio...</p>
        </div>
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  // Error state - show explicit error instead of empty list
  if (error) {
    return (
      <div className="space-y-6" ref={containerRef}>
        <div className="space-y-1">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Asignar Custodio
          </h2>
        </div>
        
        <Alert variant="destructive">
          <ShieldAlert className="h-4 w-4" />
          <AlertTitle>Error al cargar custodios</AlertTitle>
          <AlertDescription className="space-y-3">
            <p>{(error as Error).message || 'No se pudieron cargar los custodios disponibles.'}</p>
            <div className="text-xs bg-destructive/10 p-3 rounded-md space-y-1">
              <p><strong>Tu rol actual:</strong> {userRole || 'No asignado'}</p>
              <p><strong>Roles requeridos:</strong> admin, owner, planificador, coordinador_operaciones</p>
              <p className="text-muted-foreground pt-1">
                Si crees que deberías tener acceso, contacta al administrador o intenta cerrar sesión y volver a entrar.
              </p>
            </div>
            <Button variant="outline" size="sm" onClick={() => refetchCustodians()} className="gap-2">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </Button>
          </AlertDescription>
        </Alert>
        
        {/* Navigation to go back */}
        <div className="flex justify-start pt-4 border-t">
          <Button variant="outline" onClick={previousStep} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" ref={containerRef}>
      {/* Header */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <User className="h-6 w-6 text-primary" />
            Asignar Custodio
          </h2>
          <Button
            variant="ghost"
            size="sm"
            className="gap-1.5 text-xs text-muted-foreground"
            onClick={() => setShowShortcuts(!showShortcuts)}
          >
            <Keyboard className="h-3.5 w-3.5" />
            Atajos
          </Button>
        </div>
        <p className="text-muted-foreground">
          Selecciona y contacta al custodio disponible para este servicio
        </p>
      </div>

      {/* Keyboard shortcuts help */}
      {showShortcuts && (
        <div className="p-3 rounded-lg bg-muted/50 border text-sm space-y-1">
          <div className="font-medium text-xs text-muted-foreground mb-2">ATAJOS DE TECLADO</div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">↑↓</Badge>
              <span className="text-muted-foreground">Navegar lista</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">Enter</Badge>
              <span className="text-muted-foreground">Seleccionar</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">W</Badge>
              <span className="text-muted-foreground">WhatsApp</span>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-xs">L</Badge>
              <span className="text-muted-foreground">Llamar</span>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <QuickStats categorized={categorized} isLoading={isLoading} />

      {/* Search & Filters - Hide when custodian is selected */}
      {!state.selectedCustodianId && (
        <CustodianSearch
          searchTerm={state.searchTerm}
          onSearchChange={actions.setSearchTerm}
          filters={state.filters}
          onFilterToggle={actions.toggleFilter}
          resultsCount={filteredCustodians.length}
          totalCount={totalCount}
        />
      )}

      {/* Selected Custodian Summary - Expanded with CTAs */}
      {state.selectedCustodianId && selectedCustodian && (
        <SelectedCustodianSummary
          custodianName={state.selectedCustodianName}
          custodianId={state.selectedCustodianId}
          custodianPhone={selectedCustodian.telefono}
          custodianVehicle={selectedCustodian.zona_base}
          comunicacion={state.comunicaciones[state.selectedCustodianId]}
          onClear={actions.clearSelection}
          onContinue={handleContinue}
          onContact={(method) => handleContact(selectedCustodian, method)}
        />
      )}

      {/* Diagnostic Alert - Shows when no custodians visible */}
      {!state.selectedCustodianId && !isLoading && filteredCustodians.length === 0 && (
        <NoCustodiansAlert
          counts={custodianCounts}
          hasActiveFilters={hasActiveFilters}
          searchTerm={state.searchTerm}
          onResetFilters={resetFilters}
          onScrollToConflicts={scrollToConflicts}
          onRefetch={() => refetchCustodians()}
          isLoading={isLoading}
        />
      )}

      {/* Custodian List - Auto-collapses when selection is made */}
      <CustodianList
        custodians={filteredCustodians}
        isLoading={isLoading}
        selectedId={state.selectedCustodianId}
        highlightedIndex={state.highlightedIndex}
        comunicaciones={state.comunicaciones}
        onSelect={actions.selectCustodian}
        onContact={handleContact}
        onReportUnavailability={handleReportUnavailability}
        onReportRejection={handleReportRejection}
      />

      {/* Conflict Section - Force open when all custodians are in conflict */}
      <ConflictSection
        custodians={categorized?.noDisponibles || []}
        onOverrideSelect={handleOverrideSelect}
        forceOpen={allInConflict}
        sectionRef={conflictSectionRef}
      />

      {/* Footer Navigation - Contextual status */}
      <div className="flex justify-between gap-3 pt-4 border-t sticky bottom-0 bg-background/95 backdrop-blur-sm pb-2 -mx-1 px-1">
        <Button variant="outline" onClick={previousStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>
        
        <div className="flex items-center gap-3">
          {state.selectedCustodianId && state.canContinue && (
            <span className="text-sm text-green-600 dark:text-green-400 hidden sm:block">
              ✓ {state.selectedCustodianName}
            </span>
          )}
          <Button
            onClick={handleContinue}
            className="gap-2"
            disabled={!state.canContinue}
          >
            Continuar
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Contact Dialog */}
      {contactCustodian && (
        <CustodianContactDialog
          open={contactDialogOpen}
          onOpenChange={setContactDialogOpen}
          custodian={contactCustodian as any}
          serviceDetails={{
            origen: formData.origen || '',
            destino: formData.destino || '',
            fecha_hora: `${formData.fecha} ${formData.hora}`,
            tipo_servicio: formData.tipoServicio || 'Custodia',
          }}
          initialMethod={contactMethod}
          onResult={handleContactResult}
        />
      )}

      {/* Override Modal */}
      {overrideCustodian && (
        <ConflictOverrideModal
          open={overrideModalOpen}
          onOpenChange={setOverrideModalOpen}
          custodioNombre={overrideCustodian.nombre}
          custodioId={overrideCustodian.id}
          conflictDetails={{
            razon_no_disponible: overrideCustodian.razon_no_disponible,
          }}
          onConfirm={handleOverrideConfirm}
        />
      )}

      {/* Unavailability Dialog */}
      {unavailabilityCustodian && (
        <ReportUnavailabilityCard
          open={unavailabilityDialogOpen}
          onOpenChange={setUnavailabilityDialogOpen}
          showTriggerButton={false}
          onReportUnavailability={handleUnavailabilitySubmit}
        />
      )}
    </div>
  );
}
