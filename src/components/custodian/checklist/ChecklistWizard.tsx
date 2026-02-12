/**
 * Wizard principal del checklist de servicios
 * Orquesta los 4 pasos y maneja navegación
 */
import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { ChecklistProgressBar } from './ChecklistProgressBar';
import { OfflineIndicator } from './OfflineIndicator';
import { SyncStatusBanner } from './SyncStatusBanner';
import { StepDocuments } from './StepDocuments';
import { StepVehicleInspection } from './StepVehicleInspection';
import { StepVehiclePhotos } from './StepVehiclePhotos';
import { StepConfirmation } from './StepConfirmation';
import { useServiceChecklist } from '@/hooks/useServiceChecklist';
import { useOfflineSync } from '@/hooks/useOfflineSync';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { DraftIndicator } from '@/components/ui/DraftAutoRestorePrompt';
import { toast } from 'sonner';
 
 interface ChecklistWizardProps {
   servicioId: string;
   custodioTelefono: string;
   origenCoords?: { lat: number; lng: number } | null;
   onComplete?: () => void;
 }
 
 const STEPS = [
   { id: 1, label: 'Documentos' },
   { id: 2, label: 'Inspección' },
   { id: 3, label: 'Fotos' },
   { id: 4, label: 'Firma' },
 ];
 
interface ChecklistWizardState {
  currentStep: number;
  observaciones: string;
}

export function ChecklistWizard({
  servicioId,
  custodioTelefono,
  origenCoords,
  onComplete
}: ChecklistWizardProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showExitDialog, setShowExitDialog] = useState(false);

  // Form persistence for wizard state
  const persistence = useFormPersistence<ChecklistWizardState>({
    key: `checklist_wizard_${servicioId}`,
    level: 'robust',
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    initialData: { currentStep: 1, observaciones: '' },
    isMeaningful: (data) => (data?.currentStep || 1) > 1,
  });

  const [currentStep, setCurrentStep] = useState(persistence.data?.currentStep || 1);

  const {
    items,
    fotos,
    observaciones,
    firma,
    isLoading,
    isSaving,
    isOnline,
    updateItem,
    setObservaciones,
    setFirma,
    capturePhoto,
    removePhoto,
    saveChecklist,
    existingChecklist
  } = useServiceChecklist({
    servicioId,
    custodioTelefono,
    origenCoords
  });

  const { syncStatus, pendingCount } = useOfflineSync();

  // Sync step changes to persistence
  useEffect(() => {
    persistence.updateData({ currentStep, observaciones });
  }, [currentStep, observaciones]);

  const handleBack = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  }, [currentStep]);

  const handleNext = useCallback(() => {
    if (currentStep < 4) {
      setCurrentStep(prev => prev + 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    saveChecklist(undefined, {
      onSuccess: () => {
        persistence.clearDraft(true);
        queryClient.invalidateQueries({ queryKey: ['next-service'] });
        toast.success('¡Checklist completado!');
        if (onComplete) {
          onComplete();
        } else {
          navigate('/custodian');
        }
      }
    });
  }, [saveChecklist, onComplete, navigate, persistence, queryClient]);

  const handleExit = useCallback(() => {
    setShowExitDialog(true);
  }, []);

  const confirmExit = useCallback(() => {
    navigate('/custodian');
  }, [navigate]);
 
   // Show loading state
   if (isLoading) {
     return (
       <div className="flex items-center justify-center min-h-[60vh]">
         <div className="text-center space-y-4">
           <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
           <p className="text-muted-foreground">Cargando checklist...</p>
         </div>
       </div>
     );
   }
 
   // Show completed state if checklist already exists
   if (existingChecklist?.estado === 'completo') {
     return (
       <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
         <div className="w-20 h-20 rounded-full bg-emerald-500/10 flex items-center justify-center mb-6">
           <span className="text-4xl">✅</span>
         </div>
         <h2 className="text-xl font-semibold mb-2">Checklist Completado</h2>
         <p className="text-muted-foreground mb-6">
           Ya completaste el checklist para este servicio.
         </p>
         <Button onClick={() => navigate('/custodian')}>
           Volver al inicio
         </Button>
       </div>
     );
   }
 
   return (
     <div className="min-h-screen bg-background">
       {/* Header */}
       <div className="sticky top-0 z-20 bg-background/95 backdrop-blur border-b">
         <div className="container max-w-lg mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleExit}
              className="gap-1 -ml-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Salir
            </Button>
            <div className="flex items-center gap-2">
              <DraftIndicator lastSaved={persistence.lastSaved} />
              <OfflineIndicator />
            </div>
          </div>
           <ChecklistProgressBar steps={STEPS} currentStep={currentStep} />
         </div>
       </div>
 
       {/* Sync banner */}
       <SyncStatusBanner />
 
       {/* Content */}
       <div className="container max-w-lg mx-auto px-4 py-6">
         {currentStep === 1 && (
           <StepDocuments
             custodioTelefono={custodioTelefono}
             onComplete={handleNext}
           />
         )}
 
         {currentStep === 2 && (
           <StepVehicleInspection
             items={items}
             onUpdateItem={updateItem}
             onBack={handleBack}
             onComplete={handleNext}
           />
         )}
 
         {currentStep === 3 && (
           <StepVehiclePhotos
             fotos={fotos}
             onCapturePhoto={capturePhoto}
             onRemovePhoto={removePhoto}
             onBack={handleBack}
             onComplete={handleNext}
           />
         )}
 
         {currentStep === 4 && (
           <StepConfirmation
             items={items}
             fotos={fotos}
             observaciones={observaciones}
             firma={firma}
             isSaving={isSaving}
             onSetObservaciones={setObservaciones}
             onSetFirma={setFirma}
             onBack={handleBack}
             onSubmit={handleSubmit}
           />
         )}
       </div>
 
       {/* Exit confirmation dialog */}
       <AlertDialog open={showExitDialog} onOpenChange={setShowExitDialog}>
         <AlertDialogContent>
           <AlertDialogHeader>
             <AlertDialogTitle>¿Salir del checklist?</AlertDialogTitle>
             <AlertDialogDescription>
               Tu progreso se guardará automáticamente y podrás continuar después.
             </AlertDialogDescription>
           </AlertDialogHeader>
           <AlertDialogFooter>
             <AlertDialogCancel>Continuar aquí</AlertDialogCancel>
             <AlertDialogAction onClick={confirmExit}>
               Salir
             </AlertDialogAction>
           </AlertDialogFooter>
         </AlertDialogContent>
       </AlertDialog>
     </div>
   );
 }