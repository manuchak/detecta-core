import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ServiceCreationSidebar from './ServiceCreationSidebar';
import { useServiceCreation, ServiceCreationProvider, getPreviewText } from './hooks/useServiceCreation';
import { DraftAutoRestorePrompt } from '@/components/ui/DraftAutoRestorePrompt';

// Step components
import RouteStepPlaceholder from './steps/RouteStep';
import ServiceStepPlaceholder from './steps/ServiceStep';
import CustodianStepPlaceholder from './steps/CustodianStep';
import ArmedStepPlaceholder from './steps/ArmedStep';
import ConfirmationStepPlaceholder from './steps/ConfirmationStep';

function ServiceCreationContent() {
  const navigate = useNavigate();
  const { 
    currentStep, 
    formData, 
    completedSteps,
    // Orphan draft restore
    showRestorePrompt,
    pendingRestore,
    acceptRestore,
    rejectRestore,
    dismissRestorePrompt,
  } = useServiceCreation();

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'route':
        return <RouteStepPlaceholder />;
      case 'service':
        return <ServiceStepPlaceholder />;
      case 'custodian':
        return <CustodianStepPlaceholder />;
      case 'armed':
        return <ArmedStepPlaceholder />;
      case 'confirmation':
        return <ConfirmationStepPlaceholder />;
      default:
        return <RouteStepPlaceholder />;
    }
  };

  // Get preview text for restore prompt
  const previewText = pendingRestore?.formData 
    ? getPreviewText(pendingRestore.formData) 
    : '';
  
  // Get saved at date for restore prompt
  const savedAt = pendingRestore?.savedAt 
    ? new Date(pendingRestore.savedAt) 
    : null;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-muted/30">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
        <div className="container flex h-14 items-center gap-4 px-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/planeacion')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Planeación
          </Button>
          <div className="h-4 w-px bg-border" />
          <h1 className="text-lg font-semibold">Crear Nuevo Servicio</h1>
        </div>
      </div>

      {/* Main content grid */}
      <div className="container px-4 py-4">
        <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">
          {/* Sidebar - only progress */}
          <aside className="hidden lg:block">
            <div className="sticky top-20">
              <ServiceCreationSidebar />
            </div>
          </aside>

          {/* Main content */}
          <main className="min-w-0">
            <div className="apple-card p-6">
              {renderCurrentStep()}
            </div>
          </main>
        </div>
      </div>

      {/* Orphan Draft Restore Prompt */}
      <DraftAutoRestorePrompt
        visible={showRestorePrompt}
        savedAt={savedAt}
        previewText={previewText}
        moduleName="Creación de Servicio"
        onRestore={acceptRestore}
        onDiscard={rejectRestore}
        onDismiss={dismissRestorePrompt}
      />
    </div>
  );
}

export default function ServiceCreationLayout() {
  return (
    <ServiceCreationProvider>
      <ServiceCreationContentWithAutoSave />
    </ServiceCreationProvider>
  );
}

// Wrapper to handle auto-save on page unload (beforeunload as last fallback)
// Note: Primary autosave is now handled in useServiceCreation via visibilitychange/pagehide/debounce
function ServiceCreationContentWithAutoSave() {
  const { hasUnsavedChanges, saveDraft } = useServiceCreation();
  
  // beforeunload as final fallback (visibilitychange/pagehide handle most cases)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (hasUnsavedChanges) {
        saveDraft({ silent: true });
      }
    };
    
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges, saveDraft]);
  
  return <ServiceCreationContent />;
}
