import { User, ArrowLeft, ArrowRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useServiceCreation } from '../../hooks/useServiceCreation';

/**
 * CustodianStep - Third step in service creation
 * Handles custodian search and assignment
 * 
 * TODO (Phase 4): Extract into modular components:
 * - CustodianList.tsx (with availability categories)
 * - ConflictSection.tsx
 * - Reuse existing: CustodioPerformanceCard, CustodianContactDialog, ConflictOverrideModal
 */
export default function CustodianStep() {
  const { formData, updateFormData, nextStep, previousStep, markStepCompleted } = useServiceCreation();

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
          Selecciona el custodio disponible para este servicio
        </p>
      </div>

      {/* Search */}
      <div className="space-y-2">
        <Label htmlFor="custodioSearch">Buscar Custodio</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            id="custodioSearch"
            placeholder="Buscar por nombre, zona o especialidad..."
            className="pl-10"
          />
        </div>
      </div>

      {/* Custodian list placeholder */}
      <div className="space-y-3">
        <Label>Custodios Disponibles</Label>
        
        {/* Placeholder cards */}
        <div className="grid gap-3">
          {['disponible', 'disponible', 'ocupado'].map((status, i) => (
            <button
              key={i}
              className={`w-full p-4 rounded-lg border text-left transition-all hover:border-primary ${
                formData.custodio === `Custodio ${i + 1}` 
                  ? 'border-primary bg-primary/5' 
                  : 'bg-card'
              }`}
              onClick={() => updateFormData({ 
                custodio: `Custodio ${i + 1}`,
                custodioId: `custodio-${i + 1}`
              })}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <div className="font-medium">Custodio {i + 1}</div>
                  <div className="text-sm text-muted-foreground">Zona CDMX Norte</div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  status === 'disponible' 
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                    : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                }`}>
                  {status === 'disponible' ? 'Disponible' : 'Ocupado parcial'}
                </span>
              </div>
            </button>
          ))}
        </div>

        <p className="text-xs text-muted-foreground text-center">
          Esta es una vista placeholder. Los datos reales vendrán de la base de datos.
        </p>
      </div>

      {/* Selected custodian display */}
      {formData.custodio && (
        <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Custodio seleccionado:</span>
            <span className="font-medium">{formData.custodio}</span>
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
          disabled={!formData.custodio}
        >
          Continuar
          <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
