/**
 * CustodianStep - Phase 3 of Service Creation
 * Modular custodian selection with search, filters, and communication tracking
 * Includes keyboard shortcuts for faster navigation
 */

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { User, ArrowLeft, ArrowRight, Keyboard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useCustodiosConProximidad } from '@/hooks/useProximidadOperacional';
import { useCustodianStepLogic } from './hooks/useCustodianStepLogic';

// Components
import { CustodianSearch } from './components/CustodianSearch';
import { QuickStats } from './components/QuickStats';
import { CustodianList } from './components/CustodianList';
import { ConflictSection } from './components/ConflictSection';
import { SelectedCustodianSummary } from './components/SelectedCustodianSummary';

// Dialogs (reuse existing)
import { CustodianContactDialog } from '@/pages/Planeacion/components/dialogs/CustodianContactDialog';
import { ConflictOverrideModal } from '@/pages/Planeacion/components/dialogs/ConflictOverrideModal';

import type { CustodioConProximidad } from '@/hooks/useProximidadOperacional';

export default function CustodianStep() {
  const { formData, updateFormData, nextStep, previousStep, markStepCompleted, draftId } = useServiceCreation();
  
  // Main hook for state management
  const { state, actions, servicioNuevo } = useCustodianStepLogic({
    formData,
    updateFormData,
    draftId,
  });
  
  // Fetch custodians with proximity scoring
  const { data: categorized, isLoading } = useCustodiosConProximidad(servicioNuevo);
  
  // Filter custodians locally (instant)
  const filteredCustodians = useMemo(() => 
    actions.filterCustodians(categorized),
    [categorized, actions]
  );
  
  // Total count for stats
  const totalCount = useMemo(() => {
    if (!categorized) return 0;
    return categorized.disponibles.length + 
           categorized.parcialmenteOcupados.length + 
           categorized.ocupados.length;
  }, [categorized]);

  // Ref for keyboard navigation
  const containerRef = useRef<HTMLDivElement>(null);
  const [showShortcuts, setShowShortcuts] = useState(false);

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
  
  // Continue to next step
  const handleContinue = () => {
    markStepCompleted('custodian');
    nextStep();
  };

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

      {/* Search & Filters */}
      <CustodianSearch
        searchTerm={state.searchTerm}
        onSearchChange={actions.setSearchTerm}
        filters={state.filters}
        onFilterToggle={actions.toggleFilter}
        resultsCount={filteredCustodians.length}
        totalCount={totalCount}
      />

      {/* Selected Custodian Summary */}
      {state.selectedCustodianId && (
        <SelectedCustodianSummary
          custodianName={state.selectedCustodianName}
          custodianId={state.selectedCustodianId}
          comunicacion={state.comunicaciones[state.selectedCustodianId]}
          onClear={actions.clearSelection}
        />
      )}

      {/* Custodian List */}
      <CustodianList
        custodians={filteredCustodians}
        isLoading={isLoading}
        selectedId={state.selectedCustodianId}
        highlightedIndex={state.highlightedIndex}
        comunicaciones={state.comunicaciones}
        onSelect={actions.selectCustodian}
        onContact={handleContact}
      />

      {/* Conflict Section */}
      <ConflictSection
        custodians={categorized?.noDisponibles || []}
        onOverrideSelect={handleOverrideSelect}
      />

      {/* Footer Navigation */}
      <div className="flex justify-between gap-3 pt-4 border-t">
        <Button variant="outline" onClick={previousStep} className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Anterior
        </Button>
        <Button
          onClick={handleContinue}
          className="gap-2"
          disabled={!state.canContinue}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
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
    </div>
  );
}
