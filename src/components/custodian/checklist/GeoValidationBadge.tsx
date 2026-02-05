 /**
  * Badge que muestra el estado de validación GPS de una foto
  */
 import { MapPin, AlertTriangle, Check, HelpCircle } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { ValidacionGeo } from '@/types/checklist';
 import { formatearDistancia } from '@/lib/geoUtils';
 
 interface GeoValidationBadgeProps {
   validacion: ValidacionGeo;
   distancia: number | null;
   className?: string;
 }
 
 export function GeoValidationBadge({
   validacion,
   distancia,
   className,
 }: GeoValidationBadgeProps) {
   const configs = {
     ok: {
       icon: Check,
       bg: 'bg-green-100 dark:bg-green-900/30',
       text: 'text-green-700 dark:text-green-400',
       label: formatearDistancia(distancia),
     },
     sin_gps: {
       icon: HelpCircle,
       bg: 'bg-amber-100 dark:bg-amber-900/30',
       text: 'text-amber-700 dark:text-amber-400',
       label: 'Sin GPS',
     },
     fuera_rango: {
       icon: AlertTriangle,
       bg: 'bg-red-100 dark:bg-red-900/30',
       text: 'text-red-700 dark:text-red-400',
       label: formatearDistancia(distancia),
     },
     pendiente: {
       icon: MapPin,
       bg: 'bg-muted',
       text: 'text-muted-foreground',
       label: 'Pendiente',
     },
   };
 
   const config = configs[validacion];
   const Icon = config.icon;
 
   return (
     <div
       className={cn(
         'flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium',
         config.bg,
         config.text,
         className
       )}
     >
       <Icon className="w-3 h-3" />
       <span>{config.label}</span>
     </div>
   );
 }