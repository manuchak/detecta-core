 /**
  * Badge que muestra el estado de conexión del dispositivo
  */
 import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { useNetworkStatus } from '@/hooks/useNetworkStatus';
 
 interface OfflineIndicatorProps {
   className?: string;
   showLabel?: boolean;
 }
 
 export function OfflineIndicator({
   className,
   showLabel = true,
 }: OfflineIndicatorProps) {
   const { isOnline } = useNetworkStatus();
 
   return (
     <div
       className={cn(
         'flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium transition-colors',
         isOnline
           ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
           : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
         className
       )}
     >
       {isOnline ? (
         <>
           <Cloud className="w-3.5 h-3.5" />
           {showLabel && <span>Conectado</span>}
         </>
       ) : (
         <>
           <CloudOff className="w-3.5 h-3.5" />
           {showLabel && <span>Sin conexión</span>}
         </>
       )}
     </div>
   );
 }