 /**
  * Paso 1: Verificación de documentos del custodio
  * Muestra documentos vigentes y permite actualizar los vencidos
  */
 import { useState } from 'react';
 import { FileText, Upload, AlertCircle, CheckCircle2 } from 'lucide-react';
 import { Button } from '@/components/ui/button';
 import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
 import { Input } from '@/components/ui/input';
 import { Label } from '@/components/ui/label';
 import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
 import { DocumentCard } from './DocumentCard';
 import { useCustodianDocuments } from '@/hooks/useCustodianDocuments';
 import { DOCUMENTO_LABELS, TipoDocumentoCustodio } from '@/types/checklist';
 
 interface StepDocumentsProps {
   custodioTelefono: string;
   onComplete: () => void;
 }
 
 const REQUIRED_DOCUMENTS: TipoDocumentoCustodio[] = [
   'licencia_conducir',
   'tarjeta_circulacion',
   'poliza_seguro'
 ];
 
export function StepDocuments({ custodioTelefono, onComplete }: StepDocumentsProps) {
  const { documents, isLoading, updateDocument, getExpiredDocuments } = useCustodianDocuments(custodioTelefono);
  const [uploadingDoc, setUploadingDoc] = useState<TipoDocumentoCustodio | null>(null);
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadDate, setUploadDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  // Verificar documentos faltantes (no existen)
  const missingDocs = REQUIRED_DOCUMENTS.filter(
    tipo => !documents.find(d => d.tipo_documento === tipo)
  );
  
  // Verificar documentos vencidos
  const expiredDocs = getExpiredDocuments();
  
  // Solo puede proceder si tiene todos los documentos Y ninguno vencido
  const canProceed = missingDocs.length === 0 && expiredDocs.length === 0;
 
  const handleUpload = async () => {
    console.log('[StepDocuments] Iniciando upload:', { 
      tipo: uploadingDoc, 
      hasFile: !!uploadFile, 
      fileName: uploadFile?.name,
      fileSize: uploadFile?.size,
      fecha: uploadDate 
    });

    if (!uploadingDoc || !uploadFile || !uploadDate) {
      console.warn('[StepDocuments] Faltan datos para upload:', {
        uploadingDoc,
        hasFile: !!uploadFile,
        uploadDate
      });
      return;
    }
    
    setIsUploading(true);
    try {
      console.log('[StepDocuments] Llamando updateDocument.mutateAsync...');
      await updateDocument.mutateAsync({
        tipoDocumento: uploadingDoc,
        file: uploadFile,
        fechaVigencia: uploadDate
      });
      console.log('[StepDocuments] Upload exitoso');
      setUploadingDoc(null);
      setUploadFile(null);
      setUploadDate('');
    } catch (error) {
      console.error('[StepDocuments] Error en upload:', error);
    } finally {
      setIsUploading(false);
    }
  };
 
   const getDocumentForType = (tipo: TipoDocumentoCustodio) => {
     return documents.find(d => d.tipo_documento === tipo);
   };
 
   if (isLoading) {
     return (
       <div className="flex items-center justify-center py-12">
         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
       </div>
     );
   }
 
   return (
     <div className="space-y-6">
       <div className="text-center">
         <h2 className="text-xl font-semibold">Documentos</h2>
         <p className="text-muted-foreground mt-1">
           Verifica que tus documentos estén vigentes
         </p>
       </div>
 
        {/* Status summary */}
        {missingDocs.length > 0 ? (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-700 dark:text-amber-400">
              Tienes {missingDocs.length} documento(s) sin registrar. Súbelos para continuar.
            </p>
          </div>
        ) : expiredDocs.length > 0 ? (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-destructive shrink-0" />
            <p className="text-sm text-destructive">
              Tienes {expiredDocs.length} documento(s) vencido(s). Actualízalos para continuar.
            </p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-lg p-4 flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <p className="text-sm text-emerald-700 dark:text-emerald-400">
              Todos tus documentos están vigentes
            </p>
          </div>
        )}
 
       {/* Document list */}
       <div className="space-y-3">
         {REQUIRED_DOCUMENTS.map((tipo) => {
           const doc = getDocumentForType(tipo);
           return (
             <DocumentCard
               key={tipo}
               tipoDocumento={tipo}
               documento={doc}
               onRequestUpdate={() => setUploadingDoc(tipo)}
               isUpdating={uploadingDoc === tipo && isUploading}
             />
           );
         })}
       </div>
 
       {/* Upload dialog */}
       <Dialog open={!!uploadingDoc} onOpenChange={(open) => !open && setUploadingDoc(null)}>
         <DialogContent className="sm:max-w-md">
           <DialogHeader>
             <DialogTitle>
               Actualizar {uploadingDoc ? DOCUMENTO_LABELS[uploadingDoc] : ''}
             </DialogTitle>
           </DialogHeader>
           
           <div className="space-y-4 py-4">
             <div className="space-y-2">
               <Label>Foto del documento</Label>
               <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                 {uploadFile ? (
                   <div className="space-y-2">
                     <FileText className="h-10 w-10 mx-auto text-primary" />
                     <p className="text-sm font-medium">{uploadFile.name}</p>
                     <Button
                       variant="ghost"
                       size="sm"
                       onClick={() => setUploadFile(null)}
                     >
                       Cambiar archivo
                     </Button>
                   </div>
                 ) : (
                   <label className="cursor-pointer">
                     <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                     <p className="mt-2 text-sm text-muted-foreground">
                       Toca para tomar foto
                     </p>
                     <input
                       type="file"
                       accept="image/*"
                       capture="environment"
                       className="hidden"
                       onChange={(e) => setUploadFile(e.target.files?.[0] || null)}
                     />
                   </label>
                 )}
               </div>
             </div>
 
             <div className="space-y-2">
               <Label htmlFor="fecha-vigencia">Fecha de vigencia</Label>
               <Input
                 id="fecha-vigencia"
                 type="date"
                 value={uploadDate}
                 onChange={(e) => setUploadDate(e.target.value)}
                 min={new Date().toISOString().split('T')[0]}
               />
             </div>
 
             <Button
               className="w-full"
               disabled={!uploadFile || !uploadDate || isUploading}
               onClick={handleUpload}
             >
               {isUploading ? 'Subiendo...' : 'Guardar documento'}
             </Button>
           </div>
         </DialogContent>
       </Dialog>
 
       {/* Continue button */}
       <Button
         className="w-full"
         size="lg"
         disabled={!canProceed}
         onClick={onComplete}
       >
         Continuar
       </Button>
     </div>
   );
 }