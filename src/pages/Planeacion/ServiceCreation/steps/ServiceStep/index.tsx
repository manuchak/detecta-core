import { Settings, ArrowLeft, ArrowRight, Calendar, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useServiceCreation } from '../../hooks/useServiceCreation';

/**
 * ServiceStep - Second step in service creation
 * Handles service details: ID, date/time, type, gadgets
 * 
 * TODO (Phase 3): Extract into modular components:
 * - ServiceIdInput.tsx
 * - ServiceTypeSelector.tsx
 * - DateTimeSection.tsx
 * - GadgetSelector (reuse existing)
 */
export default function ServiceStep() {
  const { formData, updateFormData, nextStep, previousStep, markStepCompleted } = useServiceCreation();

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
          Configura la fecha, hora y características del servicio
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Service ID */}
        <div className="space-y-2">
          <Label htmlFor="servicioId">ID del Servicio</Label>
          <Input
            id="servicioId"
            placeholder="Se generará automáticamente..."
            value={formData.servicioId || ''}
            onChange={(e) => updateFormData({ servicioId: e.target.value })}
          />
          <p className="text-xs text-muted-foreground">
            Identificador único del servicio (auto-generado si se deja vacío)
          </p>
        </div>

        {/* Date and Time */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="fecha" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Fecha
            </Label>
            <Input
              id="fecha"
              type="date"
              value={formData.fecha || ''}
              onChange={(e) => updateFormData({ fecha: e.target.value })}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="hora" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora
            </Label>
            <Input
              id="hora"
              type="time"
              value={formData.hora || ''}
              onChange={(e) => updateFormData({ hora: e.target.value })}
            />
          </div>
        </div>

        {/* Service Type */}
        <div className="space-y-2">
          <Label htmlFor="tipoServicio">Tipo de Servicio</Label>
          <Input
            id="tipoServicio"
            placeholder="Ej: Traslado de valores"
            value={formData.tipoServicio || ''}
            onChange={(e) => updateFormData({ tipoServicio: e.target.value })}
          />
        </div>

        {/* Armed guard toggle */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="space-y-0.5">
            <Label htmlFor="requiereArmado" className="text-base">¿Requiere elemento armado?</Label>
            <p className="text-sm text-muted-foreground">
              Habilita la asignación de un guardia armado para este servicio
            </p>
          </div>
          <Switch
            id="requiereArmado"
            checked={formData.requiereArmado || false}
            onCheckedChange={(checked) => updateFormData({ requiereArmado: checked })}
          />
        </div>

        {/* Gadgets placeholder */}
        <div className="space-y-2">
          <Label>Gadgets / Equipo</Label>
          <div className="p-4 rounded-lg border border-dashed text-center text-muted-foreground">
            Selector de gadgets (próximamente)
          </div>
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
          onClick={handleContinue}
          className="gap-2"
          disabled={!formData.fecha || !formData.hora}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
