import { useState, useEffect, useRef, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Sparkles, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useLMSCrearCursoCompleto } from "@/hooks/lms/useLMSAdminCursos";
import { useNavigate, useBlocker } from "react-router-dom";
import { StepIdentidad } from "./wizard/StepIdentidad";
import { StepEstructura, type ModuleOutline } from "./wizard/StepEstructura";
import { StepConfiguracion } from "./wizard/StepConfiguracion";
import { StepVistaPrevia } from "./wizard/StepVistaPrevia";
import { cn } from "@/lib/utils";
import { useFormPersistence } from "@/hooks/useFormPersistence";
import { DraftRestoreBanner } from "@/components/ui/DraftAutoRestorePrompt";
import { SavingIndicator } from "@/components/workflow/SavingIndicator";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";

const cursoSchema = z.object({
  codigo: z.string().min(2, "El código debe tener al menos 2 caracteres").max(20),
  titulo: z.string().min(3, "El título debe tener al menos 3 caracteres").max(200),
  descripcion: z.string().max(1000).optional(),
  imagen_portada_url: z.string().url().optional().or(z.literal('')),
  categoria: z.enum(['onboarding', 'procesos', 'herramientas', 'compliance', 'habilidades']).optional(),
  nivel: z.enum(['basico', 'intermedio', 'avanzado']),
  duracion_estimada_min: z.coerce.number().min(1).max(9999),
  es_obligatorio: z.boolean(),
  roles_objetivo: z.array(z.string()),
  plazo_dias_default: z.coerce.number().min(1).max(365),
  activo: z.boolean(),
  publicado: z.boolean(),
  // Assessment strategy (transient - applied to quiz content on creation)
  quiz_porcentaje_aprobacion: z.coerce.number().min(50).max(100).optional(),
  quiz_intentos_permitidos: z.coerce.number().min(0).max(10).optional(),
  quiz_aleatorizar: z.boolean().optional(),
  quiz_mostrar_respuestas: z.boolean().optional(),
});

type CursoSchemaType = z.infer<typeof cursoSchema>;

interface LMSCursoWizardProps {
  onBack: () => void;
}

interface WizardDraftData {
  step: number;
  formValues: CursoSchemaType;
  modulos: ModuleOutline[];
}

const STEPS = [
  { id: 1, title: 'Identidad', subtitle: 'Nombre y descripción' },
  { id: 2, title: 'Estructura', subtitle: 'Módulos y contenidos' },
  { id: 3, title: 'Configuración', subtitle: 'Audiencia y plazos' },
  { id: 4, title: 'Vista Previa', subtitle: 'Revisar y publicar' },
];

const defaultFormValues: CursoSchemaType = {
  codigo: '',
  titulo: '',
  descripcion: '',
  imagen_portada_url: '',
  categoria: undefined,
  nivel: 'basico',
  duracion_estimada_min: 30,
  es_obligatorio: false,
  roles_objetivo: [],
  plazo_dias_default: 30,
  activo: true,
  publicado: false,
  quiz_porcentaje_aprobacion: 80,
  quiz_intentos_permitidos: 3,
  quiz_aleatorizar: false,
  quiz_mostrar_respuestas: true,
};

