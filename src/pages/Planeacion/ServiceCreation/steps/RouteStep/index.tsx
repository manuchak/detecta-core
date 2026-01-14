import { MapPin, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceCreation } from '../../hooks/useServiceCreation';

/**
 * RouteStep - First step in service creation
 * Handles client search, origin/destination selection, and pricing lookup
 * 
 * TODO (Phase 2): Extract into modular components:
 * - ClientSearchInput.tsx
 * - SmartOriginSelect.tsx
 * - SmartDestinationSelect.tsx
 * - PricingResultCard.tsx
 * - DeliveryRouteBuilder.tsx
 */
export default function RouteStep() {
  const { formData, updateFormData, nextStep, markStepCompleted } = useServiceCreation();

  const handleContinue = () => {
    // TODO: Add validation
    markStepCompleted('route');
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <MapPin className="h-6 w-6 text-primary" />
          Configurar Ruta
        </h2>
        <p className="text-muted-foreground">
          Busca el cliente y selecciona la ruta del servicio
        </p>
      </div>

      {/* Form */}
      <div className="space-y-6">
        {/* Client Search */}
        <div className="space-y-2">
          <Label htmlFor="cliente">Cliente</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="cliente"
              placeholder="Buscar cliente por nombre..."
              className="pl-10"
              value={formData.cliente || ''}
              onChange={(e) => updateFormData({ cliente: e.target.value })}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Ingresa al menos 3 caracteres para buscar
          </p>
        </div>

        {/* Origin */}
        <div className="space-y-2">
          <Label htmlFor="origen">Origen</Label>
          <Input
            id="origen"
            placeholder="Selecciona el punto de origen"
            value={formData.origen || ''}
            onChange={(e) => updateFormData({ origen: e.target.value })}
          />
        </div>

        {/* Destination */}
        <div className="space-y-2">
          <Label htmlFor="destino">Destino</Label>
          <Input
            id="destino"
            placeholder="Selecciona el destino"
            value={formData.destino || ''}
            onChange={(e) => updateFormData({ destino: e.target.value })}
          />
        </div>

        {/* Price display placeholder */}
        {formData.origen && formData.destino && (
          <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Precio cotizado:</span>
              <span className="text-lg font-semibold text-green-600 dark:text-green-400">
                ${formData.precioCotizado?.toLocaleString() || '---'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Button
          onClick={handleContinue}
          className="gap-2"
          disabled={!formData.cliente || !formData.origen || !formData.destino}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
