/**
 * Página de Onboarding para nuevos custodios
 * Wizard de 3 pasos para subir documentos obligatorios
 */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, ChevronLeft, ChevronRight, CheckCircle2, FileText, AlertTriangle, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { DocumentUploadStep } from '@/components/custodian/onboarding/DocumentUploadStep';
import { useCustodianDocuments } from '@/hooks/useCustodianDocuments';
import { useCustodianProfile } from '@/hooks/useCustodianProfile';
import PhoneUpdatePrompt from '@/components/custodian/PhoneUpdatePrompt';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { TipoDocumentoCustodio } from '@/types/checklist';
import { DOCUMENTO_LABELS } from '@/types/checklist';

const REQUIRED_DOCUMENTS: TipoDocumentoCustodio[] = [
  'licencia_conducir',
  'tarjeta_circulacion',
  'poliza_seguro'
];

const STEP_INFO = [
  {
    tipo: 'licencia_conducir' as TipoDocumentoCustodio,
    title: 'Licencia de Conducir',
    description: 'Sube una foto clara de tu licencia vigente',
    icon: '🪪'
  },
  {
    tipo: 'tarjeta_circulacion' as TipoDocumentoCustodio,
    title: 'Tarjeta de Circulación',
    description: 'Sube una foto de la tarjeta de circulación del vehículo',
    icon: '🚗'
  },
  {
    tipo: 'poliza_seguro' as TipoDocumentoCustodio,
    title: 'Póliza de Seguro',
    description: 'Sube una foto de tu póliza de seguro vigente',
    icon: '📋'
  }
];

// Validador de teléfono: debe tener al menos 8 dígitos
const isPhoneValid = (phone: string | undefined): boolean => {
  if (!phone) return false;
  const digitsOnly = phone.replace(/[^0-9]/g, '');
  return digitsOnly.length >= 8;
};