export function LMSCursoWizard({ onBack }: LMSCursoWizardProps) {
  const [step, setStep] = useState(1);
  const [modulos, setModulos] = useState<ModuleOutline[]>([]);
  const navigate = useNavigate();
  const crearCurso = useLMSCrearCursoCompleto();

  // Enhanced persistence hook (robust level for multi-step wizard)
  const persistence = useFormPersistence<WizardDraftData>({
    key: 'lms_curso_wizard',
    initialData: {
      step: 1,
      formValues: defaultFormValues,
      modulos: [],
    },
    level: 'robust',
    debounceMs: 400, // Aggressive autosave for consultative workflow
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    isMeaningful: (data) => !!(data.formValues?.titulo || data.modulos?.length > 0),
  });

  const { 
    data: draftData, 
    updateData, 
    clearDraft, 
    saveDraft,
    lastSaved,
    hasUnsavedChanges: unsavedChanges,
    getTimeSinceSave,
    showRestorePrompt,
    pendingRestore,
    acceptRestore,
    rejectRestore,
  } = persistence;

  const form = useForm<CursoSchemaType>({
    resolver: zodResolver(cursoSchema),
    defaultValues: defaultFormValues,
  });

  // Restore draft when accepted
  const handleRestoreDraft = () => {
    if (pendingRestore) {
      form.reset(pendingRestore.data.formValues);
      setStep(pendingRestore.data.step);
      setModulos(pendingRestore.data.modulos || []);
      acceptRestore();
      toast.success("Borrador restaurado");
    }
  };

  const handleDiscardDraft = () => {
    rejectRestore();
  };

  // Stable ref for updateData to avoid infinite render loops
  const updateDataRef = useRef(updateData);
  useEffect(() => { updateDataRef.current = updateData; });

  // Sync form changes to draft
  useEffect(() => {
    const subscription = form.watch((values) => {
      updateDataRef.current({ formValues: values as CursoSchemaType });
    });
    return () => subscription.unsubscribe();
  }, [form]);

  // Sync modulos to draft
  useEffect(() => {
    updateDataRef.current({ modulos });
  }, [modulos]);

  // Sync step to draft
  useEffect(() => {
    updateDataRef.current({ step });
  }, [step]);

  // SPA navigation guard — intercept internal navigation with unsaved changes
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      unsavedChanges &&
      currentLocation.pathname !== nextLocation.pathname
  );

  const handleBlockerSaveAndLeave = useCallback(() => {
    saveDraft();
    blocker.proceed?.();
  }, [saveDraft, blocker]);

  const handleBlockerDiscard = useCallback(() => {
    blocker.proceed?.();
  }, [blocker]);
  // Update duration when modules change
  const updateDurationFromModules = () => {
    const totalDuration = modulos.reduce((acc, mod) => 
      acc + mod.contenidos.reduce((cAcc, c) => cAcc + c.duracion_min, 0), 0
    );
    if (totalDuration > 0) {
      form.setValue('duracion_estimada_min', totalDuration);
    }
  };

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!form.watch('codigo') && !!form.watch('titulo');
      case 2:
        return true; // Structure is optional but recommended
      case 3:
        return !!form.watch('nivel');
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step === 2) {
      updateDurationFromModules();
    }
    
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onBack();
    }
  };

  const handleSubmit = async () => {
    try {
      const data = form.getValues();
      
      // Calculate final duration from modules
      const totalDuration = modulos.reduce((acc, mod) => 
        acc + mod.contenidos.reduce((cAcc, c) => cAcc + c.duracion_min, 0), 0
      ) || data.duracion_estimada_min;

      const nuevoCurso = await crearCurso.mutateAsync({
        curso: {
          codigo: data.codigo,
          titulo: data.titulo,
          descripcion: data.descripcion || undefined,
          imagen_portada_url: data.imagen_portada_url || undefined,
          categoria: data.categoria,
          nivel: data.nivel,
          duracion_estimada_min: totalDuration,
          es_obligatorio: data.es_obligatorio,
          roles_objetivo: data.roles_objetivo,
          plazo_dias_default: data.plazo_dias_default,
          activo: data.activo,
          publicado: data.publicado,
        },
        modulos,
        assessmentConfig: {
          puntuacion_minima: data.quiz_porcentaje_aprobacion ?? 80,
          intentos_permitidos: data.quiz_intentos_permitidos ?? 3,
          aleatorizar: data.quiz_aleatorizar ?? false,
          mostrar_respuestas_correctas: data.quiz_mostrar_respuestas ?? true,
        },
      });
      
      // Clear draft on successful creation
      clearDraft(true);
      
      navigate(`/lms/admin/cursos/${nuevoCurso.id}`);
    } catch (error) {
      // Error handled by mutation - draft persists
    }
  };

  const currentStep = STEPS[step - 1];
  const isSubmitting = crearCurso.isPending;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Draft Recovery Banner */}
      <DraftRestoreBanner
        visible={showRestorePrompt}
        savedAt={pendingRestore?.savedAt ? new Date(pendingRestore.savedAt) : null}
        moduleName="Curso en progreso"
        previewText={pendingRestore?.data?.formValues?.titulo}
        onRestore={handleRestoreDraft}
        onDiscard={handleDiscardDraft}
      />
        {/* Header with progress */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleBack}
              className="shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div className="flex-1">
              <h2 className="apple-text-title2">{currentStep.title}</h2>
              <p className="text-sm text-muted-foreground">{currentStep.subtitle}</p>
            </div>
            
            {/* Auto-save indicator */}
            <SavingIndicator
              isSaving={unsavedChanges}
              lastSaved={lastSaved}
              getTimeSinceSave={getTimeSinceSave}
            />
            
            <span className="text-sm text-muted-foreground">
              {step} / {STEPS.length}
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${(step / STEPS.length) * 100}%` }}
            />
          </div>

          {/* Step indicators */}
          <div className="flex justify-between mt-3">
            {STEPS.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => s.id < step && setStep(s.id)}
                disabled={s.id > step}
                className={cn(
                  "text-xs transition-colors",
                  s.id === step 
                    ? "text-primary font-medium" 
                    : s.id < step 
                      ? "text-muted-foreground cursor-pointer hover:text-foreground"
                      : "text-muted-foreground/50 cursor-not-allowed"
                )}
              >
                {s.title}
              </button>
            ))}
          </div>
        </div>

        {/* Form content */}
        <Form {...form}>
          <form onSubmit={(e) => e.preventDefault()}>
            {step === 1 && (
              <StepIdentidad 
                form={form} 
                onFullCourseGenerated={(formValues, generatedModulos) => {
                  form.setValue("codigo", formValues.codigo);
                  form.setValue("titulo", formValues.titulo);
                  form.setValue("descripcion", formValues.descripcion);
                  form.setValue("categoria", formValues.categoria as any);
                  form.setValue("duracion_estimada_min", formValues.duracion_estimada_min);
                  form.setValue("roles_objetivo", formValues.roles_objetivo);
                  setModulos(generatedModulos);
                  setStep(2);
                }}
              />
            )}
            {step === 2 && (
              <StepEstructura 
                form={form} 
                modulos={modulos} 
                onModulosChange={setModulos} 
              />
            )}
            {step === 3 && (
              <StepConfiguracion 
                form={form} 
                quizCount={modulos.reduce((acc, m) => acc + m.contenidos.filter(c => c.tipo === 'quiz').length, 0)}
              />
            )}
            {step === 4 && (
              <StepVistaPrevia 
                form={form} 
                modulos={modulos} 
              />
            )}
          </form>
        </Form>

        {/* Footer actions */}
        <div className="flex justify-between pt-8 mt-8 border-t">
          <Button 
            variant="outline" 
            onClick={handleBack}
            disabled={isSubmitting}
          >
            {step === 1 ? 'Cancelar' : 'Anterior'}
          </Button>
          
          <Button 
            className={cn(
              step === STEPS.length && "apple-button-primary"
            )}
            onClick={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Creando...
              </>
            ) : step === STEPS.length ? (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Crear Curso
              </>
            ) : (
              <>
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>

        {/* SPA Navigation Guard Dialog */}
        <AlertDialog open={blocker.state === 'blocked'}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Cambios sin guardar</AlertDialogTitle>
              <AlertDialogDescription>
                Tienes cambios pendientes en el curso. ¿Qué deseas hacer?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-0">
              <Button variant="outline" onClick={() => blocker.reset?.()}>
                Cancelar
              </Button>
              <Button variant="secondary" onClick={handleBlockerDiscard}>
                Salir sin guardar
              </Button>
              <Button onClick={handleBlockerSaveAndLeave}>
                Guardar y salir
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
  );
}
