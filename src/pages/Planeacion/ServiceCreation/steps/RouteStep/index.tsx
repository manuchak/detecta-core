import { useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useRouteSubSteps } from './hooks/useRouteSubSteps';
import { RouteSubStepIndicator } from './RouteSubStepIndicator';
import { ClientSearchSubStep } from './substeps/ClientSearchSubStep';
// Future imports for other substeps
// import { LocationSubStep } from './substeps/LocationSubStep';
// import { PricingSubStep } from './substeps/PricingSubStep';
// import { RouteConfirmSubStep } from './substeps/RouteConfirmSubStep';

export default function RouteStep() {
  const { updateFormData, nextStep } = useServiceCreation();
  const {
    state,
    goToSubStep,
    nextSubStep,
    previousSubStep,
    setCliente,
    isSubStepComplete,
    canNavigateToSubStep,
  } = useRouteSubSteps();

  // Handle client selection
  const handleClientSelect = useCallback((cliente: string, clienteId: string, isNewClient: boolean) => {
    setCliente(cliente, clienteId, isNewClient);
    updateFormData({ cliente, clienteId });
  }, [setCliente, updateFormData]);

  // Handle final route confirmation
  const handleRouteComplete = useCallback(() => {
    if (state.pricingResult) {
      updateFormData({
        cliente: state.cliente,
        clienteId: state.clienteId,
        origen: state.origen,
        destino: state.destino,
        precioCotizado: state.pricingResult.precio_sugerido,
        routeData: {
          ...state.pricingResult,
          cliente_nombre: state.cliente,
          origen_texto: state.origen,
          destino_texto: state.destino,
        },
      });
      nextStep();
    }
  }, [state, updateFormData, nextStep]);

  // Render current substep
  const renderSubStep = () => {
    switch (state.currentSubStep) {
      case 'client':
        return (
          <ClientSearchSubStep
            selectedCliente={state.cliente}
            isNewClient={state.isNewClient}
            onClientSelect={handleClientSelect}
            onContinue={nextSubStep}
          />
        );
      case 'location':
        // Placeholder for LocationSubStep - will be implemented in Prompt 2
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">Sub-paso 2: Origen y Destino</p>
                <p className="text-sm mt-2">Cliente seleccionado: {state.cliente}</p>
                <p className="text-xs mt-4">Implementación en progreso...</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'pricing':
        // Placeholder for PricingSubStep - will be implemented in Prompt 3
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">Sub-paso 3: Pricing</p>
                <p className="text-sm mt-2">Implementación en progreso...</p>
              </div>
            </CardContent>
          </Card>
        );
      case 'confirm':
        // Placeholder for RouteConfirmSubStep - will be implemented in Prompt 3
        return (
          <Card>
            <CardContent className="p-6">
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">Sub-paso 4: Confirmación</p>
                <p className="text-sm mt-2">Implementación en progreso...</p>
              </div>
            </CardContent>
          </Card>
        );
      default:
        return null;
    }
  };

  // Navigation button visibility
  const showBackButton = state.currentSubStep !== 'client';
  const showNextButton = state.currentSubStep !== 'confirm' && isSubStepComplete(state.currentSubStep);
  const showConfirmButton = state.currentSubStep === 'confirm' && state.pricingResult;

  return (
    <div className="space-y-6">
      {/* Sub-step indicator */}
      <RouteSubStepIndicator
        currentSubStep={state.currentSubStep}
        isSubStepComplete={isSubStepComplete}
        canNavigateToSubStep={canNavigateToSubStep}
        onSubStepClick={goToSubStep}
      />

      {/* Current substep content */}
      <div className="min-h-[300px]">
        {renderSubStep()}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center pt-4 border-t">
        <div>
          {showBackButton && (
            <Button
              type="button"
              variant="ghost"
              onClick={previousSubStep}
              className="gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Anterior
            </Button>
          )}
        </div>

        <div className="flex gap-2">
          {showNextButton && (
            <Button
              type="button"
              onClick={nextSubStep}
              className="gap-2"
            >
              Continuar
              <ChevronRight className="w-4 h-4" />
            </Button>
          )}

          {showConfirmButton && (
            <Button
              type="button"
              onClick={handleRouteComplete}
              className="gap-2"
              disabled={state.isCreatingRoute}
            >
              {state.isCreatingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Guardando...
                </>
              ) : (
                <>
                  Continuar a Servicio
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
