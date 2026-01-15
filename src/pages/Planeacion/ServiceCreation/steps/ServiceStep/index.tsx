/**
 * ServiceStep - Second step in service creation workflow
 * Modular architecture with timezone-safe date handling
 * Includes prefetch of custodians for faster next step
 */

import { useEffect, useMemo } from 'react';
import { Settings, ArrowLeft, ArrowRight } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useServiceStepLogic } from './hooks/useServiceStepLogic';
import { supabase } from '@/integrations/supabase/client';

// Components
import { RouteSummary } from './components/RouteSummary';
import { ServiceIdSection } from './components/ServiceIdSection';
import { ClientIdSection } from './components/ClientIdSection';
import { AppointmentSection } from './components/AppointmentSection';
import { ServiceTypeSection } from './components/ServiceTypeSection';
import { GadgetSection } from './components/GadgetSection';
import { ObservationsSection } from './components/ObservationsSection';

export default function ServiceStep() {
  const { formData, nextStep, previousStep, markStepCompleted } = useServiceCreation();
  
  const {
    // State
    servicioId,
    idInterno,
    fecha,
    hora,
    tipoServicio,
    requiereArmado,
    gadgets,
    observaciones,
    
    // Setters
    setServicioId,
    setIdInterno,
    setFecha,
    setHora,
    setObservaciones,
    handleTipoServicioChange,
    handleRequiereArmadoChange,
    handleGadgetChange,
    
    // Validation
    validation,
    isDateValid,
    isDateTimeValid,
    dateTimeErrorMessage,
    minDate,
    isToday,
    canContinue,
    
    // Formatted displays
    formattedRecepcion,
    formattedFecha,
    totalGadgets,
    
    // Auto-fill indicators
    wasHoraOptimized,
    wasAutoFilled,
    distanciaKm,
    
    // Constants
    SERVICE_TYPE_OPTIONS,
  } = useServiceStepLogic();

  const queryClient = useQueryClient();

  // Prefetch custodians when service step has valid date/time
  // This speeds up the next step by loading data in background
  useEffect(() => {
    if (canContinue && fecha && hora && formData.origen) {
      const stableKey = [
        fecha,
        hora,
        formData.origen || formData.cliente || '',
        formData.destino || '',
        tipoServicio || 'custodia',
        requiereArmado || false,
      ];
      
      // Prefetch custodians data
      queryClient.prefetchQuery({
        queryKey: ['custodios-con-proximidad-equitativo', ...stableKey],
        queryFn: async () => {
          console.log('🔄 Prefetching custodians for next step...');
          const { data } = await supabase.rpc('get_custodios_activos_disponibles');
          return data;
        },
        staleTime: 5 * 60 * 1000, // 5 minutes
      });
    }
  }, [canContinue, fecha, hora, formData.origen, formData.destino, formData.cliente, tipoServicio, requiereArmado, queryClient]);

  const handleContinue = () => {
    markStepCompleted('service');
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Settings className="h-6 w-6 text-primary" />
          Detalles del Servicio
        </h2>
        <p className="text-muted-foreground">
          Configura la cita y características del servicio
        </p>
      </div>

      {/* Route summary */}
      <RouteSummary 
        pricingResult={formData.pricingResult} 
        clienteNombre={formData.cliente}
      />

      {/* Form sections */}
      <div className="space-y-6">
        {/* Service ID */}
        <ServiceIdSection
          servicioId={servicioId}
          onServicioIdChange={setServicioId}
          isValidating={validation.isValidating}
          isValid={validation.isValid}
          errorMessage={validation.errorMessage}
        />

        {/* Client internal ID */}
        <ClientIdSection
          idInterno={idInterno}
          onIdInternoChange={setIdInterno}
        />

        {/* Appointment scheduling */}
        <AppointmentSection
          formattedRecepcion={formattedRecepcion}
          fecha={fecha}
          hora={hora}
          onFechaChange={setFecha}
          onHoraChange={setHora}
          minDate={minDate}
          isDateTimeValid={isDateTimeValid}
          dateTimeErrorMessage={dateTimeErrorMessage}
          formattedFecha={formattedFecha}
          isToday={isToday}
          wasHoraOptimized={wasHoraOptimized}
          distanciaKm={distanciaKm}
        />

        {/* Service type */}
        <ServiceTypeSection
          tipoServicio={tipoServicio}
          requiereArmado={requiereArmado}
          onTipoServicioChange={handleTipoServicioChange}
          onRequiereArmadoChange={handleRequiereArmadoChange}
          options={SERVICE_TYPE_OPTIONS}
          wasAutoFilled={wasAutoFilled}
        />

        {/* Gadgets */}
        <GadgetSection
          gadgets={gadgets}
          onGadgetChange={handleGadgetChange}
          totalGadgets={totalGadgets}
        />

        {/* Observations */}
        <ObservationsSection
          observaciones={observaciones}
          onObservacionesChange={setObservaciones}
        />
      </div>

      {/* Footer */}
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
    </div>
  );
}
