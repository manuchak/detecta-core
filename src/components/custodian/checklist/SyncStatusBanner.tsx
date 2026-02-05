 /**
  * Banner que muestra el estado de sincronización offline
  * Incluye indicador de Circuit Breaker cuando hay errores
  */
 import { RefreshCw, Check, AlertTriangle, Cloud } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { cn } from '@/lib/utils';
 import { useOfflineSync, type SyncStatus } from '@/hooks/useOfflineSync';
import { CircuitBreakerIndicator } from '../CircuitBreakerIndicator';
 
 interface SyncStatusBannerProps {
   className?: string;
 }
 
 export function SyncStatusBanner({ className }: SyncStatusBannerProps) {
  const { syncStatus, pendingCount, isOnline, syncAll, circuitBreakerInfo, resetCircuitBreaker } = useOfflineSync();
 
  // Mostrar circuit breaker si está activo
  if (circuitBreakerInfo.isOpen || circuitBreakerInfo.consecutiveFailures > 2) {
    return (
      <CircuitBreakerIndicator
        info={circuitBreakerInfo}
        onReset={() => {
          resetCircuitBreaker();
          syncAll();
        }}
        className={className}
      />
    );
  }

   if (pendingCount === 0 && syncStatus !== 'syncing') {
     return null;
   }
 
   const getStatusConfig = (): {
     icon: React.ReactNode;
     message: string;
     variant: 'info' | 'success' | 'warning';
   } => {
     if (syncStatus === 'syncing') {
       return {
         icon: <RefreshCw className="w-4 h-4 animate-spin" />,
         message: 'Sincronizando datos...',
         variant: 'info',
       };
     }
 
     if (syncStatus === 'success') {
       return {
         icon: <Check className="w-4 h-4" />,
         message: 'Datos sincronizados correctamente',
         variant: 'success',
       };
     }
 
     if (!isOnline && pendingCount > 0) {
       return {
         icon: <Cloud className="w-4 h-4" />,
         message: `${pendingCount} cambios guardados localmente`,
         variant: 'info',
       };
     }
 
     return {
       icon: <AlertTriangle className="w-4 h-4" />,
       message: `${pendingCount} cambios pendientes de sincronizar`,
       variant: 'warning',
     };
   };
 
   const config = getStatusConfig();
 
   return (
     <div
       className={cn(
         'flex items-center justify-between gap-3 px-4 py-3 rounded-xl',
         config.variant === 'info' &&
           'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400',
         config.variant === 'success' &&
           'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400',
         config.variant === 'warning' &&
           'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400',
         className
       )}
     >
       <div className="flex items-center gap-2">
         {config.icon}
         <span className="text-sm font-medium">{config.message}</span>
       </div>
 
       {isOnline && pendingCount > 0 && syncStatus !== 'syncing' && (
         <Button
           variant="ghost"
           size="sm"
           onClick={() => syncAll()}
           className="h-8 px-3"
         >
           <RefreshCw className="w-4 h-4 mr-1" />
           Sincronizar
         </Button>
       )}
     </div>
   );
 }