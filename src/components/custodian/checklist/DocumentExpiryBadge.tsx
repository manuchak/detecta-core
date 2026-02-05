 /**
  * Badge que muestra el estado de vigencia de un documento
  */
 import { cn } from '@/lib/utils';
 import { AlertTriangle, Check, Clock } from 'lucide-react';
 
 interface DocumentExpiryBadgeProps {
   fechaVigencia: string;
   className?: string;
 }
 
 export function DocumentExpiryBadge({
   fechaVigencia,
   className,
 }: DocumentExpiryBadgeProps) {
   const today = new Date();
   const vigencia = new Date(fechaVigencia);
   const diffDays = Math.ceil(
     (vigencia.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
   );
 
   // Vencido
   if (diffDays < 0) {
     return (
       <div
         className={cn(
           'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
           'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
           className
         )}
       >
         <AlertTriangle className="w-3.5 h-3.5" />
         <span>Vencido</span>
       </div>
     );
   }
 
   // Por vencer (30 días)
   if (diffDays <= 30) {
     return (
       <div
         className={cn(
           'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
           'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
           className
         )}
       >
         <Clock className="w-3.5 h-3.5" />
         <span>Vence en {diffDays} días</span>
       </div>
     );
   }
 
   // Vigente
   return (
     <div
       className={cn(
         'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium',
         'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
         className
       )}
     >
       <Check className="w-3.5 h-3.5" />
       <span>Vigente</span>
     </div>
   );
 }