export default function CustodianOnboarding() {
  const navigate = useNavigate();
  const { profile, loading: profileLoading, updateProfile, refetch: refetchProfile } = useCustodianProfile();
  const phoneValid = isPhoneValid(profile?.phone);
  const { documents, updateDocument, refetch } = useCustodianDocuments(phoneValid ? profile?.phone : undefined);
  
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPhonePrompt, setShowPhonePrompt] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);

  // Log de montaje para debugging - v10 (sin toast de teléfono para evitar re-renders)
  useEffect(() => {
    console.log('[CustodianOnboarding] v10 - Estado:', {
      hasProfile: !!profile,
      phone: profile?.phone,
      phoneValid,
      documentsCount: documents.length
    });
    // v10: Eliminado toast de teléfono - causaba confusión al dispararse en cada refetch
  }, [profile, profileLoading, phoneValid]); // v10: Removido 'documents' de deps

  // Verificar documentos ya subidos
  useEffect(() => {
    if (documents.length > 0) {
      const completed = new Set<number>();
      REQUIRED_DOCUMENTS.forEach((tipo, index) => {
        const doc = documents.find(d => d.tipo_documento === tipo);
        if (doc && new Date(doc.fecha_vigencia) >= new Date()) {
          completed.add(index);
        }
      });
      setCompletedSteps(completed);
    }
  }, [documents]);

  const progress = (completedSteps.size / REQUIRED_DOCUMENTS.length) * 100;
  const isStepCompleted = completedSteps.has(currentStep);
  const allStepsCompleted = completedSteps.size === REQUIRED_DOCUMENTS.length;

  const handleDocumentUpload = async (file: File, fechaVigencia: string) => {
    const tipoDocumento = REQUIRED_DOCUMENTS[currentStep];
    
    try {
      await updateDocument.mutateAsync({
        tipoDocumento,
        file,
        fechaVigencia
      });
      
      // Marcar paso como completado
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      
      // Avanzar al siguiente paso automáticamente
      if (currentStep < REQUIRED_DOCUMENTS.length - 1) {
        setTimeout(() => setCurrentStep(prev => prev + 1), 500);
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      // Re-lanzar para que DocumentUploadStep muestre UI de error específica
      throw error;
    }
  };

  const handleComplete = async () => {
    if (!profile?.id) return;
    
    setIsSubmitting(true);
    try {
      // Marcar onboarding como completado en profiles
      const { error } = await supabase
        .from('profiles')
        .update({ onboarding_completado: true })
        .eq('id', profile.id);

      if (error) throw error;

      toast.success('¡Documentos registrados exitosamente!');
      navigate('/custodian');
    } catch (error) {
      console.error('Error completing onboarding:', error);
      toast.error('Error al completar el registro');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Handler para actualizar teléfono desde el prompt
  const handlePhoneUpdate = async (newPhone: string): Promise<boolean> => {
    setPhoneError(null);
    const success = await updateProfile({ phone: newPhone });
    
    if (success) {
      toast.success('Teléfono actualizado correctamente');
      await refetchProfile(); // Recargar perfil para validar de nuevo
      return true;
    } else {
      setPhoneError('No se pudo actualizar el teléfono. Intenta de nuevo.');
      return false;
    }
  };

  // Validación anticipada: teléfono inválido bloquea el flujo
  if (!phoneValid) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mx-auto">
                <AlertTriangle className="w-8 h-8 text-amber-500" />
              </div>
              <h2 className="text-xl font-semibold">Teléfono no válido</h2>
              <p className="text-muted-foreground">
                Para subir documentos necesitas un número de teléfono válido registrado en tu perfil.
              </p>
              <div className="bg-muted rounded-lg p-3 text-sm">
                <div className="flex items-center gap-2 justify-center text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>Tu número actual: <strong>"{profile?.phone || 'No registrado'}"</strong></span>
                </div>
              </div>
              
              <div className="space-y-2 pt-2">
                <Button 
                  onClick={() => setShowPhonePrompt(true)}
                  className="w-full"
                >
                  <Phone className="w-4 h-4 mr-2" />
                  Actualizar mi teléfono
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={() => navigate('/custodian')}
                  className="w-full"
                >
                  Volver al inicio
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dialog para actualizar teléfono */}
        <PhoneUpdatePrompt
          open={showPhonePrompt}
          onOpenChange={setShowPhonePrompt}
          currentPhone={profile?.phone}
          onPhoneUpdated={handlePhoneUpdate}
          errorMessage={phoneError}
        />
      </div>
    );
  }

  const currentStepInfo = STEP_INFO[currentStep];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-6 safe-top">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold">Registro de Documentos</h1>
              <p className="text-sm opacity-80">Paso {currentStep + 1} de {REQUIRED_DOCUMENTS.length}</p>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2 bg-primary-foreground/20" />
            <div className="flex justify-between text-xs opacity-80">
              <span>{completedSteps.size} de {REQUIRED_DOCUMENTS.length} documentos</span>
              <span>{Math.round(progress)}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-lg mx-auto px-4 py-6">
        {/* Step indicators */}
        <div className="flex justify-center gap-2 mb-6">
          {STEP_INFO.map((step, index) => (
            <button
              key={step.tipo}
              onClick={() => setCurrentStep(index)}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center text-lg
                transition-all duration-200
                ${index === currentStep 
                  ? 'bg-primary text-primary-foreground scale-110' 
                  : completedSteps.has(index)
                    ? 'bg-emerald-500 text-white'
                    : 'bg-muted text-muted-foreground'
                }
              `}
            >
              {completedSteps.has(index) ? <CheckCircle2 className="w-5 h-5" /> : step.icon}
            </button>
          ))}
        </div>

        {/* Current step card */}
        <Card className="mb-6">
          <CardHeader className="text-center pb-2">
            <div className="text-4xl mb-2">{currentStepInfo.icon}</div>
            <CardTitle>{currentStepInfo.title}</CardTitle>
            <CardDescription>{currentStepInfo.description}</CardDescription>
          </CardHeader>
          <CardContent>
            {/* v8: key prop para estabilizar componente y evitar pérdida de estado */}
            <DocumentUploadStep
              key={`doc-step-${currentStepInfo.tipo}`}
              tipoDocumento={currentStepInfo.tipo}
              existingDocument={documents.find(d => d.tipo_documento === currentStepInfo.tipo)}
              onUpload={handleDocumentUpload}
              isUploading={updateDocument.isPending}
            />
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(prev => prev - 1)}
            disabled={currentStep === 0}
            className="flex-1"
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            Anterior
          </Button>
          
          {currentStep < REQUIRED_DOCUMENTS.length - 1 ? (
            <Button
              onClick={() => setCurrentStep(prev => prev + 1)}
              disabled={!isStepCompleted}
              className="flex-1"
            >
              Siguiente
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          ) : (
            <Button
              onClick={handleComplete}
              disabled={!allStepsCompleted || isSubmitting}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700"
            >
              {isSubmitting ? 'Guardando...' : 'Completar Registro'}
              <CheckCircle2 className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>

        {/* Status summary */}
        <Card className="mt-6">
          <CardContent className="py-4">
            <h3 className="font-medium mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Estado de documentos
            </h3>
            <div className="space-y-2">
              {STEP_INFO.map((step, index) => (
                <div 
                  key={step.tipo}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="flex items-center gap-2">
                    <span>{step.icon}</span>
                    {DOCUMENTO_LABELS[step.tipo]}
                  </span>
                  {completedSteps.has(index) ? (
                    <span className="text-emerald-600 font-medium flex items-center gap-1">
                      <CheckCircle2 className="w-4 h-4" />
                      Listo
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pendiente</span>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
