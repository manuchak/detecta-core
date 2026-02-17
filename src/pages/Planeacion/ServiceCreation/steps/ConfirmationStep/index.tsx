import { ClipboardCheck, ArrowLeft, Check, MapPin, Calendar, Clock, User, Shield, Edit2, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useServiceCreation } from '../../hooks/useServiceCreation';
import { useServiciosPlanificados } from '@/hooks/useServiciosPlanificados';
import { buildCDMXTimestamp } from '@/utils/cdmxTimezone';
import { supabase } from '@/integrations/supabase/client';

/**
 * ConfirmationStep - Final step in service creation
 * Shows a summary of all data and creates the service in the database
 * Supports multi-armado: inserts N records in asignacion_armados
 */
export default function ConfirmationStep() {
  const navigate = useNavigate();
  const { formData, previousStep, goToStep, clearDraft } = useServiceCreation();
  const { createServicioPlanificado, isCreating } = useServiciosPlanificados();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const armados = formData.armados || [];
  const cantidadRequeridos = formData.cantidadArmadosRequeridos || 1;

  const handleCreateService = async () => {
    if (!confirmed) {
      toast.error('Debes confirmar la información antes de crear el servicio');
      return;
    }

    if (!formData.servicioId || !formData.cliente || !formData.origen || 
        !formData.destino || !formData.fecha || !formData.hora) {
      toast.error('Faltan campos requeridos para crear el servicio', {
        description: 'ID, cliente, origen, destino, fecha y hora son obligatorios'
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const fechaHoraCita = buildCDMXTimestamp(formData.fecha, formData.hora);
      
      const gadgetsCantidades = Object.entries(formData.gadgets || {})
        .filter(([_, cantidad]) => cantidad > 0)
        .map(([tipo, cantidad]) => ({ tipo, cantidad }));
      
      // First armado for legacy scalar fields
      const firstArmado = armados[0];
      
      const servicePayload = {
        id_servicio: formData.servicioId,
        id_interno_cliente: formData.idInterno || undefined,
        nombre_cliente: formData.cliente,
        origen: formData.origen,
        destino: formData.destino,
        fecha_hora_cita: fechaHoraCita,
        tipo_servicio: formData.tipoServicio || 'custodia',
        custodio_asignado: formData.custodio || undefined,
        custodio_id: formData.custodioId || undefined,
        requiere_armado: formData.requiereArmado || false,
        cantidad_armados_requeridos: cantidadRequeridos,
        // Legacy scalar compat: first armado
        armado_asignado: firstArmado?.nombre || undefined,
        armado_id: firstArmado?.id || undefined,
        tipo_asignacion_armado: firstArmado?.tipo || undefined,
        proveedor_armado_id: firstArmado?.proveedorId || undefined,
        punto_encuentro: firstArmado?.puntoEncuentro || undefined,
        hora_encuentro: firstArmado?.horaEncuentro || undefined,
        tarifa_acordada: formData.precioCotizado || undefined,
        observaciones: formData.observaciones || undefined,
        gadgets_cantidades: gadgetsCantidades.length > 0 ? gadgetsCantidades : undefined,
        estado_planeacion: 'planificado'
      };
      
      createServicioPlanificado(servicePayload, {
        onSuccess: async () => {
          // Insert all armados into asignacion_armados (relational table)
          if (armados.length > 0 && formData.servicioId) {
            try {
              const asignaciones = armados.map(armado => ({
                servicio_custodia_id: formData.servicioId,
                armado_id: armado.tipo === 'interno' ? armado.id : null,
                personal_proveedor_id: armado.tipo === 'proveedor' ? armado.id : null,
                proveedor_armado_id: armado.proveedorId || null,
                tipo_asignacion: armado.tipo,
                punto_encuentro: armado.puntoEncuentro || null,
                hora_encuentro: armado.horaEncuentro || null,
                estado_asignacion: 'pendiente',
                custodio_id: formData.custodioId || null,
              }));
              
              const { error: asignError } = await supabase
                .from('asignacion_armados')
                .insert(asignaciones);
              
              if (asignError) {
                console.error('Error inserting armado assignments:', asignError);
                // Non-blocking: service was created, just log the error
              }
            } catch (err) {
              console.error('Error creating armado assignments:', err);
            }
          }

          clearDraft();
          toast.success('Servicio creado exitosamente', {
            description: `ID: ${formData.servicioId}`
          });
          navigate('/planeacion');
        },
        onError: (error: any) => {
          console.error('Error creating service:', error);
          toast.error('Error al crear el servicio', {
            description: error.message || 'Intenta de nuevo'
          });
          setIsSubmitting(false);
        }
      });
      
    } catch (error: any) {
      console.error('Error preparing service data:', error);
      toast.error('Error al preparar los datos del servicio', {
        description: error.message || 'Revisa la información e intenta de nuevo'
      });
      setIsSubmitting(false);
    }
  };

  const getGadgetsDisplay = () => {
    if (!formData.gadgets) return null;
    const activeGadgets = Object.entries(formData.gadgets)
      .filter(([_, qty]) => qty > 0)
      .map(([tipo, qty]) => `${qty}x ${tipo.replace(/_/g, ' ')}`);
    return activeGadgets.length > 0 ? activeGadgets.join(', ') : null;
  };

  const SummarySection = ({ 
    title, 
    icon: Icon, 
    stepId,
    children 
  }: { 
    title: string; 
    icon: React.ElementType;
    stepId: 'route' | 'service' | 'custodian' | 'armed';
    children: React.ReactNode;
  }) => (
    <div className="p-4 rounded-lg bg-muted/30 border space-y-2">
      <div className="flex items-center justify-between">
        <h4 className="font-medium flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </h4>
        <Button
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          onClick={() => goToStep(stepId)}
        >
          <Edit2 className="h-3 w-3 mr-1" />
          Editar
        </Button>
      </div>
      <div className="text-sm space-y-1">
        {children}
      </div>
    </div>
  );

  const gadgetsDisplay = getGadgetsDisplay();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <ClipboardCheck className="h-6 w-6 text-primary" />
          Confirmar Servicio
        </h2>
        <p className="text-muted-foreground">
          Revisa la información y confirma para crear el servicio
        </p>
      </div>

      {/* Summary sections */}
      <div className="space-y-4">
        {/* Route */}
        <SummarySection title="Ruta" icon={MapPin} stepId="route">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Cliente:</span>
            <span className="font-medium">{formData.cliente || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Origen:</span>
            <span className="font-medium">{formData.origen || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Destino:</span>
            <span className="font-medium">{formData.destino || '—'}</span>
          </div>
          {formData.precioCotizado && (
            <div className="flex justify-between pt-1 border-t">
              <span className="text-muted-foreground">Precio:</span>
              <span className="font-medium text-green-600">
                ${formData.precioCotizado.toLocaleString()}
              </span>
            </div>
          )}
        </SummarySection>

        {/* Service */}
        <SummarySection title="Servicio" icon={Calendar} stepId="service">
          <div className="flex justify-between">
            <span className="text-muted-foreground">ID Servicio:</span>
            <span className="font-medium font-mono text-xs">{formData.servicioId || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Fecha:</span>
            <span className="font-medium">{formData.fecha || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Hora:</span>
            <span className="font-medium">{formData.hora || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Tipo:</span>
            <span className="font-medium">{formData.tipoServicio || '—'}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Armado requerido:</span>
            <span className="font-medium">
              {formData.requiereArmado 
                ? cantidadRequeridos > 1 ? `Sí (${cantidadRequeridos})` : 'Sí' 
                : 'No'}
            </span>
          </div>
          {gadgetsDisplay && (
            <div className="flex justify-between pt-1 border-t">
              <span className="text-muted-foreground flex items-center gap-1">
                <Package className="h-3 w-3" />
                Gadgets:
              </span>
              <span className="font-medium text-xs">{gadgetsDisplay}</span>
            </div>
          )}
        </SummarySection>

        {/* Custodian */}
        <SummarySection title="Custodio" icon={User} stepId="custodian">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asignado:</span>
            <span className="font-medium">{formData.custodio || '—'}</span>
          </div>
        </SummarySection>

        {/* Armed (if required) - multi-armado support */}
        {(formData.requiereArmado || armados.length > 0) && (
          <SummarySection 
            title={armados.length > 1 ? `Elementos Armados (${armados.length})` : 'Elemento Armado'} 
            icon={Shield} 
            stepId="armed"
          >
            {armados.length > 0 ? (
              armados.map((armado, idx) => (
                <div key={armado.id} className={cn("space-y-1", idx > 0 && "pt-2 mt-2 border-t border-border/50")}>
                  {armados.length > 1 && (
                    <p className="text-xs font-semibold text-muted-foreground">Armado {idx + 1}</p>
                  )}
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Asignado:</span>
                    <span className="font-medium">{armado.nombre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium capitalize">{armado.tipo}</span>
                  </div>
                  {armado.puntoEncuentro && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Punto encuentro:</span>
                      <span className="font-medium">{armado.puntoEncuentro}</span>
                    </div>
                  )}
                  {armado.horaEncuentro && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Hora encuentro:</span>
                      <span className="font-medium">{armado.horaEncuentro}</span>
                    </div>
                  )}
                </div>
              ))
            ) : (
              // Fallback to legacy scalar fields
              <>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Asignado:</span>
                  <span className="font-medium">{formData.armado || '—'}</span>
                </div>
                {formData.tipoAsignacionArmado && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Tipo:</span>
                    <span className="font-medium capitalize">{formData.tipoAsignacionArmado}</span>
                  </div>
                )}
                {formData.puntoEncuentro && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Punto encuentro:</span>
                    <span className="font-medium">{formData.puntoEncuentro}</span>
                  </div>
                )}
                {formData.horaEncuentro && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hora encuentro:</span>
                    <span className="font-medium">{formData.horaEncuentro}</span>
                  </div>
                )}
              </>
            )}
          </SummarySection>
        )}
      </div>

      {/* Confirmation checkbox */}
      <div className="flex items-start space-x-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
        <Checkbox
          id="confirm"
          checked={confirmed}
          onCheckedChange={(checked) => setConfirmed(checked === true)}
        />
        <div className="space-y-1 leading-none">
          <Label htmlFor="confirm" className="text-sm font-medium cursor-pointer">
            Confirmo que la información es correcta
          </Label>
          <p className="text-xs text-muted-foreground">
            Al crear el servicio, se notificará al custodio y se agregará al calendario de operaciones.
          </p>
        </div>
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
          onClick={handleCreateService}
          className="gap-2"
          disabled={!confirmed || isSubmitting || isCreating}
        >
          {(isSubmitting || isCreating) ? (
            <>
              <span className="animate-spin">⏳</span>
              Creando...
            </>
          ) : (
            <>
              <Check className="h-4 w-4" />
              Crear Servicio
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
