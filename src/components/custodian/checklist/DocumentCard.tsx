 /**
  * Card que muestra un documento del custodio con su estado de vigencia
  */
 import { useState, useRef } from 'react';
 import { Card } from '@/components/ui/card';
 import { Button } from '@/components/ui/button';
 import { Camera, FileText, Calendar, Upload } from 'lucide-react';
 import { cn } from '@/lib/utils';
 import { format } from 'date-fns';
 import { es } from 'date-fns/locale';
 import { DocumentExpiryBadge } from './DocumentExpiryBadge';
 import type { DocumentoCustodio, TipoDocumentoCustodio } from '@/types/checklist';
 import { DOCUMENTO_LABELS } from '@/types/checklist';
 
 interface DocumentCardProps {
   documento?: DocumentoCustodio;
   tipoDocumento: TipoDocumentoCustodio;
   onUpdate: (file: File, fechaVigencia: string) => void;
   isUpdating?: boolean;
   className?: string;
 }
 
 export function DocumentCard({
   documento,
   tipoDocumento,
   onUpdate,
   isUpdating,
   className,
 }: DocumentCardProps) {
   const [showUpdate, setShowUpdate] = useState(false);
   const [newFechaVigencia, setNewFechaVigencia] = useState('');
   const fileInputRef = useRef<HTMLInputElement>(null);
 
   const isExpired = documento
     ? new Date(documento.fecha_vigencia) < new Date()
     : false;
 
   const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0];
     if (file && newFechaVigencia) {
       onUpdate(file, newFechaVigencia);
       setShowUpdate(false);
       setNewFechaVigencia('');
     }
   };
 
   return (
     <Card
       className={cn(
         'p-4 transition-all',
         isExpired && 'border-red-200 bg-red-50/50 dark:border-red-900 dark:bg-red-900/10',
         className
       )}
     >
       <div className="flex items-start justify-between gap-3">
         <div className="flex items-start gap-3 flex-1">
           <div
             className={cn(
               'w-10 h-10 rounded-lg flex items-center justify-center',
               isExpired
                 ? 'bg-red-100 text-red-600 dark:bg-red-900/30'
                 : 'bg-primary/10 text-primary'
             )}
           >
             <FileText className="w-5 h-5" />
           </div>
 
           <div className="flex-1 min-w-0">
             <h4 className="font-medium text-foreground">
               {DOCUMENTO_LABELS[tipoDocumento]}
             </h4>
 
             {documento ? (
               <div className="mt-1 space-y-1">
                 <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                   <Calendar className="w-3.5 h-3.5" />
                   <span>
                     Vigente hasta:{' '}
                     {format(new Date(documento.fecha_vigencia), "d 'de' MMMM yyyy", {
                       locale: es,
                     })}
                   </span>
                 </div>
                 <DocumentExpiryBadge fechaVigencia={documento.fecha_vigencia} />
               </div>
             ) : (
               <p className="text-sm text-muted-foreground mt-1">
                 No registrado
               </p>
             )}
           </div>
         </div>
 
         {(isExpired || !documento) && !showUpdate && (
           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowUpdate(true)}
             className="shrink-0"
           >
             <Upload className="w-4 h-4 mr-1" />
             Actualizar
           </Button>
         )}
       </div>
 
       {/* Update form */}
       {showUpdate && (
         <div className="mt-4 pt-4 border-t space-y-3">
           <div>
             <label className="text-sm font-medium text-foreground">
               Nueva fecha de vigencia
             </label>
             <input
               type="date"
               value={newFechaVigencia}
               onChange={(e) => setNewFechaVigencia(e.target.value)}
               min={new Date().toISOString().split('T')[0]}
               className="mt-1 w-full px-3 py-2 rounded-lg border bg-background text-foreground"
             />
           </div>
 
           <input
             ref={fileInputRef}
             type="file"
             accept="image/*"
             capture="environment"
             onChange={handleFileSelect}
             className="hidden"
           />
 
           <div className="flex gap-2">
             <Button
               onClick={() => fileInputRef.current?.click()}
               disabled={!newFechaVigencia || isUpdating}
               className="flex-1"
             >
               <Camera className="w-4 h-4 mr-2" />
               {isUpdating ? 'Subiendo...' : 'Tomar foto'}
             </Button>
             <Button
               variant="outline"
               onClick={() => {
                 setShowUpdate(false);
                 setNewFechaVigencia('');
               }}
             >
               Cancelar
             </Button>
           </div>
         </div>
       )}
     </Card>
   );
 }