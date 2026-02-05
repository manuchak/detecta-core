 /**
  * Vista resumen del checklist con conteo de items y alertas
  */
 import { FileText, Car, Camera, AlertTriangle, Check } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import type { ItemsInspeccion, FotoValidada } from '@/types/checklist';
 
 interface ChecklistSummaryProps {
   items: ItemsInspeccion;
   fotos: FotoValidada[];
   firma: string | null;
   className?: string;
 }
 
 export function ChecklistSummary({
   items,
   fotos,
   firma,
   className,
 }: ChecklistSummaryProps) {
   // Contar items de vehículo
   const vehiculoItems = Object.entries(items.vehiculo).filter(
     ([key]) => key !== 'nivel_combustible'
   );
   const vehiculoChecked = vehiculoItems.filter(([_, v]) => v === true).length;
   const vehiculoTotal = vehiculoItems.length;
 
   // Contar fotos
   const fotosTotal = 4;
   const fotosTomadas = fotos.length;
   const fotosConAlertas = fotos.filter(
     (f) => f.validacion === 'sin_gps' || f.validacion === 'fuera_rango'
   ).length;
 
   const summaryItems = [
     {
       icon: Car,
       label: 'Inspección Vehículo',
       value: `${vehiculoChecked}/${vehiculoTotal} OK`,
       status:
         vehiculoChecked === vehiculoTotal
           ? 'complete'
           : vehiculoChecked > 0
             ? 'partial'
             : 'pending',
     },
     {
       icon: Camera,
       label: 'Fotos',
       value:
         fotosConAlertas > 0
           ? `${fotosTomadas}/${fotosTotal} (${fotosConAlertas} alertas)`
           : `${fotosTomadas}/${fotosTotal}`,
       status:
         fotosTomadas === fotosTotal
           ? fotosConAlertas > 0
             ? 'warning'
             : 'complete'
           : fotosTomadas > 0
             ? 'partial'
             : 'pending',
     },
     {
       icon: FileText,
       label: 'Firma',
       value: firma ? 'Completada' : 'Pendiente',
       status: firma ? 'complete' : 'pending',
     },
   ];
 
   return (
     <div className={cn('space-y-3', className)}>
       <h3 className="font-semibold text-foreground">📋 Resumen</h3>
 
       <div className="space-y-2">
         {summaryItems.map((item) => {
           const Icon = item.icon;
           return (
             <div
               key={item.label}
               className={cn(
                 'flex items-center justify-between p-3 rounded-xl',
                 item.status === 'complete' &&
                   'bg-green-50 dark:bg-green-900/20',
                 item.status === 'warning' &&
                   'bg-amber-50 dark:bg-amber-900/20',
                 item.status === 'partial' && 'bg-blue-50 dark:bg-blue-900/20',
                 item.status === 'pending' && 'bg-muted/50'
               )}
             >
               <div className="flex items-center gap-3">
                 <Icon
                   className={cn(
                     'w-5 h-5',
                     item.status === 'complete' &&
                       'text-green-600 dark:text-green-400',
                     item.status === 'warning' &&
                       'text-amber-600 dark:text-amber-400',
                     item.status === 'partial' &&
                       'text-blue-600 dark:text-blue-400',
                     item.status === 'pending' && 'text-muted-foreground'
                   )}
                 />
                 <span className="font-medium text-foreground">{item.label}</span>
               </div>
 
               <div className="flex items-center gap-2">
                 <span
                   className={cn(
                     'text-sm',
                     item.status === 'complete' &&
                       'text-green-700 dark:text-green-400',
                     item.status === 'warning' &&
                       'text-amber-700 dark:text-amber-400',
                     item.status === 'partial' &&
                       'text-blue-700 dark:text-blue-400',
                     item.status === 'pending' && 'text-muted-foreground'
                   )}
                 >
                   {item.value}
                 </span>
                 {item.status === 'complete' && (
                   <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
                 )}
                 {item.status === 'warning' && (
                   <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                 )}
               </div>
             </div>
           );
         })}
       </div>
 
       {fotosConAlertas > 0 && (
         <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
           <div className="flex items-start gap-2">
             <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 mt-0.5" />
             <div className="text-sm">
               <p className="font-medium text-amber-800 dark:text-amber-300">
                 Advertencias registradas
               </p>
               <p className="text-amber-700 dark:text-amber-400 mt-1">
                 {fotosConAlertas} foto(s) serán revisadas por el equipo de
                 monitoreo. Esto no impide completar el checklist.
               </p>
             </div>
           </div>
         </div>
       )}
     </div>
   );
 }