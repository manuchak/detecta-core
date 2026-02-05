 /**
  * Paso 4: Confirmación y firma
  * Resumen del checklist, observaciones opcionales y firma digital
  */
 import { useState } from 'react';
 import { CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Textarea } from '@/components/ui/textarea';
 import { Label } from '@/components/ui/label';
 import { ChecklistSummary } from './ChecklistSummary';
 import { SignaturePad } from './SignaturePad';
 import { ItemsInspeccion, FotoValidada } from '@/types/checklist';
 
 interface StepConfirmationProps {
   items: ItemsInspeccion;
   fotos: FotoValidada[];
   observaciones: string;
   firma: string | null;
   isSaving: boolean;
   onSetObservaciones: (value: string) => void;
   onSetFirma: (value: string | null) => void;
   onBack: () => void;
   onSubmit: () => void;
 }
 
 export function StepConfirmation({
   items,
   fotos,
   observaciones,
   firma,
   isSaving,
   onSetObservaciones,
   onSetFirma,
   onBack,
   onSubmit
 }: StepConfirmationProps) {
   const canSubmit = !!firma && !isSaving;
 
   // Count warnings for summary
   const photosWithWarnings = fotos.filter(
     f => f.validacion === 'fuera_rango' || f.validacion === 'sin_gps'
   );
 
   return (
     <div className="space-y-6">
       <div className="text-center">
         <h2 className="text-xl font-semibold">Confirmación</h2>
         <p className="text-muted-foreground mt-1">
           Revisa y firma tu checklist
         </p>
       </div>
 
       {/* Summary */}
       <ChecklistSummary items={items} fotos={fotos} firma={firma} />
 
       {/* Observations */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base">
             📝 Observaciones (opcional)
           </CardTitle>
         </CardHeader>
         <CardContent>
           <Textarea
             placeholder="Escribe cualquier observación sobre el estado del vehículo..."
             value={observaciones}
             onChange={(e) => onSetObservaciones(e.target.value)}
             rows={3}
             className="resize-none"
           />
         </CardContent>
       </Card>
 
       {/* Signature */}
       <Card>
         <CardHeader className="pb-3">
           <CardTitle className="text-base flex items-center gap-2">
             ✍️ Firma Digital
             {!firma && (
               <span className="text-xs font-normal text-destructive">
                 (Requerida)
               </span>
             )}
           </CardTitle>
         </CardHeader>
         <CardContent>
           <SignaturePad
             value={firma}
             onChange={onSetFirma}
           />
         </CardContent>
       </Card>
 
       {/* Warning about auditable items */}
       {photosWithWarnings.length > 0 && (
         <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-start gap-3">
           <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
           <div className="text-sm">
             <p className="font-medium text-amber-800 dark:text-amber-400">
               Nota de auditoría
             </p>
             <p className="text-amber-700 dark:text-amber-500 mt-1">
               {photosWithWarnings.length} foto(s) con advertencias serán revisadas por el equipo de Monitoreo.
             </p>
           </div>
         </div>
       )}
 
       {/* Navigation buttons */}
       <div className="flex gap-3">
         <Button
           variant="outline"
           className="flex-1"
           onClick={onBack}
           disabled={isSaving}
         >
           Anterior
         </Button>
         <Button
           className="flex-1"
           disabled={!canSubmit}
           onClick={onSubmit}
         >
           {isSaving ? (
             <>
               <Loader2 className="h-4 w-4 animate-spin mr-2" />
               Guardando...
             </>
           ) : (
             <>
               <CheckCircle2 className="h-4 w-4 mr-2" />
               Confirmar Checklist
             </>
           )}
         </Button>
       </div>
     </div>
   );
 }