import { ClipboardCheck, ArrowLeft, Check, MapPin, Calendar, Clock, User, Shield, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useServiceCreation } from '../../hooks/useServiceCreation';

/**
 * ConfirmationStep - Final step in service creation
 * Shows a summary of all data and allows final confirmation
 * 
 * TODO (Phase 6): 
 * - Implement actual service creation
 * - Add inline editing capability
 * - Connect to servicios_planificados table
 */
export default function ConfirmationStep() {
  const navigate = useNavigate();
  const { formData, previousStep, goToStep } = useServiceCreation();
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleCreateService = async () => {
    if (!confirmed) {
      toast.error('Debes confirmar la información antes de crear el servicio');
      return;
    }

    setIsSubmitting(true);
    
    // TODO: Implement actual service creation
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success('Servicio creado exitosamente');
    navigate('/planeacion');
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
            <span className="font-medium">{formData.requiereArmado ? 'Sí' : 'No'}</span>
          </div>
        </SummarySection>

        {/* Custodian */}
        <SummarySection title="Custodio" icon={User} stepId="custodian">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Asignado:</span>
            <span className="font-medium">{formData.custodio || '—'}</span>
          </div>
        </SummarySection>

        {/* Armed (if required) */}
        {(formData.requiereArmado || formData.armado) && (
          <SummarySection title="Elemento Armado" icon={Shield} stepId="armed">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Asignado:</span>
              <span className="font-medium">{formData.armado || '—'}</span>
            </div>
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
          disabled={!confirmed || isSubmitting}
        >
          {isSubmitting ? (
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
