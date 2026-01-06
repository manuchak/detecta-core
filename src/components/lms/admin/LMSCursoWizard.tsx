import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, ArrowRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form } from "@/components/ui/form";
import { useLMSCrearCurso } from "@/hooks/lms/useLMSAdminCursos";
import { useNavigate } from "react-router-dom";
import { StepIdentidad } from "./wizard/StepIdentidad";
import { StepConfiguracion } from "./wizard/StepConfiguracion";
import { StepAudiencia } from "./wizard/StepAudiencia";
import { StepRevisar } from "./wizard/StepRevisar";
import type { CursoFormData } from "@/types/lms";
import { cn } from "@/lib/utils";

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
});

type CursoSchemaType = z.infer<typeof cursoSchema>;

interface LMSCursoWizardProps {
  onBack: () => void;
}

const STEPS = [
  { id: 1, title: 'Identidad', subtitle: 'Nombre y descripción del curso' },
  { id: 2, title: 'Configuración', subtitle: 'Categoría, nivel y duración' },
  { id: 3, title: 'Audiencia', subtitle: 'Roles objetivo y obligatoriedad' },
  { id: 4, title: 'Revisar', subtitle: 'Confirma y publica' },
];

export function LMSCursoWizard({ onBack }: LMSCursoWizardProps) {
  const [step, setStep] = useState(1);
  const navigate = useNavigate();
  const crearCurso = useLMSCrearCurso();

  const form = useForm<CursoSchemaType>({
    resolver: zodResolver(cursoSchema),
    defaultValues: {
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
    },
  });

  const canProceed = (): boolean => {
    switch (step) {
      case 1:
        return !!form.watch('codigo') && !!form.watch('titulo');
      case 2:
        return !!form.watch('nivel') && !!form.watch('duracion_estimada_min');
      case 3:
        return true; // Roles son opcionales
      case 4:
        return true;
      default:
        return false;
    }
  };

  const handleNext = async () => {
    if (step < STEPS.length) {
      setStep(step + 1);
    } else {
      // Submit
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
      const formData: CursoFormData = {
        codigo: data.codigo,
        titulo: data.titulo,
        descripcion: data.descripcion || undefined,
        imagen_portada_url: data.imagen_portada_url || undefined,
        categoria: data.categoria,
        nivel: data.nivel,
        duracion_estimada_min: data.duracion_estimada_min,
        es_obligatorio: data.es_obligatorio,
        roles_objetivo: data.roles_objetivo,
        plazo_dias_default: data.plazo_dias_default,
        activo: data.activo,
        publicado: data.publicado,
      };

      const nuevoCurso = await crearCurso.mutateAsync(formData);
      // Navigate to course detail instead of list
      navigate(`/lms/admin/cursos/${nuevoCurso.id}`);
    } catch (error) {
      // Error handled by mutation
    }
  };

  const currentStep = STEPS[step - 1];
  const isSubmitting = crearCurso.isPending;

  return (
    <div className="max-w-2xl mx-auto">
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
          {step === 1 && <StepIdentidad form={form} />}
          {step === 2 && <StepConfiguracion form={form} />}
          {step === 3 && <StepAudiencia form={form} />}
          {step === 4 && <StepRevisar form={form} />}
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
    </div>
  );
}
