 /**
  * Paso 3: Captura de fotos del vehículo
  * 4 fotos obligatorias desde diferentes ángulos con validación GPS
  */
 import { AlertTriangle } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { PhotoSlot } from './PhotoSlot';
 import { SecureCameraCapture } from './SecureCameraCapture';
 import { FotoValidada, AnguloFoto, ANGULO_LABELS } from '@/types/checklist';
 
 interface StepVehiclePhotosProps {
   fotos: FotoValidada[];
   onCapturePhoto: (angle: AnguloFoto, file: File) => Promise<FotoValidada>;
   onRemovePhoto: (angle: AnguloFoto) => void;
   onBack: () => void;
   onComplete: () => void;
 }
 
 const REQUIRED_ANGLES: AnguloFoto[] = ['frontal', 'trasero', 'lateral_izq', 'lateral_der'];
 
 export function StepVehiclePhotos({
   fotos,
   onCapturePhoto,
   onRemovePhoto,
   onBack,
   onComplete
 }: StepVehiclePhotosProps) {
   const getFotoForAngle = (angle: AnguloFoto) => {
     return fotos.find(f => f.angle === angle);
   };
 
   const completedPhotos = REQUIRED_ANGLES.filter(angle => getFotoForAngle(angle)).length;
   const canProceed = completedPhotos === 4;
 
   // Get photos with warnings (for audit notice)
   const photosWithWarnings = fotos.filter(
     f => f.validacion === 'fuera_rango' || f.validacion === 'sin_gps'
   );
 
   return (
     <div className="space-y-6">
       <div className="text-center">
         <h2 className="text-xl font-semibold">Fotos del Vehículo</h2>
         <p className="text-muted-foreground mt-1">
           Toma una foto desde cada ángulo ({completedPhotos}/4)
         </p>
       </div>
 
       {/* Photo grid */}
       <div className="grid grid-cols-2 gap-4">
         {REQUIRED_ANGLES.map((angle) => {
           const foto = getFotoForAngle(angle);
           return (
             <PhotoSlot
               key={angle}
               angle={angle}
               label={ANGULO_LABELS[angle]}
               foto={foto}
               onCapture={onCapturePhoto}
               onRemove={() => onRemovePhoto(angle)}
             />
           );
         })}
       </div>
 
       {/* Warnings notice (non-blocking) */}
       {photosWithWarnings.length > 0 && (
         <Card className="border-amber-500/50 bg-amber-500/5">
           <CardContent className="py-4">
             <div className="flex items-start gap-3">
               <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
               <div className="space-y-1">
                 <p className="text-sm font-medium text-amber-800 dark:text-amber-400">
                   Advertencias registradas
                 </p>
                 <ul className="text-xs text-amber-700 dark:text-amber-500 space-y-1">
                   {photosWithWarnings.map((foto) => (
                     <li key={foto.angle}>
                       • Foto "{ANGULO_LABELS[foto.angle]}":{' '}
                       {foto.validacion === 'sin_gps'
                         ? 'sin datos GPS'
                         : `${foto.distancia_origen_m}m del origen`}
                     </li>
                   ))}
                 </ul>
                 <p className="text-xs text-muted-foreground mt-2">
                   Estas advertencias NO te impiden continuar, pero serán revisadas por Monitoreo.
                 </p>
               </div>
             </div>
           </CardContent>
         </Card>
       )}
 
       {/* Navigation buttons */}
       <div className="flex gap-3">
         <Button
           variant="outline"
           className="flex-1"
           onClick={onBack}
         >
           Anterior
         </Button>
         <Button
           className="flex-1"
           disabled={!canProceed}
           onClick={onComplete}
         >
           Continuar
         </Button>
       </div>
     </div>
   );
 }