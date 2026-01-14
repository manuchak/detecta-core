/**
 * CustodianStep - Phase 3 of Service Creation
 * Modular custodian selection with search, filters, and communication tracking
 */

import { useState, useMemo } from 'react';
import { User, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <User className="h-6 w-6 text-primary" />
          Asignar Custodio
        </h2>
        <p className="text-muted-foreground">
          Selecciona y contacta al custodio disponible para este servicio
        </p>
      </div>

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
