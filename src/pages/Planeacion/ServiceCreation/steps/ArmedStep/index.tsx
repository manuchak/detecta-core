import { Shield, ArrowLeft, ArrowRight, Search, MapPin, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceCreation } from '../../hooks/useServiceCreation';

/**
 * ArmedStep - Fourth step in service creation (optional)
 * Handles armed guard assignment when required
 * 
 * TODO (Phase 5): Extract into modular components:
 * - InternalGuardsList.tsx
 * - ExternalProvidersList.tsx
 * - MeetingPointSelector.tsx
 * - Reuse existing: ExpandableArmedCard, ExternalArmedVerificationModal
 */
export default function ArmedStep() {
  const { formData, updateFormData, nextStep, previousStep, markStepCompleted } = useServiceCreation();

  const handleContinue = () => {
    markStepCompleted('armed');
    nextStep();
  };

  const handleSkip = () => {
    nextStep();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          Asignar Elemento Armado
        </h2>
        <p className="text-muted-foreground">
          Selecciona el guardia armado y punto de encuentro
        </p>
      </div>

      {/* Skip option */}
      {!formData.requiereArmado && (
        <div className="p-4 rounded-lg bg-muted/50 border border-dashed">
          <p className="text-sm text-muted-foreground mb-2">
            Este paso es opcional. Puedes continuar sin asignar elemento armado.
          </p>
          <Button variant="outline" size="sm" onClick={handleSkip}>
            Omitir este paso
          </Button>
        </div>
      )}

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="armadoSearch">Buscar Elemento Armado</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="armadoSearch"
            placeholder="Buscar por nombre o proveedor..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Armed guards list placeholder */}
      <div className="space-y-3">
        <Label>Elementos Disponibles</Label>
        
        <div className="grid gap-3">
          {['Interno', 'Proveedor A', 'Proveedor B'].map((source, i) => (
            <button
              key={i}
              className={`w-full p-4 rounded-lg border text-left transition-all hover:border-primary ${
                formData.armado === `Armado ${i + 1}` 
                  ? 'border-primary bg-primary/5' 
                  : 'bg-card'
              }`}
              onClick={() => updateFormData({ 
                armado: `Armado ${i + 1}`,
                armadoId: `armado-${i + 1}`
              })}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Shield className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Armado {i + 1}</div>
                  <div className="text-sm text-muted-foreground">{source}</div>
                </div>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  Disponible
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Meeting point */}
      {formData.armado && (
        <div className="space-y-4 p-4 rounded-lg bg-muted/30 border">
          <h4 className="font-medium">Punto de Encuentro</h4>
          
          <div className="space-y-2">
            <Label htmlFor="puntoEncuentro" className="flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Ubicación
            </Label>
            <Input
              id="puntoEncuentro"
              placeholder="Dirección del punto de encuentro"
              value={formData.puntoEncuentro || ''}
              onChange={(e) => updateFormData({ puntoEncuentro: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="horaEncuentro" className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Hora de Encuentro
            </Label>
            <Input
              id="horaEncuentro"
              type="time"
              value={formData.horaEncuentro || ''}
              onChange={(e) => updateFormData({ horaEncuentro: e.target.value })}
            />
          </div>
        </div>
      )}

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
          disabled={formData.requiereArmado && !formData.armado}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
