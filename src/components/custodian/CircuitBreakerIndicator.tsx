 /**
  * Indicador visual del estado del Circuit Breaker
  * Muestra cuando las sincronizaciones están bloqueadas por errores
  */
 import { AlertTriangle, RefreshCw, CheckCircle, XCircle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 import type { CircuitBreakerInfo } from '@/hooks/useOfflineSync';
 
 interface CircuitBreakerIndicatorProps {
   info: CircuitBreakerInfo;
   onReset: () => void;
   className?: string;
 }
 
 export function CircuitBreakerIndicator({
   info,
   onReset,
   className,
 }: CircuitBreakerIndicatorProps) {
   // No mostrar si todo está bien
   if (!info.isOpen && info.consecutiveFailures === 0) {
     return null;
   }
 
   const isWarning = info.consecutiveFailures > 0 && !info.isOpen;
   const isBlocked = info.isOpen;
 
   return (
     <div
       className={cn(
         'rounded-xl p-4 border',
         isBlocked && 'bg-destructive/10 border-destructive/30',
        isWarning && 'bg-amber-500/10 border-amber-500/30 dark:bg-amber-900/20',
         className
       )}
     >
       <div className="flex items-start gap-3">
         {isBlocked ? (
           <XCircle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
         ) : (
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
         )}
         
         <div className="flex-1 min-w-0">
           <h4 className={cn(
             'font-semibold text-sm',
            isBlocked ? 'text-destructive' : 'text-amber-700 dark:text-amber-500'
           )}>
             {isBlocked ? 'Sincronización Pausada' : 'Errores de Sincronización'}
           </h4>
           
           <p className="text-xs text-muted-foreground mt-1">
             {isBlocked ? (
               <>
                 Demasiados errores consecutivos. 
                 {info.cooldownRemaining > 0 && (
                   <span className="font-medium"> Reinicio automático en {info.cooldownRemaining}s</span>
                 )}
               </>
             ) : (
               <>
                 {info.consecutiveFailures} error{info.consecutiveFailures !== 1 ? 'es' : ''} consecutivo{info.consecutiveFailures !== 1 ? 's' : ''}
                 {info.failureRate > 0 && ` • Tasa: ${info.failureRate.toFixed(0)}%`}
               </>
             )}
           </p>
 
           {isBlocked && (
             <Button
               variant="outline"
               size="sm"
               onClick={onReset}
               className="mt-3 h-8 text-xs gap-1.5"
             >
               <RefreshCw className="w-3.5 h-3.5" />
               Reintentar Ahora
             </Button>
           )}
         </div>
       </div>
     </div>
   );
 }