import { Check, User, MapPin, DollarSign, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { RouteSubStep } from './hooks/useRouteSubSteps';

interface SubStepConfig {
  id: RouteSubStep;
  label: string;
  icon: React.ElementType;
}

const SUB_STEPS: SubStepConfig[] = [
  { id: 'client', label: 'Cliente', icon: User },
  { id: 'location', label: 'Origen/Destino', icon: MapPin },
  { id: 'pricing', label: 'Pricing', icon: DollarSign },
  { id: 'confirm', label: 'Confirmar', icon: CheckCircle },
];

interface RouteSubStepIndicatorProps {
  currentSubStep: RouteSubStep;
  isSubStepComplete: (step: RouteSubStep) => boolean;
  canNavigateToSubStep: (step: RouteSubStep) => boolean;
  onSubStepClick: (step: RouteSubStep) => void;
}

export function RouteSubStepIndicator({
  currentSubStep,
  isSubStepComplete,
  canNavigateToSubStep,
  onSubStepClick,
}: RouteSubStepIndicatorProps) {
  const currentIndex = SUB_STEPS.findIndex(s => s.id === currentSubStep);

  return (
    <div className="w-full mb-6">
      <div className="flex items-center justify-between">
        {SUB_STEPS.map((step, index) => {
          const isComplete = isSubStepComplete(step.id);
          const isCurrent = step.id === currentSubStep;
          const canNavigate = canNavigateToSubStep(step.id);
          const isPast = index < currentIndex;
          const Icon = step.icon;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <button
                type="button"
                onClick={() => canNavigate && onSubStepClick(step.id)}
                disabled={!canNavigate}
                className={cn(
                  "flex flex-col items-center gap-1.5 transition-all duration-200",
                  canNavigate && !isCurrent && "cursor-pointer hover:scale-105",
                  !canNavigate && "cursor-not-allowed opacity-50"
                )}
              >
                <div
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                    isCurrent && "bg-primary text-primary-foreground ring-4 ring-primary/20",
                    isComplete && !isCurrent && "bg-green-500 text-white",
                    !isComplete && !isCurrent && "bg-muted text-muted-foreground"
                  )}
                >
                  {isComplete && !isCurrent ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <Icon className="w-5 h-5" />
                  )}
                </div>
                <span
                  className={cn(
                    "text-xs font-medium transition-colors",
                    isCurrent && "text-primary",
                    isComplete && !isCurrent && "text-green-600",
                    !isComplete && !isCurrent && "text-muted-foreground"
                  )}
                >
                  {step.label}
                </span>
              </button>

              {/* Connector line */}
              {index < SUB_STEPS.length - 1 && (
                <div className="flex-1 h-0.5 mx-2">
                  <div
                    className={cn(
                      "h-full transition-all duration-500",
                      isPast || isComplete
                        ? "bg-green-500"
                        : isCurrent
                        ? "bg-gradient-to-r from-primary to-muted"
                        : "bg-muted"
                    )}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
