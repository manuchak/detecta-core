/**
 * ServiceStep - Second step in service creation workflow
 * Modular architecture with timezone-safe date handling
 * Includes prefetch of custodians for faster next step
 */

import { useEffect, useState } from 'react';
import { Settings, ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useServiceStepLogic } from './hooks/useServiceStepLogic';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { buildCDMXTimestamp } from '@/utils/cdmxTimezone';
import { supabase } from '@/integrations/supabase/client';

// Components
import { RouteSummary } from './components/RouteSummary';
import { ServiceIdSection } from './components/ServiceIdSection';
import { ClientIdSection } from './components/ClientIdSection';
import { AppointmentSection } from './components/AppointmentSection';
import { ServiceTypeSection } from './components/ServiceTypeSection';
import { GadgetSection } from './components/GadgetSection';
import { ObservationsSection } from './components/ObservationsSection';
import { ReturnServiceToggle } from './components/ReturnServiceToggle';

export default function ServiceStep() {
  const { formData, nextStep, previousStep, markStepCompleted, clearDraft } = useServiceCreation();
  const navigate = useNavigate();
  const { createServicioPlanificado, isCreating } = useServiciosPlanificados();
  const [isSavingPending, setIsSavingPending] = useState(false);
  
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
    esServicioRetorno,
    setEsServicioRetorno,
    
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

  const handleSaveAsPending = async () => {
    // Validate minimum required fields
    if (!servicioId || !formData.cliente || !formData.origen || 
        !formData.destino || !fecha || !hora) {
      toast.error('Completa los campos requeridos', {
        description: 'ID, cliente, ruta, fecha y hora son obligatorios'
      });
      return;
    }

    setIsSavingPending(true);
    
    try {
      const fechaHoraCita = buildCDMXTimestamp(fecha, hora);
      
      const gadgetsCantidades = Object.entries(gadgets || {})
        .filter(([_, cantidad]) => cantidad > 0)
        .map(([tipo, cantidad]) => ({ tipo, cantidad }));
      
      const servicePayload = {
        id_servicio: servicioId,
        id_interno_cliente: idInterno || undefined,
        nombre_cliente: formData.cliente,
        origen: formData.origen,
        destino: formData.destino,
        fecha_hora_cita: fechaHoraCita,
        tipo_servicio: tipoServicio || 'custodia',
        requiere_armado: requiereArmado || false,
        tarifa_acordada: formData.precioCotizado || undefined,
        observaciones: esServicioRetorno 
          ? `[RETORNO] ${observaciones || ''}`.trim() 
          : (observaciones || undefined),
        gadgets_cantidades: gadgetsCantidades.length > 0 ? gadgetsCantidades : undefined,
        estado_planeacion: 'pendiente_asignacion',
        // Without custodio or armado assigned
      };
      
      createServicioPlanificado(servicePayload, {
        onSuccess: () => {
          clearDraft();
          toast.success('Servicio guardado como pendiente', {
            description: `${servicioId} - Asigna custodio cuando estés listo`
          });
          navigate('/planeacion');
        },
        onError: (error: any) => {
          toast.error('Error al guardar servicio', {
            description: error.message || 'Intenta de nuevo'
          });
          setIsSavingPending(false);
        }
      });
    } catch (error: any) {
      toast.error('Error al preparar datos');
      setIsSavingPending(false);
    }
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

        {/* Return service toggle - shows bypass hint when time validation would fail */}
        <ReturnServiceToggle
          checked={esServicioRetorno}
          onCheckedChange={setEsServicioRetorno}
          showValidationBypass={isToday && !isDateTimeValid && !esServicioRetorno}
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
      <div className="flex flex-col gap-3 pt-4 border-t">
        {/* Primary row: Previous + Continue */}
        <div className="flex justify-between gap-3">
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
        
        {/* Secondary option: Save as Pending */}
        {canContinue && (
          <div className="flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSaveAsPending}
              disabled={isSavingPending || isCreating}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              {isSavingPending || isCreating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Guardando...
                </>
              ) : (
                <>
                  <Clock className="h-4 w-4" />
                  Guardar como Pendiente (sin asignar)
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
