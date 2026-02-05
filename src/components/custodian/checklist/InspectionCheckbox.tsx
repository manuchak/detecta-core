 /**
  * Checkbox grande y táctil para items de inspección del vehículo
  */
 import { Check } from 'lucide-react';
 import { cn } from '@/lib/utils';
 
 interface InspectionCheckboxProps {
   icon: string;
   label: string;
   checked: boolean | null;
   onChange: (checked: boolean) => void;
   className?: string;
 }
 
 export function InspectionCheckbox({
   icon,
   label,
   checked,
   onChange,
   className,
 }: InspectionCheckboxProps) {
   return (
     <button
       type="button"
       onClick={() => onChange(!checked)}
       className={cn(
         'flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border-2 transition-all touch-manipulation active:scale-95',
         checked === true
           ? 'border-primary bg-primary/10 text-primary'
           : checked === false
             ? 'border-destructive bg-destructive/10 text-destructive'
             : 'border-muted bg-muted/50 text-muted-foreground',
         className
       )}
     >
       <span className="text-3xl">{icon}</span>
       <span className="text-sm font-medium">{label}</span>
 
       <div
         className={cn(
           'w-8 h-8 rounded-lg flex items-center justify-center transition-colors',
           checked === true
             ? 'bg-primary text-primary-foreground'
             : checked === false
               ? 'bg-destructive text-destructive-foreground'
               : 'bg-muted text-muted-foreground'
         )}
       >
         {checked !== null && <Check className="w-5 h-5" />}
       </div>
     </button>
   );
 }