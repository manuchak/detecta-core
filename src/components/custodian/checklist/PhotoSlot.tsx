 /**
  * Slot individual para captura de foto por ángulo
  */
 import { useState, useEffect } from 'react';
 import { Camera, X, RotateCcw } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { GeoValidationBadge } from './GeoValidationBadge';
 import type { AnguloFoto, FotoValidada } from '@/types/checklist';
 import { ANGULO_LABELS } from '@/types/checklist';
 import { getPhotoBlob } from '@/lib/offlineStorage';
 
 interface PhotoSlotProps {
   angle: AnguloFoto;
   foto?: FotoValidada;
   onCapture: (angle: AnguloFoto) => void;
   onRemove: (angle: AnguloFoto) => void;
   className?: string;
 }
 
 export function PhotoSlot({
   angle,
   foto,
   onCapture,
   onRemove,
   className,
 }: PhotoSlotProps) {
   const [previewUrl, setPreviewUrl] = useState<string | null>(null);
 
   // Cargar preview de foto local
   useEffect(() => {
     const loadPreview = async () => {
       if (foto?.localBlobId) {
         const photoBlob = await getPhotoBlob(foto.localBlobId);
         if (photoBlob) {
           const url = URL.createObjectURL(photoBlob.blob);
           setPreviewUrl(url);
           return () => URL.revokeObjectURL(url);
         }
       } else if (foto?.url) {
         setPreviewUrl(foto.url);
       } else {
         setPreviewUrl(null);
       }
     };
 
     loadPreview();
   }, [foto]);
 
   const hasPhoto = !!foto;
 
   return (
     <div className={cn('relative aspect-square', className)}>
       {hasPhoto ? (
         // Preview de foto tomada
         <div className="relative w-full h-full rounded-xl overflow-hidden border-2 border-primary">
           {previewUrl && (
             <img
               src={previewUrl}
               alt={ANGULO_LABELS[angle]}
               className="w-full h-full object-cover"
             />
           )}
 
           {/* Badge de validación GPS */}
           <div className="absolute top-2 left-2">
             <GeoValidationBadge
               validacion={foto.validacion}
               distancia={foto.distancia_origen_m}
             />
           </div>
 
           {/* Botones de acción */}
           <div className="absolute bottom-2 right-2 flex gap-1">
             <button
               type="button"
               onClick={() => onCapture(angle)}
               className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg active:scale-95"
             >
               <RotateCcw className="w-4 h-4" />
             </button>
             <button
               type="button"
               onClick={() => onRemove(angle)}
               className="w-8 h-8 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow-lg active:scale-95"
             >
               <X className="w-4 h-4" />
             </button>
           </div>
 
           {/* Label */}
           <div className="absolute bottom-2 left-2 px-2 py-1 rounded-md bg-black/60 text-white text-xs font-medium">
             {ANGULO_LABELS[angle]}
           </div>
         </div>
       ) : (
         // Slot vacío - botón para capturar
         <button
           type="button"
           onClick={() => onCapture(angle)}
           className="w-full h-full rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/30 flex flex-col items-center justify-center gap-2 text-muted-foreground hover:border-primary hover:text-primary transition-colors active:scale-95"
         >
           <Camera className="w-8 h-8" />
           <span className="text-sm font-medium">{ANGULO_LABELS[angle]}</span>
           <span className="text-xs">Tomar foto</span>
         </button>
       )}
     </div>
   );
 }