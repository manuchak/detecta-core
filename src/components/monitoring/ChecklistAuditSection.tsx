 /**
  * Sección de auditoría de checklist para el equipo de monitoreo
  * Muestra galería de fotos, alertas GPS y estado de documentos
  */
 import { useState } from 'react';
 import { useQuery } from '@tanstack/react-query';
 import { 
   Camera, 
   MapPin, 
   AlertTriangle, 
   CheckCircle2, 
   Clock, 
   WifiOff,
   FileText,
   ChevronDown,
   ChevronUp,
   ExternalLink
 } from 'lucide-react';
 import { supabase } from '@/integrations/supabase/client';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Badge } from '@/components/ui/badge';
 import { Button } from '@/components/ui/button';
 import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
 import { cn } from '@/lib/utils';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { 
   ChecklistServicio, 
   FotoValidada, 
   ANGULO_LABELS, 
   INSPECCION_ITEMS,
   EQUIPAMIENTO_ITEMS
 } from '@/types/checklist';
 
 interface ChecklistAuditSectionProps {
   servicioId: string;
   custodioTelefono?: string;
 }
 
 export function ChecklistAuditSection({ 
   servicioId, 
   custodioTelefono 
 }: ChecklistAuditSectionProps) {
   const [isExpanded, setIsExpanded] = useState(true);
   const [selectedPhoto, setSelectedPhoto] = useState<FotoValidada | null>(null);
 
   const { data: checklist, isLoading } = useQuery({
     queryKey: ['checklist-audit', servicioId],
     queryFn: async () => {
       let query = supabase
         .from('checklist_servicio')
         .select('*')
         .eq('servicio_id', servicioId);
       
       if (custodioTelefono) {
         query = query.eq('custodio_telefono', custodioTelefono);
       }
       
       const { data, error } = await query.maybeSingle();
       if (error) throw error;
       return data as ChecklistServicio | null;
     },
     enabled: !!servicioId
   });
 
   if (isLoading) {
     return (
       <Card>
         <CardContent className="py-8">
           <div className="flex items-center justify-center">
             <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
           </div>
         </CardContent>
       </Card>
     );
   }
 
   if (!checklist) {
     return (
       <Card>
         <CardContent className="py-8">
           <div className="text-center text-muted-foreground">
             <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
             <p>No hay checklist para este servicio</p>
           </div>
         </CardContent>
       </Card>
     );
   }
 
   const fotos = (checklist.fotos_validadas || []) as FotoValidada[];
   const items = checklist.items_inspeccion;
   
   // Count alerts
   const geoAlerts = fotos.filter(
     f => f.validacion === 'fuera_rango' || f.validacion === 'sin_gps'
   );
   
   // Count failed inspection items
   const failedVehiculo = INSPECCION_ITEMS.filter(
     item => items?.vehiculo?.[item.key as keyof typeof items.vehiculo] === false
   );
   const failedEquipamiento = EQUIPAMIENTO_ITEMS.filter(
     item => items?.equipamiento?.[item.key as keyof typeof items.equipamiento] === false
   );
   const totalFailedItems = failedVehiculo.length + failedEquipamiento.length;
 
   return (
     <Card>
       <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
         <CollapsibleTrigger asChild>
           <CardHeader className="cursor-pointer hover:bg-muted/50 transition-colors">
             <div className="flex items-center justify-between">
               <CardTitle className="text-base flex items-center gap-2">
                 📋 Checklist Pre-Servicio
                 {checklist.estado === 'completo' ? (
                   <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 border-emerald-500/30">
                     Completado
                   </Badge>
                 ) : (
                   <Badge variant="outline" className="bg-amber-500/10 text-amber-700 border-amber-500/30">
                     {checklist.estado}
                   </Badge>
                 )}
               </CardTitle>
               {isExpanded ? (
                 <ChevronUp className="h-4 w-4 text-muted-foreground" />
               ) : (
                 <ChevronDown className="h-4 w-4 text-muted-foreground" />
               )}
             </div>
           </CardHeader>
         </CollapsibleTrigger>
 
         <CollapsibleContent>
           <CardContent className="space-y-6">
             {/* Quick stats */}
             <div className="grid grid-cols-3 gap-3">
               <div className="text-center p-3 rounded-lg bg-muted/50">
                 <Camera className="h-5 w-5 mx-auto mb-1 text-muted-foreground" />
                 <p className="text-lg font-semibold">{fotos.length}/4</p>
                 <p className="text-xs text-muted-foreground">Fotos</p>
               </div>
               <div className={cn(
                 "text-center p-3 rounded-lg",
                 geoAlerts.length > 0 ? "bg-amber-500/10" : "bg-muted/50"
               )}>
                 <MapPin className={cn(
                   "h-5 w-5 mx-auto mb-1",
                   geoAlerts.length > 0 ? "text-amber-600" : "text-muted-foreground"
                 )} />
                 <p className="text-lg font-semibold">{geoAlerts.length}</p>
                 <p className="text-xs text-muted-foreground">Alertas GPS</p>
               </div>
               <div className={cn(
                 "text-center p-3 rounded-lg",
                 totalFailedItems > 0 ? "bg-destructive/10" : "bg-muted/50"
               )}>
                 <AlertTriangle className={cn(
                   "h-5 w-5 mx-auto mb-1",
                   totalFailedItems > 0 ? "text-destructive" : "text-muted-foreground"
                 )} />
                 <p className="text-lg font-semibold">{totalFailedItems}</p>
                 <p className="text-xs text-muted-foreground">Items ❌</p>
               </div>
             </div>
 
             {/* Photo gallery */}
             {fotos.length > 0 && (
               <div className="space-y-2">
                 <h4 className="text-sm font-medium">Evidencia Fotográfica</h4>
                 <div className="grid grid-cols-4 gap-2">
                   {fotos.map((foto, idx) => (
                     <button
                       key={idx}
                       onClick={() => setSelectedPhoto(foto)}
                       className={cn(
                         "relative aspect-square rounded-lg overflow-hidden border-2 transition-all",
                         foto.validacion === 'ok' 
                           ? "border-emerald-500/50" 
                           : "border-amber-500/50",
                         "hover:ring-2 hover:ring-primary"
                       )}
                     >
                       {foto.url ? (
                         <img
                           src={foto.url}
                           alt={ANGULO_LABELS[foto.angle]}
                           className="w-full h-full object-cover"
                         />
                       ) : (
                         <div className="w-full h-full bg-muted flex items-center justify-center">
                           <Camera className="h-6 w-6 text-muted-foreground" />
                         </div>
                       )}
                       
                       {/* Validation badge */}
                       <div className={cn(
                         "absolute bottom-1 right-1 px-1.5 py-0.5 rounded text-[10px] font-medium",
                         foto.validacion === 'ok' 
                           ? "bg-emerald-500 text-white"
                           : foto.validacion === 'sin_gps'
                             ? "bg-gray-500 text-white"
                             : "bg-amber-500 text-white"
                       )}>
                         {foto.validacion === 'ok' 
                           ? `${foto.distancia_origen_m}m`
                           : foto.validacion === 'sin_gps'
                             ? 'Sin GPS'
                             : `${foto.distancia_origen_m}m ⚠️`}
                       </div>
                       
                       {/* Angle label */}
                       <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[10px] text-white">
                         {ANGULO_LABELS[foto.angle].substring(0, 3)}
                       </div>
                     </button>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Geo alerts detail */}
             {geoAlerts.length > 0 && (
               <div className="space-y-2">
                 <h4 className="text-sm font-medium flex items-center gap-2">
                   <AlertTriangle className="h-4 w-4 text-amber-600" />
                   Alertas de Geolocalización
                 </h4>
                 <div className="space-y-2">
                   {geoAlerts.map((foto, idx) => (
                     <div 
                       key={idx}
                       className="flex items-center justify-between p-2 rounded-lg bg-amber-500/5 border border-amber-500/20"
                     >
                       <div className="flex items-center gap-2">
                         <MapPin className="h-4 w-4 text-amber-600" />
                         <span className="text-sm">
                           {ANGULO_LABELS[foto.angle]}
                         </span>
                       </div>
                       <Badge variant="outline" className="text-amber-700 border-amber-500/30">
                         {foto.validacion === 'sin_gps' 
                           ? 'Sin GPS'
                           : `${foto.distancia_origen_m}m del origen`}
                       </Badge>
                     </div>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Failed inspection items */}
             {totalFailedItems > 0 && (
               <div className="space-y-2">
                 <h4 className="text-sm font-medium flex items-center gap-2">
                   <AlertTriangle className="h-4 w-4 text-destructive" />
                   Items con Problemas
                 </h4>
                 <div className="flex flex-wrap gap-2">
                   {failedVehiculo.map(item => (
                     <Badge key={item.key} variant="destructive" className="gap-1">
                       {item.icon} {item.label}
                     </Badge>
                   ))}
                   {failedEquipamiento.map(item => (
                     <Badge key={item.key} variant="destructive" className="gap-1">
                       {item.icon} {item.label}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Observations */}
             {checklist.observaciones && (
               <div className="space-y-2">
                 <h4 className="text-sm font-medium">Observaciones</h4>
                 <p className="text-sm text-muted-foreground p-3 bg-muted/50 rounded-lg">
                   {checklist.observaciones}
                 </p>
               </div>
             )}
 
             {/* Metadata */}
             <div className="flex flex-wrap gap-4 text-xs text-muted-foreground pt-2 border-t">
               <div className="flex items-center gap-1">
                 <Clock className="h-3 w-3" />
                 {checklist.fecha_checklist 
                   ? format(new Date(checklist.fecha_checklist), "d MMM yyyy, HH:mm", { locale: es })
                   : 'Sin fecha'}
               </div>
               {checklist.sincronizado_offline && (
                 <div className="flex items-center gap-1">
                   <WifiOff className="h-3 w-3" />
                   Sincronizado offline
                 </div>
               )}
               {checklist.firma_base64 && (
                 <div className="flex items-center gap-1">
                   <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                   Firmado
                 </div>
               )}
             </div>
           </CardContent>
         </CollapsibleContent>
       </Collapsible>
 
       {/* Photo detail modal */}
       {selectedPhoto && (
         <div 
           className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
           onClick={() => setSelectedPhoto(null)}
         >
           <div className="max-w-2xl w-full space-y-4" onClick={e => e.stopPropagation()}>
             {selectedPhoto.url && (
               <img
                 src={selectedPhoto.url}
                 alt={ANGULO_LABELS[selectedPhoto.angle]}
                 className="w-full rounded-lg"
               />
             )}
             <div className="bg-background rounded-lg p-4 space-y-2">
               <div className="flex items-center justify-between">
                 <h3 className="font-medium">{ANGULO_LABELS[selectedPhoto.angle]}</h3>
                 <Badge variant={selectedPhoto.validacion === 'ok' ? 'default' : 'secondary'}>
                   {selectedPhoto.validacion === 'ok'
                     ? `✓ ${selectedPhoto.distancia_origen_m}m`
                     : selectedPhoto.validacion === 'sin_gps'
                       ? 'Sin GPS'
                       : `⚠️ ${selectedPhoto.distancia_origen_m}m`}
                 </Badge>
               </div>
               {selectedPhoto.geotag_lat && selectedPhoto.geotag_lng && (
                 <p className="text-sm text-muted-foreground">
                   📍 {selectedPhoto.geotag_lat.toFixed(6)}, {selectedPhoto.geotag_lng.toFixed(6)}
                 </p>
               )}
               <p className="text-sm text-muted-foreground">
                 🕐 {format(new Date(selectedPhoto.captured_at), "d MMM yyyy, HH:mm:ss", { locale: es })}
               </p>
               <Button
                 variant="outline"
                 size="sm"
                 className="mt-2"
                 onClick={() => setSelectedPhoto(null)}
               >
                 Cerrar
               </Button>
             </div>
           </div>
         </div>
       )}
     </Card>
   );
 }