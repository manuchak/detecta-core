 /**
  * Selector visual de nivel de combustible
  */
 import { Fuel } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { NivelCombustible } from '@/types/checklist';
 import { NIVELES_COMBUSTIBLE } from '@/types/checklist';
 
 interface FuelGaugeProps {
   value: NivelCombustible | null;
   onChange: (value: NivelCombustible) => void;
   className?: string;
 }
 
 export function FuelGauge({ value, onChange, className }: FuelGaugeProps) {
   return (
     <div className={cn('space-y-3', className)}>
       <div className="flex items-center gap-2 text-foreground">
         <Fuel className="w-5 h-5" />
         <span className="font-medium">Nivel de Combustible</span>
       </div>
 
       <div className="flex items-center gap-1">
         {NIVELES_COMBUSTIBLE.map((nivel, index) => {
           const isSelected = value === nivel.value;
           const selectedIndex = NIVELES_COMBUSTIBLE.findIndex(
             (n) => n.value === value
           );
           const isFilled = value !== null && index <= selectedIndex;
 
           return (
             <button
               key={nivel.value}
               type="button"
               onClick={() => onChange(nivel.value)}
               className={cn(
                 'flex-1 py-3 rounded-lg text-xs font-medium transition-all touch-manipulation active:scale-95',
                 isFilled
                   ? index === 0
                     ? 'bg-primary text-primary-foreground'
                     : index <= 1
                       ? 'bg-primary/80 text-primary-foreground'
                       : index <= 2
                         ? 'bg-amber-500 text-white'
                         : 'bg-destructive text-destructive-foreground'
                   : 'bg-muted text-muted-foreground',
                 isSelected && 'ring-2 ring-primary ring-offset-2'
               )}
             >
               {nivel.label}
             </button>
           );
         })}
       </div>
 
       {value && (
         <p className="text-sm text-muted-foreground text-center">
           {value === 'lleno' && '🟢 Tanque lleno'}
           {value === '3/4' && '🟢 Buen nivel'}
           {value === '1/2' && '🟡 Nivel medio'}
           {value === '1/4' && '🟠 Nivel bajo'}
           {value === 'vacio' && '🔴 Requiere carga'}
         </p>
       )}
     </div>
   );
 }