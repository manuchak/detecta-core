 /**
  * Barra de progreso visual para el wizard de checklist
  */
 import { Check } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface Step {
   id: number;
   label: string;
 }
 
 interface ChecklistProgressBarProps {
   steps: Step[];
   currentStep: number;
   className?: string;
 }
 
 export function ChecklistProgressBar({
   steps,
   currentStep,
   className,
 }: ChecklistProgressBarProps) {
   return (
     <div className={cn('w-full', className)}>
       {/* Progress bar */}
       <div className="flex items-center justify-between mb-2">
         {steps.map((step, index) => (
           <div key={step.id} className="flex items-center flex-1">
             {/* Step circle */}
             <div
               className={cn(
                 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all',
                 currentStep > step.id
                   ? 'bg-primary text-primary-foreground'
                   : currentStep === step.id
                     ? 'bg-primary text-primary-foreground ring-4 ring-primary/20'
                     : 'bg-muted text-muted-foreground'
               )}
             >
               {currentStep > step.id ? (
                 <Check className="w-4 h-4" />
               ) : (
                 step.id
               )}
             </div>
 
             {/* Connector line */}
             {index < steps.length - 1 && (
               <div
                 className={cn(
                   'flex-1 h-1 mx-2 rounded-full transition-colors',
                   currentStep > step.id ? 'bg-primary' : 'bg-muted'
                 )}
               />
             )}
           </div>
         ))}
       </div>
 
       {/* Step labels - mobile friendly */}
       <div className="flex justify-between">
         {steps.map((step) => (
           <span
             key={step.id}
             className={cn(
               'text-xs text-center flex-1 px-1',
               currentStep === step.id
                 ? 'text-primary font-medium'
                 : 'text-muted-foreground'
             )}
           >
             {step.label}
           </span>
         ))}
       </div>
     </div>
   );
 }