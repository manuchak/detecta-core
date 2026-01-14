import { Check, Circle, AlertCircle, MapPin, Settings, User, Shield, ClipboardCheck, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useServiceCreation, type StepId } from './hooks/useServiceCreation';

interface StepConfig {
  id: StepId;
  label: string;
  icon: React.ElementType;
  optional?: boolean;
}

const STEPS: StepConfig[] = [
  { id: 'route', label: 'Ruta', icon: MapPin },
  { id: 'service', label: 'Servicio', icon: Settings },
  { id: 'custodian', label: 'Custodio', icon: User },
  { id: 'armed', label: 'Armado', icon: Shield, optional: true },
  { id: 'confirmation', label: 'Confirmar', icon: ClipboardCheck },
];

export default function ServiceCreationSidebar() {
  const { 
    currentStep, 
    goToStep, 
    completedSteps, 
    formData, 
    saveDraft,
    hasUnsavedChanges 
  } = useServiceCreation();

  const getStepStatus = (stepId: StepId): 'completed' | 'current' | 'pending' | 'error' => {
    if (completedSteps.includes(stepId)) return 'completed';
    if (currentStep === stepId) return 'current';
    return 'pending';
  };

  const canNavigateTo = (stepId: StepId): boolean => {
    const stepIndex = STEPS.findIndex(s => s.id === stepId);
    const currentIndex = STEPS.findIndex(s => s.id === currentStep);
    
    // Can always go back to completed steps
    if (completedSteps.includes(stepId)) return true;
    
    // Can go to next step only if current is completed
    if (stepIndex === currentIndex + 1 && completedSteps.includes(currentStep)) return true;
    
    // Current step is always accessible
    if (stepId === currentStep) return true;
    
    return false;
  };

  const handleStepClick = (stepId: StepId) => {
    if (canNavigateTo(stepId)) {
      goToStep(stepId);
    }
  };

  return (
    <div className="apple-card p-4 space-y-4">
      <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wide">
        Progreso
      </h3>

      {/* Steps list */}
      <nav className="space-y-1">
        {STEPS.map((step, index) => {
          const status = getStepStatus(step.id);
          const isNavigable = canNavigateTo(step.id);
          const Icon = step.icon;

          return (
            <button
              key={step.id}
              onClick={() => handleStepClick(step.id)}
              disabled={!isNavigable}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-all",
                "focus:outline-none focus:ring-2 focus:ring-primary/20",
                status === 'current' && "bg-primary/10 text-primary",
                status === 'completed' && isNavigable && "hover:bg-muted cursor-pointer",
                status === 'pending' && !isNavigable && "opacity-50 cursor-not-allowed",
                status === 'pending' && isNavigable && "hover:bg-muted cursor-pointer"
              )}
            >
              {/* Step indicator */}
              <div className={cn(
                "flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center",
                "border-2 transition-colors",
                status === 'completed' && "bg-green-500 border-green-500 text-white",
                status === 'current' && "border-primary bg-primary/10 text-primary",
                status === 'pending' && "border-muted-foreground/30 text-muted-foreground/50",
                status === 'error' && "border-destructive bg-destructive/10 text-destructive"
              )}>
                {status === 'completed' ? (
                  <Check className="h-4 w-4" />
                ) : status === 'error' ? (
                  <AlertCircle className="h-4 w-4" />
                ) : (
                  <Icon className="h-4 w-4" />
                )}
              </div>

              {/* Step label */}
              <div className="flex-1 min-w-0">
                <span className={cn(
                  "block text-sm font-medium truncate",
                  status === 'pending' && "text-muted-foreground"
                )}>
                  {step.label}
                </span>
                {step.optional && (
                  <span className="text-xs text-muted-foreground">Opcional</span>
                )}
              </div>

              {/* Connecting line */}
              {index < STEPS.length - 1 && (
                <div className={cn(
                  "absolute left-[1.75rem] top-[2.75rem] w-0.5 h-4",
                  status === 'completed' ? "bg-green-500" : "bg-muted-foreground/20"
                )} />
              )}
            </button>
          );
        })}
      </nav>

      {/* Divider */}
      <div className="border-t pt-4">
        <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wide mb-3">
          Resumen
        </h4>
        
        <div className="space-y-2 text-sm">
          {formData.cliente ? (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Cliente:</span>
              <span className="font-medium truncate max-w-[140px]">{formData.cliente}</span>
            </div>
          ) : (
            <div className="text-muted-foreground italic">Sin cliente seleccionado</div>
          )}
          
          {formData.origen && formData.destino && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ruta:</span>
              <span className="font-medium truncate max-w-[140px]">
                {formData.origen} → {formData.destino}
              </span>
            </div>
          )}
          
          {formData.fecha && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Fecha:</span>
              <span className="font-medium">{formData.fecha}</span>
            </div>
          )}
          
          {formData.custodio && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Custodio:</span>
              <span className="font-medium truncate max-w-[140px]">{formData.custodio}</span>
            </div>
          )}
        </div>
      </div>

      {/* Save draft button */}
      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2"
        onClick={saveDraft}
        disabled={!hasUnsavedChanges}
      >
        <Save className="h-4 w-4" />
        Guardar Borrador
      </Button>
    </div>
  );
}
